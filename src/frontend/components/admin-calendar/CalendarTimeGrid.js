export default function CalendarTimeGrid({ slots, slotHeight = 42, onSlotClick, onSlotDrop, children }) {
  return (
    <div className="calendar-time-grid" style={{ height: slots.length * slotHeight }}>
      {slots.map((slot) => (
        <button
          type="button"
          key={slot.label}
          className="calendar-slot-row"
          style={{ height: slotHeight }}
          onClick={() => onSlotClick?.(slot)}
          onDragOver={(e) => {
            if (!onSlotDrop) return;
            e.preventDefault();
          }}
          onDrop={(e) => {
            if (!onSlotDrop) return;
            e.preventDefault();
            onSlotDrop(slot);
          }}
        >
          <span className="calendar-slot-label">{slot.label}</span>
        </button>
      ))}
      <div className="calendar-time-grid-events">{children}</div>
    </div>
  );
}
