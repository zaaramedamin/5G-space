// Helpers for working with "HH:MM" times and per-day date ranges.

export function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + (m || 0);
}

export function durationHours(start_time, end_time) {
  const diff = toMinutes(end_time) - toMinutes(start_time);
  return Math.round((diff / 60) * 100) / 100; // 2 decimals
}

// Two [start, end) ranges overlap when each starts before the other ends.
export function rangesOverlap(s1, e1, s2, e2) {
  return toMinutes(s1) < toMinutes(e2) && toMinutes(s2) < toMinutes(e1);
}

// Returns [startOfDay, startOfNextDay) for matching reservations on a calendar day.
export function dayRange(date) {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

// Minutes between now and a given "HH:MM" on a given date (positive => in future).
export function minutesUntil(date, hhmm) {
  const d = new Date(date);
  const [h, m] = String(hhmm).split(":").map(Number);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0);
  return Math.round((target.getTime() - Date.now()) / 60000);
}
