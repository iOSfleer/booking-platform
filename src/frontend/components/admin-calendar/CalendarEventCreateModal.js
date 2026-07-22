import { useEffect, useState } from 'react';

const emptyForm = {
  serviceId: '',
  employeeId: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  notes: '',
};

function toLocalInputValue(date) {
  if (!date) return '';
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 16);
}

export default function CalendarEventCreateModal({
  open,
  startDate,
  services,
  employees,
  onClose,
  onCreate,
}) {
  const [form, setForm] = useState(emptyForm);
  const [startValue, setStartValue] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm((prev) => ({ ...emptyForm, serviceId: services[0]?.id || '', employeeId: prev.employeeId || '' }));
    setStartValue(toLocalInputValue(startDate));
  }, [open, startDate, services]);

  if (!open) return null;

  return (
    <div className="calendar-modal-backdrop" onClick={onClose}>
      <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Termin anlegen</h3>
        <div className="calendar-modal-form">
          <input type="datetime-local" value={startValue} onChange={(e) => setStartValue(e.target.value)} required />
          <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} required>
            <option value="">Leistung wählen</option>
            {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
          </select>
          <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
            <option value="">Mitarbeiter (optional)</option>
            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
          </select>
          <input placeholder="Kundenname" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
          <input placeholder="Kunden-E-Mail" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} required />
          <input placeholder="Telefon (optional)" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
          <textarea placeholder="Notiz (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
        </div>

        <div className="calendar-modal-actions">
          <button
            type="button"
            className="btn-outline"
            onClick={() => onCreate?.({
              ...form,
              startTimeUtc: new Date(startValue).toISOString(),
              employeeId: form.employeeId || null,
            })}
          >
            Speichern
          </button>
          <button type="button" className="btn-outline" onClick={onClose}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
}
