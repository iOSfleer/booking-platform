import CalendarViewSwitcher from './CalendarViewSwitcher';

export default function CalendarToolbar({
  rangeLabel,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  children,
}) {
  return (
    <div className="calendar-toolbar">
      <div className="calendar-toolbar-row">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn-outline" onClick={onToday}>Heute</button>
          <button type="button" className="btn-outline" onClick={onPrev}>Zurück</button>
          <button type="button" className="btn-outline" onClick={onNext}>Vor</button>
          <strong>{rangeLabel}</strong>
        </div>
        <CalendarViewSwitcher value={view} onChange={onViewChange} />
      </div>
      {children ? <div className="calendar-toolbar-row">{children}</div> : null}
    </div>
  );
}
