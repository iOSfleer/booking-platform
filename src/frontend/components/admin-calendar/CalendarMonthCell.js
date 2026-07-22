import CalendarEventCard from './CalendarEventCard';
import { parseUtcDate } from '../../utils/calendar';

export default function CalendarMonthCell({ day, currentMonth, events, onDayClick, onSelectEvent }) {
  const isCurrentMonth = day.getMonth() === currentMonth;
  const sorted = [...events].sort((a, b) => parseUtcDate(a.startTimeUtc) - parseUtcDate(b.startTimeUtc));
  const visible = sorted.slice(0, 3);
  const more = sorted.length - visible.length;

  return (
    <div
      className={`month-cell ${isCurrentMonth ? '' : 'muted'}`}
      role="button"
      tabIndex={0}
      onClick={() => onDayClick?.(day)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onDayClick?.(day);
        }
      }}
    >
      <div className="month-cell-date">{day.getDate()}</div>
      <div className="month-cell-events">
        {visible.map((event) => (
          <CalendarEventCard
            key={event.id}
            event={event}
            compact
            onClick={(e) => {
              e.stopPropagation();
              onSelectEvent?.(event);
            }}
          />
        ))}
        {more > 0 ? <div className="month-more">+{more} weitere</div> : null}
      </div>
    </div>
  );
}
