import cron from "node-cron";
import Reservation from "../models/Reservation.js";
import { minutesUntil } from "../utils/time.js";
import { logAction } from "../services/audit.service.js";

// A confirmed reservation whose start time passed more than this many minutes
// ago (without a check-in) is auto-flagged as a no-show.
const GRACE_MIN = 30;

export async function runNoShowSweep() {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Only reservations still "confirmed" and dated today or earlier can be overdue.
  const candidates = await Reservation.find({
    status: "confirmed",
    date: { $lte: endOfToday },
  }).select("ref date start_time status");

  let flagged = 0;
  for (const r of candidates) {
    if (minutesUntil(r.date, r.start_time) < -GRACE_MIN) {
      r.status = "no_show";
      await r.save();
      await logAction(null, "Système", "NO_SHOW", "reservation", r._id, { ref: r.ref, auto: true });
      flagged++;
    }
  }
  if (flagged) console.log(`[no-show] flagged ${flagged} reservation(s) as no_show`);
  return flagged;
}

export function startNoShowJob() {
  // Every 30 minutes.
  cron.schedule("*/30 * * * *", () => {
    runNoShowSweep().catch((e) => console.error("[no-show] sweep failed:", e.message));
  });
  // Also run once shortly after boot.
  runNoShowSweep().catch((e) => console.error("[no-show] initial sweep failed:", e.message));
}
