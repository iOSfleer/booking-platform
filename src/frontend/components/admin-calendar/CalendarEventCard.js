import { parseUtcDate } from '../../utils/calendar';

const statusColors = {
  Confirmed: '#1b68d1',
  Pending: '#c28b00',
  Rescheduled: '#c06a00',
  Cancelled: '#777777',
  Completed: '#287a38',
};

function formatTime(value) {
  const date = parseUtcDate(value);
  return date ? date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';
}

export function getStatusColor(status) {
  return statusColors[status] || '#3d5a80';
}

export default function CalendarEventCard({
  event,
  compact = false,
  onClick,
  style,
  draggable = false,
  onDragStart,
  onResizeRequest,
}) {
  return (
    <button
      type="button"
      className={`calendar-event-card ${compact ? 'compact' : ''}`}
      style={{
        ...style,
        borderLeft: `4px solid ${getStatusColor(event.status)}`,
      }}
      onClick={onClick}
      draggable={!compact && draggable}
      onDragStart={(e) => onDragStart?.(e, event)}
      title={`${event.serviceName || event.title} (${formatTime(event.startTimeUtc)} - ${formatTime(event.endTimeUtc)})`}
    >
      <div className="event-title">{event.serviceName || event.title}</div>
      <div className="event-time">{formatTime(event.startTimeUtc)} - {formatTime(event.endTimeUtc)}</div>
      {!compact && event.customerName ? <div className="event-meta">{event.customerName}</div> : null}
      {!compact && event.employeeName ? <div className="event-meta">{event.employeeName}</div> : null}
      {!compact ? (
        <span
          className="event-resize-handle"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onResizeRequest?.(event);
          }}
          title="Resize folgt im nächsten Schritt"
        >
          ⋮
        </span>
      ) : null}
    </button>
  );
}
