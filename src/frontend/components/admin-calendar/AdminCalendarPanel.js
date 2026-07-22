import { useEffect, useMemo, useState } from 'react';
import CalendarToolbar from './CalendarToolbar';
import DayCalendarView from './DayCalendarView';
import WeekCalendarView from './WeekCalendarView';
import MonthCalendarView from './MonthCalendarView';
import CalendarEventDetailsModal from './CalendarEventDetailsModal';
import CalendarEventCreateModal from './CalendarEventCreateModal';
import { getStatusColor } from './CalendarEventCard';
import {
  CALENDAR_VIEWS,
  addByView,
  formatRangeLabel,
  getBusinessHourBounds,
  getRangeForView,
  toIsoUtc,
} from '../../utils/calendar';

const STATUS_OPTIONS = ['', 'Confirmed', 'Pending', 'Rescheduled', 'Cancelled', 'Completed'];

function normalizeEvents(items = []) {
  return items.map((item) => ({
    id: item.id,
    title: item.service,
    serviceName: item.service,
    startTimeUtc: item.startTimeUtc,
    endTimeUtc: item.endTimeUtc,
    status: item.status,
    customerName: item.customer,
    employeeName: item.employeeName,
    employeeId: item.employeeId,
  }));
}

export default function AdminCalendarPanel({ api, services, employees, hours, onRefreshData, onError, onNotice, styles }) {
  const [calendarView, setCalendarView] = useState(CALENDAR_VIEWS.WEEK);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedServiceName, setSelectedServiceName] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [createStartDate, setCreateStartDate] = useState(null);
  const [draggedEvent, setDraggedEvent] = useState(null);

  const hourBounds = useMemo(() => getBusinessHourBounds(hours), [hours]);
  const rangeLabel = formatRangeLabel(calendarDate, calendarView);

  async function loadCalendarEvents() {
    setCalendarLoading(true);
    try {
      const range = getRangeForView(calendarDate, calendarView);
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('pageSize', '500');
      params.set('sortBy', 'startTime');
      params.set('sortDir', 'asc');
      params.set('fromUtc', toIsoUtc(range.from));
      params.set('toUtc', toIsoUtc(range.to));
      if (selectedEmployeeId) params.set('employeeId', selectedEmployeeId);

      const data = await api(`/api/admin/appointments?${params.toString()}`);
      setCalendarEvents(normalizeEvents(data?.items || []));
    } catch (error) {
      onError?.(error.message || 'Kalenderdaten konnten nicht geladen werden.');
    } finally {
      setCalendarLoading(false);
    }
  }

  useEffect(() => {
    loadCalendarEvents();
  }, [calendarDate, calendarView, selectedEmployeeId]);

  const filteredEvents = useMemo(() => {
    return calendarEvents.filter((event) => {
      if (selectedStatus && event.status !== selectedStatus) return false;
      if (selectedServiceName && event.serviceName !== selectedServiceName) return false;
      return true;
    });
  }, [calendarEvents, selectedServiceName, selectedStatus]);

  async function handleCancelEvent(event) {
    try {
      await api(`/api/admin/appointments/${event.id}/cancel`, { method: 'PATCH' });
      setSelectedEvent(null);
      onNotice?.('Termin storniert.');
      await loadCalendarEvents();
      await onRefreshData?.();
    } catch (error) {
      onError?.(error.message);
    }
  }

  async function handleCreateAppointment(payload) {
    if (!payload.serviceId || !payload.customerName || !payload.customerEmail || !payload.startTimeUtc) {
      onError?.('Bitte alle Pflichtfelder ausfüllen.');
      return;
    }

    try {
      await api('/api/admin/appointments', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: payload.serviceId,
          employeeId: payload.employeeId,
          startTimeUtc: payload.startTimeUtc,
          customerName: payload.customerName,
          customerEmail: payload.customerEmail,
          customerPhone: payload.customerPhone,
          notes: payload.notes,
        }),
      });
      setCreateStartDate(null);
      onNotice?.('Termin angelegt.');
      await loadCalendarEvents();
      await onRefreshData?.();
    } catch (error) {
      onError?.(error.message || 'Termin konnte nicht erstellt werden.');
    }
  }

  function handleEventDragStart(event) {
    setDraggedEvent(event);
  }

  async function handleEventDropToSlot(slotDate) {
    if (!draggedEvent || !slotDate) return;

    try {
      await api(`/api/admin/appointments/${draggedEvent.id}/reschedule`, {
        method: 'PATCH',
        body: JSON.stringify({ newStartTimeUtc: slotDate.toISOString() }),
      });
      onNotice?.('Termin verschoben.');
      await loadCalendarEvents();
      await onRefreshData?.();
    } catch (error) {
      onError?.(error.message || 'Termin konnte nicht verschoben werden.');
    } finally {
      setDraggedEvent(null);
    }
  }

  function handleResizeRequest() {
    onNotice?.('Resize-Vorbereitung ist aktiv. Backend-Workflow für Daueranpassung folgt im nächsten Schritt.');
  }

  const statusLegend = STATUS_OPTIONS.filter(Boolean);

  return (
    <section style={styles.card} className="admin-calendar-panel">
      <h2 className="section-title">Kalender</h2>

      <CalendarToolbar
        view={calendarView}
        rangeLabel={rangeLabel}
        onViewChange={setCalendarView}
        onToday={() => setCalendarDate(new Date())}
        onPrev={() => setCalendarDate((prev) => addByView(prev, calendarView, -1))}
        onNext={() => setCalendarDate((prev) => addByView(prev, calendarView, 1))}
      >
        <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)}>
          <option value="">Alle Mitarbeiter</option>
          {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
        </select>

        <select value={selectedServiceName} onChange={(e) => setSelectedServiceName(e.target.value)}>
          <option value="">Alle Leistungen</option>
          {services.map((service) => <option key={service.id} value={service.name}>{service.name}</option>)}
        </select>

        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
          <option value="">Alle Stati</option>
          {STATUS_OPTIONS.filter(Boolean).map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </CalendarToolbar>

      <div className="calendar-status-legend" aria-label="Status-Legende">
        {statusLegend.map((status) => (
          <span key={status} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: getStatusColor(status) }} />
            {status}
          </span>
        ))}
      </div>

      {calendarLoading ? <p>Lade Kalender …</p> : null}

      {!calendarLoading && filteredEvents.length === 0 ? <p>Keine Termine im ausgewählten Zeitraum.</p> : null}

      {calendarView === CALENDAR_VIEWS.DAY ? (
        <DayCalendarView
          events={filteredEvents}
          date={calendarDate}
          startHour={hourBounds.startHour}
          endHour={hourBounds.endHour}
          onSelectEvent={setSelectedEvent}
          onSelectSlot={setCreateStartDate}
          onEventDragStart={(_, event) => handleEventDragStart(event)}
          onEventDropToSlot={handleEventDropToSlot}
          onEventResizeRequest={handleResizeRequest}
        />
      ) : null}

      {calendarView === CALENDAR_VIEWS.WEEK ? (
        <WeekCalendarView
          events={filteredEvents}
          date={calendarDate}
          startHour={hourBounds.startHour}
          endHour={hourBounds.endHour}
          onSelectEvent={setSelectedEvent}
          onSelectSlot={setCreateStartDate}
          onEventDragStart={(_, event) => handleEventDragStart(event)}
          onEventDropToSlot={handleEventDropToSlot}
          onEventResizeRequest={handleResizeRequest}
        />
      ) : null}

      {calendarView === CALENDAR_VIEWS.MONTH ? (
        <MonthCalendarView
          date={calendarDate}
          events={filteredEvents}
          onSelectEvent={setSelectedEvent}
          onSelectDay={(day) => {
            setCalendarDate(day);
            setCalendarView(CALENDAR_VIEWS.DAY);
          }}
        />
      ) : null}

      <CalendarEventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onCancel={handleCancelEvent} />

      <CalendarEventCreateModal
        open={!!createStartDate}
        startDate={createStartDate}
        services={services}
        employees={employees}
        onClose={() => setCreateStartDate(null)}
        onCreate={handleCreateAppointment}
      />

      <style jsx global>{`
        .admin-calendar-panel .calendar-toolbar {
          display: grid;
          gap: 10px;
          margin-bottom: 14px;
        }

        .admin-calendar-panel .calendar-toolbar-row {
          display: flex;
          gap: 8px;
          justify-content: space-between;
          flex-wrap: wrap;
          align-items: center;
        }

        .admin-calendar-panel .calendar-view-switcher {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .admin-calendar-panel .calendar-status-legend {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .admin-calendar-panel .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #e2e2e0;
          background: #fff;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 12px;
        }

        .admin-calendar-panel .legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          display: inline-block;
        }

        .admin-calendar-panel .calendar-time-grid {
          position: relative;
          border: 1px solid var(--color-border-soft);
          overflow: auto;
          background: #fff;
        }

        .admin-calendar-panel .calendar-slot-row {
          width: 100%;
          border: none;
          border-top: 1px solid #f1f1f1;
          background: transparent;
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          padding: 0;
          cursor: pointer;
        }

        .admin-calendar-panel .calendar-slot-row:hover {
          background: #fafcff;
        }

        .admin-calendar-panel .calendar-slot-label {
          width: 58px;
          font-size: 11px;
          color: #8c8c8a;
          padding: 2px 4px;
          text-align: left;
        }

        .admin-calendar-panel .calendar-time-grid-events {
          position: absolute;
          left: 58px;
          right: 6px;
          top: 0;
          bottom: 0;
        }

        .admin-calendar-panel .calendar-event-card {
          border: 1px solid #d5d8de;
          background: #f8fbff;
          padding: 4px 6px;
          text-align: left;
          border-radius: 6px;
          overflow: hidden;
          font-size: 11px;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.02);
          cursor: pointer;
        }

        .admin-calendar-panel .calendar-event-card:hover {
          filter: brightness(0.98);
        }

        .admin-calendar-panel .calendar-event-card.compact {
          width: 100%;
          min-height: auto;
          height: auto !important;
          position: relative !important;
          left: auto !important;
          top: auto !important;
          margin-bottom: 4px;
        }

        .admin-calendar-panel .event-title {
          font-weight: 600;
          color: #1f2b3a;
        }

        .admin-calendar-panel .event-time,
        .admin-calendar-panel .event-meta {
          color: #586172;
          font-size: 10px;
        }

        .admin-calendar-panel .event-resize-handle {
          position: absolute;
          right: 4px;
          bottom: 2px;
          color: #7d8795;
          font-size: 12px;
          line-height: 1;
          cursor: ns-resize;
          user-select: none;
        }

        .admin-calendar-panel .calendar-week-view {
          border: 1px solid var(--color-border-soft);
          overflow: auto;
          background: #fff;
        }

        .admin-calendar-panel .calendar-week-header,
        .admin-calendar-panel .calendar-week-body {
          display: grid;
          grid-template-columns: 64px repeat(7, minmax(160px, 1fr));
        }

        .admin-calendar-panel .calendar-week-header {
          position: sticky;
          top: 0;
          z-index: 3;
        }

        .admin-calendar-panel .week-day-head {
          border-left: 1px solid #e9ebef;
          border-bottom: 1px solid #e9ebef;
          padding: 10px 8px;
          text-align: center;
          font-size: 12px;
          background: #f6f8fb;
        }

        .admin-calendar-panel .week-day-head.is-today {
          background: #e9f1ff;
        }

        .admin-calendar-panel .week-time-col {
          border-right: 1px solid #e9ebef;
          background: #fcfcfd;
          position: sticky;
          left: 0;
          z-index: 2;
        }

        .admin-calendar-panel .week-time-slot {
          border-top: 1px solid #f1f2f5;
          font-size: 10px;
          color: #7f7f7d;
          padding: 2px 3px;
        }

        .admin-calendar-panel .week-day-col {
          border-left: 1px solid #eef0f3;
          background: #fff;
          position: relative;
          padding: 0;
          cursor: pointer;
        }

        .admin-calendar-panel .week-day-col:focus {
          outline: 2px solid #b4d0ff;
          outline-offset: -2px;
        }

        .admin-calendar-panel .week-slot-line {
          position: absolute;
          left: 0;
          right: 0;
          border-top: 1px solid #f4f5f7;
          pointer-events: none;
        }

        .admin-calendar-panel .calendar-month-view {
          border: 1px solid var(--color-border-soft);
          background: #fff;
        }

        .admin-calendar-panel .month-weekdays,
        .admin-calendar-panel .month-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .admin-calendar-panel .month-weekdays > div {
          border-bottom: 1px solid #ececec;
          padding: 8px;
          text-align: center;
          font-size: 12px;
          font-weight: 600;
        }

        .admin-calendar-panel .month-cell {
          border-right: 1px solid #efefef;
          border-bottom: 1px solid #efefef;
          min-height: 130px;
          text-align: left;
          padding: 6px;
          background: #fff;
          cursor: pointer;
        }

        .admin-calendar-panel .month-cell.muted {
          background: #fafafa;
          color: #9b9b99;
        }

        .admin-calendar-panel .month-cell-date {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 5px;
        }

        .admin-calendar-panel .month-cell-events {
          display: grid;
          gap: 4px;
        }

        .admin-calendar-panel .month-more {
          font-size: 11px;
          color: #6f6f6d;
        }

        .admin-calendar-panel .calendar-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 90;
          padding: 12px;
        }

        .admin-calendar-panel .calendar-modal {
          width: min(560px, 100%);
          background: #fff;
          border: 1px solid #d9d9d9;
          padding: 18px;
          display: grid;
          gap: 8px;
        }

        .admin-calendar-panel .calendar-modal-form {
          display: grid;
          gap: 8px;
        }

        .admin-calendar-panel .calendar-modal-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
          flex-wrap: wrap;
          margin-top: 6px;
        }

        @media (max-width: 980px) {
          .admin-calendar-panel .calendar-toolbar-row {
            justify-content: flex-start;
          }

          .admin-calendar-panel .month-cell {
            min-height: 100px;
          }

          .admin-calendar-panel .calendar-week-header,
          .admin-calendar-panel .calendar-week-body {
            grid-template-columns: 56px repeat(7, minmax(130px, 1fr));
          }
        }
      `}</style>
    </section>
  );
}
