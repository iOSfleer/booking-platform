import CalendarEventCard from './CalendarEventCard';
import { generateTimeSlots, getEventLayout, getMinutesOfDay, parseUtcDate, startOfWeek } from '../../utils/calendar';

export default function WeekCalendarView({
  events,
  date,
  startHour,
  endHour,
  slotMinutes = 30,
  slotHeight = 32,
  onSelectEvent,
  onSelectSlot,
  onEventDragStart,
  onEventDropToSlot,
  onEventResizeRequest,
}) {
  const weekStart = startOfWeek(date);
  const days = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + idx);
    return d;
  });
  const slots = generateTimeSlots(startHour, endHour, slotMinutes);

  return (
    <div className="calendar-week-view">
      <div className="calendar-week-header">
        <div className="week-time-col" />
        {days.map((d) => (
          <div key={d.toISOString()} className={`week-day-head ${d.toDateString() === new Date().toDateString() ? 'is-today' : ''}`}>
            <strong>{d.toLocaleDateString('de-DE', { weekday: 'short' })}</strong>
            <div>{d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</div>
          </div>
        ))}
      </div>

      <div className="calendar-week-body" style={{ height: slots.length * slotHeight }}>
        <div className="week-time-col">
          {slots.map((slot) => (
            <div key={slot.label} className="week-time-slot" style={{ height: slotHeight }}>{slot.label}</div>
          ))}
        </div>

        {days.map((day) => {
          const dayEvents = events.filter((event) => {
            const start = parseUtcDate(event.startTimeUtc);
            return start && start.toDateString() === day.toDateString();
          });
          const layout = getEventLayout(dayEvents);

          return (
            <div
              key={day.toISOString()}
              className="week-day-col"
              role="button"
              tabIndex={0}
              onClick={(e) => {
                if (e.target !== e.currentTarget) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const slotIndex = Math.max(0, Math.min(slots.length - 1, Math.floor(y / slotHeight)));
                const slot = slots[slotIndex];
                const slotDate = new Date(day);
                slotDate.setHours(slot.hour, slot.minute, 0, 0);
                onSelectSlot?.(slotDate);
              }}
              onDragOver={(e) => {
                if (!onEventDropToSlot) return;
                e.preventDefault();
              }}
              onDrop={(e) => {
                if (!onEventDropToSlot) return;
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const slotIndex = Math.max(0, Math.min(slots.length - 1, Math.floor(y / slotHeight)));
                const slot = slots[slotIndex];
                const slotDate = new Date(day);
                slotDate.setHours(slot.hour, slot.minute, 0, 0);
                onEventDropToSlot?.(slotDate);
              }}
              onKeyDown={(e) => {
                if (e.key !== 'Enter' && e.key !== ' ') return;
                e.preventDefault();
                const slot = slots[0];
                const slotDate = new Date(day);
                slotDate.setHours(slot.hour, slot.minute, 0, 0);
                onSelectSlot?.(slotDate);
              }}
            >
              {slots.map((slot, slotIndex) => (
                <span key={slot.label} className="week-slot-line" style={{ top: slotIndex * slotHeight }} />
              ))}

              {dayEvents.map((event) => {
                const start = parseUtcDate(event.startTimeUtc);
                const end = parseUtcDate(event.endTimeUtc);
                const startMins = getMinutesOfDay(start) - (startHour * 60);
                const endMins = getMinutesOfDay(end) - (startHour * 60);
                const rawTop = (startMins / slotMinutes) * slotHeight;
                const rawHeight = ((endMins - startMins) / slotMinutes) * slotHeight - 2;
                const maxHeight = (slots.length * slotHeight) - 2;
                const top = Math.max(0, rawTop);
                const height = Math.max(24, Math.min(maxHeight - top, rawHeight));
                const info = layout.get(event.id) || { col: 0, colCount: 1 };
                const widthPct = 100 / info.colCount;

                return (
                  <CalendarEventCard
                    key={event.id}
                    event={event}
                    onClick={() => onSelectEvent?.(event)}
                    draggable
                    onDragStart={onEventDragStart}
                    onResizeRequest={onEventResizeRequest}
                    style={{
                      position: 'absolute',
                      top,
                      left: `calc(${info.col * widthPct}% + 2px)`,
                      width: `calc(${widthPct}% - 4px)`,
                      height,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
