import { CALENDAR_VIEWS } from '../../utils/calendar';

const VIEWS = [
  { key: CALENDAR_VIEWS.DAY, label: 'Tag' },
  { key: CALENDAR_VIEWS.WEEK, label: 'Woche' },
  { key: CALENDAR_VIEWS.MONTH, label: 'Monat' },
];

export default function CalendarViewSwitcher({ value, onChange }) {
  return (
    <div className="calendar-view-switcher">
      {VIEWS.map((view) => (
        <button
          key={view.key}
          type="button"
          className={`tab-btn ${value === view.key ? 'active' : ''}`}
          onClick={() => onChange(view.key)}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}
