import { useEffect, useRef, useState } from 'react';

const API_URL = '';
const ADMIN_SESSION_STORAGE_KEY = 'bookingPlatformAdminSession';
const ADMIN_NEW_APPOINTMENTS_STORAGE_KEY = 'bookingPlatformAdminNewAppointments';
const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

function timeSpanToString(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.length >= 8 ? value.slice(0, 8) : value;
  if (typeof value === 'object') {
    if (typeof value.hours === 'number' && typeof value.minutes === 'number' && typeof value.seconds === 'number') {
      return [value.hours, value.minutes, value.seconds].map((n) => String(n).padStart(2, '0')).join(':');
    }
    if (typeof value.totalHours === 'number') {
      const hours = Math.floor(value.totalHours);
      const minutes = Math.floor((value.totalMinutes || 0) % 60);
      const seconds = Math.floor((value.totalSeconds || 0) % 60);
      return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
    }
  }
  return '';
}

function parseUtcDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const hasTimeZone = /([zZ]|[+-]\d{2}:\d{2})$/.test(value);
    return new Date(hasTimeZone ? value : `${value}Z`);
  }
  return new Date(value);
}

function getLocalEndOfDayUtcIso() {
  const now = new Date();
  const endOfDayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return endOfDayLocal.toISOString();
}

const emptyService = { name: '', description: '', durationMinutes: 30, price: 0, isActive: true };
const emptyHour = { dayOfWeek: 1, from: '08:00:00', to: '18:00:00', isActive: true };
const emptyException = { date: '', from: '', to: '', type: 'Urlaub', description: '', employeeId: '' };

const styles = {
  page: { maxWidth: 1260, margin: '0 auto', padding: '28px 18px 80px', color: 'var(--color-text)' },
  intro: { borderBottom: '1px solid var(--color-border-soft)', paddingBottom: 18, marginBottom: 18 },
  card: { border: '1px solid var(--color-border-mid)', borderRadius: 0, padding: 18, marginTop: 14, background: 'var(--color-surface)' },
  row: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  form: { display: 'grid', gap: 8, maxWidth: 720 },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: 10, background: 'var(--color-white)' },
  thtd: { border: '1px solid var(--color-border-soft)', padding: 8, verticalAlign: 'top', textAlign: 'left', fontSize: 13 },
};

export default function AdminPage() {
  const [subdomain, setSubdomain] = useState('salon-beispiel');
  const [email, setEmail] = useState('admin@salon-beispiel.local');
  const [password, setPassword] = useState('Admin123!');
  const [token, setToken] = useState('');
  const [activeTab, setActiveTab] = useState('appointments');

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [hours, setHours] = useState([]);
  const [exceptions, setExceptions] = useState([]);

  const [appointments, setAppointments] = useState([]);
  const [appointmentEmployeeFilter, setAppointmentEmployeeFilter] = useState('');
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [appointmentSortBy, setAppointmentSortBy] = useState('startTime');
  const [appointmentSortDir, setAppointmentSortDir] = useState('asc');
  const [appointmentFromDate, setAppointmentFromDate] = useState('');
  const [appointmentToDate, setAppointmentToDate] = useState('');
  const [appointmentPage, setAppointmentPage] = useState(1);
  const [appointmentPageSize, setAppointmentPageSize] = useState(10);
  const [appointmentTotal, setAppointmentTotal] = useState(0);

  const [exceptionEmployeeFilter, setExceptionEmployeeFilter] = useState('');

  const [notifications, setNotifications] = useState([]);
  const [notificationPage, setNotificationPage] = useState(1);
  const [notificationPageSize] = useState(20);
  const [notificationTotal, setNotificationTotal] = useState(0);

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize] = useState(20);
  const [auditTotal, setAuditTotal] = useState(0);

  const knownNotificationIdsRef = useRef(new Set());
  const notificationSnapshotInitializedRef = useRef(false);

  const [serviceForm, setServiceForm] = useState(emptyService);
  const [editingServiceId, setEditingServiceId] = useState(null);

  const [hourForm, setHourForm] = useState(emptyHour);
  const [editingHourId, setEditingHourId] = useState(null);

  const [exceptionForm, setExceptionForm] = useState(emptyException);
  const [editingExceptionId, setEditingExceptionId] = useState(null);

  const [rescheduleByAppointmentId, setRescheduleByAppointmentId] = useState({});
  const [assignEmployeeByAppointmentId, setAssignEmployeeByAppointmentId] = useState({});
  const [newAppointmentIds, setNewAppointmentIds] = useState({});

  function saveSession(nextToken, expiresAtUtc) {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, JSON.stringify({
      token: nextToken,
      expiresAtUtc,
      subdomain,
      email,
    }));
  }

  function clearSession() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      window.localStorage.removeItem(ADMIN_NEW_APPOINTMENTS_STORAGE_KEY);
    }

    setToken('');
    setNewAppointmentIds({});
    knownNotificationIdsRef.current = new Set();
    notificationSnapshotInitializedRef.current = false;
  }

  async function api(path, options = {}, customToken) {
    const t = customToken === undefined ? token : customToken;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
    };

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (!res.ok) {
      let message = `Request fehlgeschlagen (${res.status})`;
      try {
        const payload = await res.json();
        message = payload.message || Object.values(payload)[0]?.[0] || message;
      } catch (_) {}

      if (res.status === 401) {
        clearSession();
        message = 'Session abgelaufen. Bitte erneut einloggen.';
      }

      throw new Error(message);
    }

    if (res.status === 204) return null;
    return res.json();
  }

  function clearMessages() {
    setError('');
    setNotice('');
  }

  function markAppointmentsAsNew(appointmentIds = []) {
    const ids = appointmentIds.filter(Boolean);
    if (ids.length === 0) return;

    setNewAppointmentIds((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        next[String(id)] = true;
      });

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ADMIN_NEW_APPOINTMENTS_STORAGE_KEY, JSON.stringify(next));
      }

      return next;
    });
  }

  function markAppointmentAsSeen(appointmentId) {
    if (!appointmentId) return;

    setNewAppointmentIds((prev) => {
      const key = String(appointmentId);
      if (!prev[key]) return prev;

      const next = { ...prev };
      delete next[key];

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ADMIN_NEW_APPOINTMENTS_STORAGE_KEY, JSON.stringify(next));
      }

      return next;
    });
  }

  function validateService() {
    if (!serviceForm.name.trim()) return 'Leistungsname ist erforderlich.';
    const duration = Number(serviceForm.durationMinutes);
    if (duration < 30 || duration % 30 !== 0) return 'Dauer muss mindestens 30 und in 30er-Schritten sein.';
    if (Number(serviceForm.price) < 0) return 'Preis darf nicht negativ sein.';
    return null;
  }

  function validateHour() {
    if (!hourForm.from || !hourForm.to) return 'Von/Bis sind erforderlich.';
    if (hourForm.from >= hourForm.to) return 'Von muss vor Bis liegen.';
    return null;
  }

  function validateException() {
    if (!exceptionForm.date) return 'Datum ist erforderlich.';
    const onlyOneTime = (exceptionForm.from && !exceptionForm.to) || (!exceptionForm.from && exceptionForm.to);
    if (onlyOneTime) return 'Von und Bis müssen gemeinsam gesetzt werden.';
    if (exceptionForm.from && exceptionForm.to && exceptionForm.from >= exceptionForm.to) return 'Von muss vor Bis liegen.';
    if (!exceptionForm.type.trim()) return 'Typ ist erforderlich.';
    return null;
  }

  function buildAppointmentQueryParams(page = appointmentPage, pageSize = appointmentPageSize) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (appointmentEmployeeFilter) params.set('employeeId', appointmentEmployeeFilter);
    if (appointmentSearch.trim()) params.set('search', appointmentSearch.trim());
    if (appointmentSortBy) params.set('sortBy', appointmentSortBy);
    if (appointmentSortDir) params.set('sortDir', appointmentSortDir);
    if (appointmentFromDate) params.set('fromUtc', `${appointmentFromDate}T00:00:00Z`);
    if (appointmentToDate) params.set('toUtc', `${appointmentToDate}T23:59:59Z`);
    return params;
  }

  async function login() {
    clearMessages();
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ subdomain, email, password }),
      }, null);

      knownNotificationIdsRef.current = new Set();
      notificationSnapshotInitializedRef.current = false;

      if (typeof window !== 'undefined') {
        try {
          const rawNewAppointments = window.localStorage.getItem(ADMIN_NEW_APPOINTMENTS_STORAGE_KEY);
          setNewAppointmentIds(rawNewAppointments ? JSON.parse(rawNewAppointments) : {});
        } catch (_) {
          setNewAppointmentIds({});
        }
      }

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(() => {});
      }

      const expiresAtUtc = data.expiresAtUtc || getLocalEndOfDayUtcIso();
      saveSession(data.token, expiresAtUtc);

      setToken(data.token);
      await loadAll(data.token, 1);
      setNotice('Login erfolgreich. Session gültig bis Tagesende.');
    } catch (e) {
      setError(e.message || 'Login fehlgeschlagen');
    }
  }

  function logout() {
    clearMessages();
    clearSession();
    setNotice('Erfolgreich ausgeloggt.');
  }

  async function loadAll(t = token, page = appointmentPage, notifPage = notificationPage, audPage = auditPage) {
    try {
      const appointmentParams = buildAppointmentQueryParams(page, appointmentPageSize);
      const exceptionQuery = exceptionEmployeeFilter ? `?employeeId=${exceptionEmployeeFilter}` : '';

      const [emp, s, h, ex, a, n, al] = await Promise.all([
        api('/api/admin/employees', {}, t),
        api('/api/admin/services', {}, t),
        api('/api/admin/business-hours', {}, t),
        api(`/api/admin/exceptions${exceptionQuery}`, {}, t),
        api(`/api/admin/appointments?${appointmentParams.toString()}`, {}, t),
        api(`/api/admin/notifications?page=${notifPage}&pageSize=${notificationPageSize}`, {}, t),
        api(`/api/admin/audit-logs?page=${audPage}&pageSize=${auditPageSize}`, {}, t),
      ]);

      setEmployees(emp || []);
      setServices(s || []);
      setHours((h || []).map((item) => ({
        ...item,
        from: timeSpanToString(item.from),
        to: timeSpanToString(item.to),
      })));
      setExceptions(ex || []);

      setAppointments(a?.items || []);
      setAppointmentTotal(a?.total || 0);
      setAppointmentPage(a?.page || page);

      setNotifications(n?.items || []);
      setNotificationTotal(n?.total || 0);
      setNotificationPage(n?.page || notifPage);

      setAuditLogs(al?.items || []);
      setAuditTotal(al?.total || 0);
      setAuditPage(al?.page || audPage);
    } catch (e) {
      setError(e.message);
    }
  }

  async function exportAppointmentsCsv() {
    clearMessages();
    try {
      const params = buildAppointmentQueryParams(1, appointmentPageSize);
      const res = await fetch(`${API_URL}/api/admin/appointments/export-csv?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`CSV Export fehlgeschlagen (${res.status})`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'appointments.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setNotice('CSV exportiert.');
    } catch (e) {
      setError(e.message);
    }
  }

  async function submitService(e) {
    e.preventDefault();
    clearMessages();
    const validationError = validateService();
    if (validationError) return setError(validationError);

    try {
      const method = editingServiceId ? 'PUT' : 'POST';
      const path = editingServiceId ? `/api/admin/services/${editingServiceId}` : '/api/admin/services';
      await api(path, {
        method,
        body: JSON.stringify({
          ...serviceForm,
          durationMinutes: Number(serviceForm.durationMinutes),
          price: Number(serviceForm.price),
        }),
      });
      setServiceForm(emptyService);
      setEditingServiceId(null);
      setNotice('Leistung gespeichert.');
      await loadAll();
    } catch (e2) {
      setError(e2.message);
    }
  }

  async function submitHour(e) {
    e.preventDefault();
    clearMessages();
    const validationError = validateHour();
    if (validationError) return setError(validationError);

    try {
      const method = editingHourId ? 'PUT' : 'POST';
      const path = editingHourId ? `/api/admin/business-hours/${editingHourId}` : '/api/admin/business-hours';
      await api(path, { method, body: JSON.stringify({ ...hourForm, dayOfWeek: Number(hourForm.dayOfWeek) }) });
      setHourForm(emptyHour);
      setEditingHourId(null);
      setNotice('Öffnungszeit gespeichert.');
      await loadAll();
    } catch (e2) {
      setError(e2.message);
    }
  }

  async function submitException(e) {
    e.preventDefault();
    clearMessages();
    const validationError = validateException();
    if (validationError) return setError(validationError);

    try {
      const method = editingExceptionId ? 'PUT' : 'POST';
      const path = editingExceptionId ? `/api/admin/exceptions/${editingExceptionId}` : '/api/admin/exceptions';
      await api(path, {
        method,
        body: JSON.stringify({
          date: `${exceptionForm.date}T00:00:00Z`,
          from: exceptionForm.from ? `${exceptionForm.from}:00` : null,
          to: exceptionForm.to ? `${exceptionForm.to}:00` : null,
          type: exceptionForm.type,
          description: exceptionForm.description,
          employeeId: exceptionForm.employeeId || null,
        }),
      });
      setExceptionForm(emptyException);
      setEditingExceptionId(null);
      setNotice('Ausnahme gespeichert.');
      await loadAll();
    } catch (e2) {
      setError(e2.message);
    }
  }

  async function cancelAppointment(id) {
    clearMessages();
    try {
      await api(`/api/admin/appointments/${id}/cancel`, { method: 'PATCH' });
      setNotice('Termin storniert.');
      await loadAll();
    } catch (e) {
      setError(e.message);
    }
  }

  async function rescheduleAppointment(id) {
    clearMessages();
    const localValue = rescheduleByAppointmentId[id];
    if (!localValue) return setError('Bitte neue Terminzeit wählen.');

    try {
      await api(`/api/admin/appointments/${id}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({ newStartTimeUtc: new Date(localValue).toISOString() }),
      });
      setRescheduleByAppointmentId((prev) => ({ ...prev, [id]: '' }));
      setNotice('Termin umgebucht.');
      await loadAll();
    } catch (e) {
      setError(e.message);
    }
  }

  async function assignEmployee(id) {
    clearMessages();
    try {
      await api(`/api/admin/appointments/${id}/assign-employee`, {
        method: 'PATCH',
        body: JSON.stringify({ employeeId: assignEmployeeByAppointmentId[id] || null }),
      });
      setNotice('Mitarbeiter-Zuweisung gespeichert.');
      await loadAll();
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const raw = window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    if (!raw) return undefined;

    try {
      const session = JSON.parse(raw);
      if (!session?.token || !session?.expiresAtUtc) {
        window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
        return undefined;
      }

      const expiresAt = new Date(session.expiresAtUtc);
      if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
        window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
        return undefined;
      }

      knownNotificationIdsRef.current = new Set();
      notificationSnapshotInitializedRef.current = false;

      try {
        const rawNewAppointments = window.localStorage.getItem(ADMIN_NEW_APPOINTMENTS_STORAGE_KEY);
        setNewAppointmentIds(rawNewAppointments ? JSON.parse(rawNewAppointments) : {});
      } catch (_) {
        setNewAppointmentIds({});
      }

      if (session.subdomain) setSubdomain(session.subdomain);
      if (session.email) setEmail(session.email);

      setToken(session.token);
      loadAll(session.token, 1)
        .then(() => setNotice('Session wiederhergestellt.'))
        .catch(() => {
          window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
          setToken('');
        });
    } catch (_) {
      window.localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    }

    return undefined;
  }, []);

  useEffect(() => {
    if (!token || typeof window === 'undefined') return undefined;

    const timer = setInterval(() => {
      const raw = window.localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
      if (!raw) return;

      try {
        const session = JSON.parse(raw);
        const expiresAt = new Date(session.expiresAtUtc);
        if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
          clearSession();
          setNotice('Session ist abgelaufen (Tagesende). Bitte erneut einloggen.');
        }
      } catch (_) {
        clearSession();
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;

    const poll = async () => {
      try {
        const data = await api(`/api/admin/notifications?page=1&pageSize=${notificationPageSize}`, {}, token);
        const items = data?.items || [];

        const known = knownNotificationIdsRef.current;

        if (!notificationSnapshotInitializedRef.current) {
          items.forEach((item) => known.add(item.id));
          notificationSnapshotInitializedRef.current = true;
          return;
        }

        const newBookingEvents = items.filter((item) => item.type === 'BookingCompany' && !known.has(item.id));
        items.forEach((item) => known.add(item.id));

        if (newBookingEvents.length > 0) {
          setNotice(`Neue Buchung eingegangen (${newBookingEvents.length}).`);
          markAppointmentsAsNew(newBookingEvents.map((item) => item.appointmentId));

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('Neue Terminbuchung', {
              body: `Es wurde ${newBookingEvents.length === 1 ? 'ein neuer Termin' : `${newBookingEvents.length} neue Termine`} gebucht.`,
            });
          }

          await loadAll(token, appointmentPage, 1, auditPage);
        }
      } catch (_) {
      }
    };

    poll();
    const timer = setInterval(poll, 15000);
    return () => clearInterval(timer);
  }, [token, notificationPageSize, activeTab]);

  const appointmentTotalPages = Math.max(1, Math.ceil(appointmentTotal / appointmentPageSize));
  const notificationTotalPages = Math.max(1, Math.ceil(notificationTotal / notificationPageSize));
  const auditTotalPages = Math.max(1, Math.ceil(auditTotal / auditPageSize));

  return (
    <main style={styles.page} className="admin-premium">
      <header style={styles.intro}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <p className="overline">Backoffice</p>
          {token && <button className="btn-outline" style={{ width: 'auto' }} onClick={logout}>Ausloggen</button>}
        </div>
        <h1>Admin Atelier</h1>
        <p className="lead">Reduzierte Oberfläche für Planung, Qualitätssicherung und saubere Terminprozesse.</p>
      </header>

      {!token && (
        <div style={styles.card}>
          <h2 className="section-title">Login</h2>
          <div style={{ ...styles.form, maxWidth: 460 }}>
            <input value={subdomain} onChange={(e) => setSubdomain(e.target.value)} placeholder="Subdomain" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-Mail" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Passwort" type="password" />
            <button className="btn-outline" onClick={login}>Login</button>
          </div>
        </div>
      )}

      {error && <p className="feedback error">{error}</p>}
      {notice && <p className="feedback success">{notice}</p>}

      {token && (
        <>
          <div style={{ ...styles.card, ...styles.row }}>
            <button className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>Termine</button>
            <button className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>Leistungen</button>
            <button className={`tab-btn ${activeTab === 'hours' ? 'active' : ''}`} onClick={() => setActiveTab('hours')}>Öffnungszeiten</button>
            <button className={`tab-btn ${activeTab === 'exceptions' ? 'active' : ''}`} onClick={() => setActiveTab('exceptions')}>Ausnahmen</button>
            <button className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>Benachrichtigungen</button>
            <button className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>Audit Logs</button>
          </div>

          {activeTab === 'appointments' && (
            <section style={styles.card}>
              <h2 className="section-title">Termine</h2>
              <div style={styles.row}>
                <select value={appointmentEmployeeFilter} onChange={(e) => setAppointmentEmployeeFilter(e.target.value)}>
                  <option value="">Alle Mitarbeiter</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
                <input placeholder="Suche Kunde/Leistung" value={appointmentSearch} onChange={(e) => setAppointmentSearch(e.target.value)} />
                <input type="date" value={appointmentFromDate} onChange={(e) => setAppointmentFromDate(e.target.value)} />
                <input type="date" value={appointmentToDate} onChange={(e) => setAppointmentToDate(e.target.value)} />
                <select value={appointmentSortBy} onChange={(e) => setAppointmentSortBy(e.target.value)}>
                  <option value="startTime">Sortierung: Zeit</option>
                  <option value="customer">Sortierung: Kunde</option>
                  <option value="service">Sortierung: Leistung</option>
                  <option value="status">Sortierung: Status</option>
                </select>
                <select value={appointmentSortDir} onChange={(e) => setAppointmentSortDir(e.target.value)}>
                  <option value="asc">Aufsteigend</option>
                  <option value="desc">Absteigend</option>
                </select>
                <select value={appointmentPageSize} onChange={(e) => setAppointmentPageSize(Number(e.target.value))}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <button className="btn-outline" onClick={() => loadAll(token, 1)}>Filter anwenden</button>
                <button className="btn-outline" onClick={exportAppointmentsCsv}>CSV exportieren</button>
              </div>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.thtd}>Zeit</th>
                    <th style={styles.thtd}>Kunde</th>
                    <th style={styles.thtd}>Leistung</th>
                    <th style={styles.thtd}>Status</th>
                    <th style={styles.thtd}>Mitarbeiter</th>
                    <th style={styles.thtd}>Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => {
                    const isNewAppointment = !!newAppointmentIds[a.id];

                    return (
                      <tr key={a.id} className={isNewAppointment ? 'new-appointment-row' : ''}>
                        <td style={styles.thtd}>{parseUtcDate(a.startTimeUtc).toLocaleString('de-DE')}</td>
                        <td style={styles.thtd}>{a.customer}</td>
                        <td style={styles.thtd}>{a.service}</td>
                        <td style={styles.thtd}>
                          <span>{a.status}</span>
                          {isNewAppointment && (
                            <>
                              <span className="new-badge">Neu</span>
                              <button type="button" className="seen-btn" onClick={() => markAppointmentAsSeen(a.id)}>Als gesehen</button>
                            </>
                          )}
                        </td>
                        <td style={styles.thtd}>
                          <div>{a.employeeName || 'nicht zugewiesen'}</div>
                          <div style={{ ...styles.row, marginTop: 6 }}>
                            <select
                              value={assignEmployeeByAppointmentId[a.id] ?? (a.employeeId || '')}
                              onChange={(e) => setAssignEmployeeByAppointmentId((prev) => ({ ...prev, [a.id]: e.target.value }))}
                            >
                              <option value="">Keine Zuweisung</option>
                              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                            </select>
                            <button className="btn-outline" onClick={() => assignEmployee(a.id)}>Speichern</button>
                          </div>
                        </td>
                        <td style={styles.thtd}>
                          {a.status !== 'Cancelled' && (
                            <div style={{ display: 'grid', gap: 6 }}>
                              <button className="btn-outline" onClick={() => cancelAppointment(a.id)}>Stornieren</button>
                              <input
                                type="datetime-local"
                                value={rescheduleByAppointmentId[a.id] || ''}
                                onChange={(e) => setRescheduleByAppointmentId((prev) => ({ ...prev, [a.id]: e.target.value }))}
                              />
                              <button className="btn-outline" onClick={() => rescheduleAppointment(a.id)}>Umbuchen</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ ...styles.row, marginTop: 10 }}>
                <button className="btn-outline" disabled={appointmentPage <= 1} onClick={() => loadAll(token, appointmentPage - 1)}>Zurück</button>
                <span>Seite {appointmentPage} / {appointmentTotalPages}</span>
                <button className="btn-outline" disabled={appointmentPage >= appointmentTotalPages} onClick={() => loadAll(token, appointmentPage + 1)}>Weiter</button>
                <span>Gesamt: {appointmentTotal}</span>
              </div>
            </section>
          )}

          {activeTab === 'services' && (
            <section style={styles.card}>
              <h2 className="section-title">Leistungen</h2>
              <form onSubmit={submitService} style={styles.form}>
                <input placeholder="Name" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} required />
                <input placeholder="Beschreibung" value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} />
                <input type="number" min="30" step="30" value={serviceForm.durationMinutes} onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: e.target.value })} required />
                <input type="number" min="0" step="0.01" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} required />
                <label className="checkbox-row"><input type="checkbox" checked={serviceForm.isActive} onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })} /> Aktiv</label>
                <div style={styles.row}>
                  <button className="btn-outline" type="submit">{editingServiceId ? 'Aktualisieren' : 'Anlegen'}</button>
                  {editingServiceId && <button className="btn-outline" type="button" onClick={() => { setEditingServiceId(null); setServiceForm(emptyService); }}>Abbrechen</button>}
                </div>
              </form>
              <ul className="simple-list">
                {services.map((s) => (
                  <li key={s.id}>{s.name} - {s.durationMinutes} Min - {s.price} € - {s.isActive ? 'Aktiv' : 'Inaktiv'}
                    <button className="inline-btn" onClick={() => { setEditingServiceId(s.id); setServiceForm({ name: s.name, description: s.description || '', durationMinutes: s.durationMinutes, price: s.price, isActive: s.isActive }); }}>Bearbeiten</button>
                    <button className="inline-btn" onClick={async () => { await api(`/api/admin/services/${s.id}`, { method: 'DELETE' }); await loadAll(); }}>Deaktivieren</button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {activeTab === 'hours' && (
            <section style={styles.card}>
              <h2 className="section-title">Öffnungszeiten</h2>
              <form onSubmit={submitHour} style={styles.form}>
                <select value={hourForm.dayOfWeek} onChange={(e) => setHourForm({ ...hourForm, dayOfWeek: e.target.value })}>
                  {dayNames.map((d, i) => <option key={d} value={i}>{d}</option>)}
                </select>
                <input type="time" step="60" value={(hourForm.from || '').slice(0, 5)} onChange={(e) => setHourForm({ ...hourForm, from: `${e.target.value}:00` })} required />
                <input type="time" step="60" value={(hourForm.to || '').slice(0, 5)} onChange={(e) => setHourForm({ ...hourForm, to: `${e.target.value}:00` })} required />
                <label className="checkbox-row"><input type="checkbox" checked={hourForm.isActive} onChange={(e) => setHourForm({ ...hourForm, isActive: e.target.checked })} /> Aktiv</label>
                <div style={styles.row}>
                  <button className="btn-outline" type="submit">{editingHourId ? 'Aktualisieren' : 'Anlegen'}</button>
                  {editingHourId && <button className="btn-outline" type="button" onClick={() => { setEditingHourId(null); setHourForm(emptyHour); }}>Abbrechen</button>}
                </div>
              </form>
              <ul className="simple-list">
                {hours.map((h) => (
                  <li key={h.id}>{dayNames[h.dayOfWeek]} {h.from}-{h.to}
                    <button className="inline-btn" onClick={() => { setEditingHourId(h.id); setHourForm({ dayOfWeek: h.dayOfWeek, from: timeSpanToString(h.from), to: timeSpanToString(h.to), isActive: h.isActive }); }}>Bearbeiten</button>
                    <button className="inline-btn" onClick={async () => { await api(`/api/admin/business-hours/${h.id}`, { method: 'DELETE' }); await loadAll(); }}>Löschen</button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {activeTab === 'exceptions' && (
            <section style={styles.card}>
              <h2 className="section-title">Ausnahmen</h2>
              <form onSubmit={submitException} style={styles.form}>
                <input type="date" value={exceptionForm.date} onChange={(e) => setExceptionForm({ ...exceptionForm, date: e.target.value })} required />
                <select value={exceptionForm.employeeId} onChange={(e) => setExceptionForm({ ...exceptionForm, employeeId: e.target.value })}>
                  <option value="">Global</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
                <input type="time" value={exceptionForm.from} onChange={(e) => setExceptionForm({ ...exceptionForm, from: e.target.value })} />
                <input type="time" value={exceptionForm.to} onChange={(e) => setExceptionForm({ ...exceptionForm, to: e.target.value })} />
                <input value={exceptionForm.type} onChange={(e) => setExceptionForm({ ...exceptionForm, type: e.target.value })} required />
                <input value={exceptionForm.description} onChange={(e) => setExceptionForm({ ...exceptionForm, description: e.target.value })} />
                <div style={styles.row}>
                  <button className="btn-outline" type="submit">{editingExceptionId ? 'Aktualisieren' : 'Anlegen'}</button>
                  {editingExceptionId && <button className="btn-outline" type="button" onClick={() => { setEditingExceptionId(null); setExceptionForm(emptyException); }}>Abbrechen</button>}
                </div>
              </form>

              <div style={{ ...styles.row, marginTop: 8 }}>
                <select value={exceptionEmployeeFilter} onChange={(e) => setExceptionEmployeeFilter(e.target.value)}>
                  <option value="">Alle Mitarbeiter</option>
                  {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                </select>
                <button className="btn-outline" onClick={() => loadAll(token, 1)}>Filter anwenden</button>
              </div>

              <ul className="simple-list">
                {exceptions.map((x) => {
                  const employee = employees.find((e) => e.id === x.employeeId);
                  return (
                    <li key={x.id}>{new Date(x.date).toLocaleDateString('de-DE')} - {x.type} - {employee ? employee.name : 'global'}
                      <button
                        className="inline-btn"
                        onClick={() => {
                          setEditingExceptionId(x.id);
                          setExceptionForm({
                            date: (x.date || '').slice(0, 10),
                            from: x.from ? x.from.slice(0, 5) : '',
                            to: x.to ? x.to.slice(0, 5) : '',
                            type: x.type || '',
                            description: x.description || '',
                            employeeId: x.employeeId || '',
                          });
                        }}
                      >
                        Bearbeiten
                      </button>
                      <button className="inline-btn" onClick={async () => { await api(`/api/admin/exceptions/${x.id}`, { method: 'DELETE' }); await loadAll(); }}>Löschen</button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {activeTab === 'notifications' && (
            <section style={styles.card}>
              <h2 className="section-title">Benachrichtigungen</h2>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.thtd}>Zeit</th>
                    <th style={styles.thtd}>Empfänger</th>
                    <th style={styles.thtd}>Typ</th>
                    <th style={styles.thtd}>Status</th>
                    <th style={styles.thtd}>Fehler</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n) => (
                    <tr key={n.id}>
                      <td style={styles.thtd}>{parseUtcDate(n.sentAtUtc).toLocaleString('de-DE')}</td>
                      <td style={styles.thtd}>{n.recipient}</td>
                      <td style={styles.thtd}>{n.type}</td>
                      <td style={styles.thtd}>{n.status}</td>
                      <td style={styles.thtd}>{n.error || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ ...styles.row, marginTop: 10 }}>
                <button
                  className="btn-outline"
                  disabled={notificationPage <= 1}
                  onClick={async () => {
                    const nextPage = notificationPage - 1;
                    setNotificationPage(nextPage);
                    await loadAll(token, appointmentPage, nextPage, auditPage);
                  }}
                >
                  Zurück
                </button>
                <span>Seite {notificationPage} / {notificationTotalPages}</span>
                <button
                  className="btn-outline"
                  disabled={notificationPage >= notificationTotalPages}
                  onClick={async () => {
                    const nextPage = notificationPage + 1;
                    setNotificationPage(nextPage);
                    await loadAll(token, appointmentPage, nextPage, auditPage);
                  }}
                >
                  Weiter
                </button>
                <span>Gesamt: {notificationTotal}</span>
              </div>
            </section>
          )}

          {activeTab === 'audit' && (
            <section style={styles.card}>
              <h2 className="section-title">Audit Logs</h2>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.thtd}>Zeit</th>
                    <th style={styles.thtd}>Entität</th>
                    <th style={styles.thtd}>Aktion</th>
                    <th style={styles.thtd}>EntityId</th>
                    <th style={styles.thtd}>Benutzer</th>
                    <th style={styles.thtd}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((a) => (
                    <tr key={a.id}>
                      <td style={styles.thtd}>{parseUtcDate(a.timestampUtc).toLocaleString('de-DE')}</td>
                      <td style={styles.thtd}>{a.entity}</td>
                      <td style={styles.thtd}>{a.action}</td>
                      <td style={styles.thtd}>{a.entityId}</td>
                      <td style={styles.thtd}>{a.userId || '-'}</td>
                      <td style={styles.thtd}>{a.details || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ ...styles.row, marginTop: 10 }}>
                <button
                  className="btn-outline"
                  disabled={auditPage <= 1}
                  onClick={async () => {
                    const nextPage = auditPage - 1;
                    setAuditPage(nextPage);
                    await loadAll(token, appointmentPage, notificationPage, nextPage);
                  }}
                >
                  Zurück
                </button>
                <span>Seite {auditPage} / {auditTotalPages}</span>
                <button
                  className="btn-outline"
                  disabled={auditPage >= auditTotalPages}
                  onClick={async () => {
                    const nextPage = auditPage + 1;
                    setAuditPage(nextPage);
                    await loadAll(token, appointmentPage, notificationPage, nextPage);
                  }}
                >
                  Weiter
                </button>
                <span>Gesamt: {auditTotal}</span>
              </div>
            </section>
          )}
        </>
      )}

      <style jsx>{`
        h1,
        .section-title {
          font-weight: 500;
          margin: 0;
          line-height: 1.08;
        }

        h1 {
          font-size: clamp(40px, 6vw, 62px);
          margin: 8px 0 10px;
        }

        .section-title {
          font-size: 36px;
          margin-bottom: 14px;
        }

        .lead {
          margin: 0;
          color: var(--color-text-secondary);
          max-width: 760px;
        }

        .admin-premium :is(input, select, textarea) {
          padding: 10px 11px;
        }

        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--color-text-secondary);
        }

        .checkbox-row input {
          width: auto;
        }


        .tab-btn.active {
          background: var(--color-text);
          color: var(--color-white);
        }

        .inline-btn {
          margin-left: 8px;
          font-size: 10px;
          padding: 6px 9px;
        }

        .simple-list {
          margin: 14px 0 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 8px;
        }

        .simple-list li {
          border-top: 1px solid var(--color-border-soft);
          padding-top: 8px;
          font-size: 14px;
          color: #262625;
        }

        .feedback {
          margin: 14px 0 0;
        }

        .new-appointment-row td {
          background: #fff7e1;
        }

        .new-badge {
          display: inline-block;
          margin-left: 8px;
          padding: 2px 8px;
          border: 1px solid #c89c39;
          font-size: 11px;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: #6a4a06;
          background: #fff1c8;
        }

        .seen-btn {
          margin-left: 8px;
          padding: 2px 8px;
          border: 1px solid #b7b7b5;
          background: #fff;
          color: #3d3d3b;
          font-size: 11px;
          cursor: pointer;
        }

        @media (max-width: 980px) {
          .section-title {
            font-size: 30px;
          }

          .btn-outline,
          .tab-btn,
          .inline-btn {
            width: 100%;
          }

          .inline-btn {
            margin-left: 0;
            margin-top: 8px;
          }
        }
      `}</style>
    </main>
  );
}
