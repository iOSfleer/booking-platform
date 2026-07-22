import { parseUtcDate } from '../../utils/calendar';
import { getStatusColor } from './CalendarEventCard';

function formatDateTime(value) {
  const date = parseUtcDate(value);
  return date ? date.toLocaleString('de-DE') : '-';
}

export default function CalendarEventDetailsModal({ event, onClose, onCancel }) {
  if (!event) return null;

  return (
    <div className="calendar-modal-backdrop" onClick={onClose}>
      <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Termindetails</h3>
        <p><strong>Leistung:</strong> {event.serviceName || event.title}</p>
        <p><strong>Kunde:</strong> {event.customerName || '-'}</p>
        <p><strong>Mitarbeiter:</strong> {event.employeeName || 'nicht zugewiesen'}</p>
        <p><strong>Beginn:</strong> {formatDateTime(event.startTimeUtc)}</p>
        <p><strong>Ende:</strong> {formatDateTime(event.endTimeUtc)}</p>
        <p>
          <strong>Status:</strong>{' '}
          <span style={{ color: getStatusColor(event.status) }}>{event.status}</span>
        </p>

        <div className="calendar-modal-actions">
          {event.status !== 'Cancelled' ? (
            <button type="button" className="btn-outline" onClick={() => onCancel?.(event)}>Stornieren</button>
          ) : null}
          <button type="button" className="btn-outline" onClick={onClose}>Schließen</button>
        </div>
      </div>
    </div>
  );
}
