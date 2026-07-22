export const CALENDAR_VIEWS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
};

export function parseUtcDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const hasTimeZone = /([zZ]|[+-]\d{2}:\d{2})$/.test(value);
    return new Date(hasTimeZone ? value : `${value}Z`);
  }
  return new Date(value);
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

export function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function startOfWeek(date) {
  const day = date.getDay();
  const diffToMonday = (day + 6) % 7;
  const result = new Date(date);
  result.setDate(date.getDate() - diffToMonday);
  return startOfDay(result);
}

export function endOfWeek(date) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return endOfDay(end);
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date) {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function getMonthGridStart(date) {
  return startOfWeek(startOfMonth(date));
}

export function getMonthGridEnd(date) {
  const monthEnd = endOfMonth(date);
  const weekEnd = endOfWeek(monthEnd);
  return endOfDay(weekEnd);
}

export function addByView(date, view, step) {
  const next = new Date(date);
  if (view === CALENDAR_VIEWS.DAY) {
    next.setDate(next.getDate() + step);
    return next;
  }
  if (view === CALENDAR_VIEWS.WEEK) {
    next.setDate(next.getDate() + (7 * step));
    return next;
  }

  next.setMonth(next.getMonth() + step);
  return next;
}

export function getRangeForView(date, view) {
  if (view === CALENDAR_VIEWS.DAY) {
    return { from: startOfDay(date), to: endOfDay(date) };
  }

  if (view === CALENDAR_VIEWS.WEEK) {
    return { from: startOfWeek(date), to: endOfWeek(date) };
  }

  return { from: getMonthGridStart(date), to: getMonthGridEnd(date) };
}

export function formatRangeLabel(date, view, locale = 'de-DE') {
  if (view === CALENDAR_VIEWS.DAY) {
    return date.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }

  if (view === CALENDAR_VIEWS.WEEK) {
    const from = startOfWeek(date);
    const to = endOfWeek(date);
    return `${from.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })} - ${to.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
  }

  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export function toIsoUtc(date) {
  return date.toISOString();
}

export function toDayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function generateTimeSlots(startHour = 8, endHour = 20, stepMinutes = 30) {
  const slots = [];
  for (let h = startHour; h <= endHour; h += 1) {
    for (let min = 0; min < 60; min += stepMinutes) {
      if (h === endHour && min > 0) break;
      const label = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      slots.push({ hour: h, minute: min, label });
    }
  }
  return slots;
}

export function getMinutesOfDay(date) {
  return (date.getHours() * 60) + date.getMinutes();
}

export function getEventLayout(events) {
  const sorted = [...events].sort((a, b) => parseUtcDate(a.startTimeUtc) - parseUtcDate(b.startTimeUtc));
  const layouts = new Map();

  let cluster = [];
  let clusterMaxEnd = null;

  const finalizeCluster = () => {
    if (cluster.length === 0) return;

    const columns = [];

    cluster.forEach((event) => {
      const start = parseUtcDate(event.startTimeUtc);
      const end = parseUtcDate(event.endTimeUtc);

      let col = columns.findIndex((colEnd) => colEnd <= start);
      if (col === -1) {
        col = columns.length;
        columns.push(end);
      } else {
        columns[col] = end;
      }

      layouts.set(event.id, { col });
    });

    const colCount = columns.length;
    cluster.forEach((event) => {
      const base = layouts.get(event.id);
      layouts.set(event.id, { ...base, colCount });
    });

    cluster = [];
    clusterMaxEnd = null;
  };

  sorted.forEach((event) => {
    const start = parseUtcDate(event.startTimeUtc);
    const end = parseUtcDate(event.endTimeUtc);

    if (!clusterMaxEnd || start < clusterMaxEnd) {
      cluster.push(event);
      clusterMaxEnd = !clusterMaxEnd || end > clusterMaxEnd ? end : clusterMaxEnd;
    } else {
      finalizeCluster();
      cluster.push(event);
      clusterMaxEnd = end;
    }
  });

  finalizeCluster();

  return layouts;
}

export function getBusinessHourBounds(hours = []) {
  const active = hours.filter((h) => h?.isActive && h?.from && h?.to);
  if (active.length === 0) {
    return { startHour: 8, endHour: 20 };
  }

  let start = 24;
  let end = 0;

  active.forEach((item) => {
    const [fromH] = String(item.from).split(':').map(Number);
    const [toH, toM] = String(item.to).split(':').map(Number);
    if (!Number.isNaN(fromH)) start = Math.min(start, fromH);
    if (!Number.isNaN(toH)) {
      end = Math.max(end, toM > 0 ? toH + 1 : toH);
    }
  });

  return {
    startHour: Math.max(0, start === 24 ? 8 : start),
    endHour: Math.min(23, end === 0 ? 20 : end),
  };
}
