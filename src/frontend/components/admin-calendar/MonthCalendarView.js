import CalendarMonthCell from './CalendarMonthCell';
import { getMonthGridStart, toDayKey, parseUtcDate } from '../../utils/calendar';

export default function MonthCalendarView({ date, events, onSelectEvent, onSelectDay }) {
  const month = date.getMonth();
  const gridStart = getMonthGridStart(date);
  const days = Array.from({ length: 42 }).map((_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return day;
  });

  const eventsByDay = events.reduce((acc, event) => {
    const start = parseUtcDate(event.startTimeUtc);
    const key = toDayKey(start);
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  return (
    <div className="calendar-month-view">
      <div className="month-weekdays">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((wd) => <div key={wd}>{wd}</div>)}
      </div>

      <div className="month-grid">
        {days.map((day) => (
          <CalendarMonthCell
            key={day.toISOString()}
            day={day}
            currentMonth={month}
            events={eventsByDay[toDayKey(day)] || []}
            onDayClick={onSelectDay}
            onSelectEvent={onSelectEvent}
          />
        ))}
      </div>
    </div>
  );
}
