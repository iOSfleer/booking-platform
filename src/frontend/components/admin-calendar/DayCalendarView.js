import CalendarEventCard from './CalendarEventCard';
import CalendarTimeGrid from './CalendarTimeGrid';
import { generateTimeSlots, getEventLayout, getMinutesOfDay, parseUtcDate } from '../../utils/calendar';

export default function DayCalendarView({
  events,
  date,
  startHour,
  endHour,
  slotMinutes = 30,
  slotHeight = 42,
  onSelectEvent,
  onSelectSlot,
  onEventDragStart,
  onEventDropToSlot,
  onEventResizeRequest,
}) {
  const slots = generateTimeSlots(startHour, endHour, slotMinutes);
  const dayEvents = events.filter((event) => {
    const start = parseUtcDate(event.startTimeUtc);
    return start && start.toDateString() === date.toDateString();
  });
  const layout = getEventLayout(dayEvents);

  function toSlotDate(slot) {
    const slotDate = new Date(date);
    slotDate.setHours(slot.hour, slot.minute, 0, 0);
    return slotDate;
  }

  function handleSlotClick(slot) {
    onSelectSlot?.(toSlotDate(slot));
  }

  function handleSlotDrop(slot) {
    onEventDropToSlot?.(toSlotDate(slot));
  }

  return (
    <div className="calendar-day-view">
      <CalendarTimeGrid
        slots={slots}
        slotHeight={slotHeight}
        onSlotClick={handleSlotClick}
        onSlotDrop={onEventDropToSlot ? handleSlotDrop : null}
      >
        {dayEvents.map((event) => {
          const start = parseUtcDate(event.startTimeUtc);
          const end = parseUtcDate(event.endTimeUtc);
          const startMins = getMinutesOfDay(start) - (startHour * 60);
          const endMins = getMinutesOfDay(end) - (startHour * 60);
          const rawTop = (startMins / slotMinutes) * slotHeight;
          const rawHeight = ((endMins - startMins) / slotMinutes) * slotHeight - 2;
          const maxHeight = (slots.length * slotHeight) - 2;
          const top = Math.max(0, rawTop);
          const height = Math.max(26, Math.min(maxHeight - top, rawHeight));
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
                left: `calc(${info.col * widthPct}% + 4px)`,
                width: `calc(${widthPct}% - 8px)`,
                height,
              }}
            />
          );
        })}
      </CalendarTimeGrid>
    </div>
  );
}
