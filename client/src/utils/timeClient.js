// Client-side time helpers mirroring the server's pricing math so the modal
// can preview duration/total before the backend confirms it.

export function toMinutes(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + (m || 0);
}

export function durationHours(start_time, end_time) {
  const diff = toMinutes(end_time) - toMinutes(start_time);
  return Math.round((diff / 60) * 100) / 100;
}

// Minutes from now until "HH:MM" on `date` (positive => still in the future).
export function minutesUntil(date, hhmm) {
  const d = new Date(date);
  const [h, m] = String(hhmm).split(":").map(Number);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m || 0, 0, 0);
  return Math.round((target.getTime() - Date.now()) / 60000);
}

// Check-in is allowed only within ±15 min of the start time (matches the backend rule).
export function canCheckInNow(date, start_time) {
  return Math.abs(minutesUntil(date, start_time)) <= 15;
}
