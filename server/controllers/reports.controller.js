import Reservation from "../models/Reservation.js";
import Room from "../models/Room.js";
import { asyncHandler } from "../utils/helpers.js";

const OPEN_HOUR = 8;
const CLOSE_HOUR = 21;
const OPEN_HOURS_PER_DAY = CLOSE_HOUR - OPEN_HOUR; // 13h operating window

function monthRange(d) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { start, end };
}
function weekRange(d) {
  const day = (d.getDay() + 6) % 7; // Monday = 0
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}
const daysBetween = (start, end) => Math.max(Math.round((end - start) / 86400000), 1);
const round2 = (n) => Math.round(n * 100) / 100;

// GET /api/reports?period=month|week   (admin only)
export const report = asyncHandler(async (req, res) => {
  const period = req.query.period === "week" ? "week" : "month";
  const now = new Date();
  const range = period === "week" ? weekRange(now) : monthRange(now);
  // Previous comparable period (the day before this period started).
  const prevAnchor = new Date(range.start.getTime() - 86400000);
  const prevRange = period === "week" ? weekRange(prevAnchor) : monthRange(prevAnchor);

  const rooms = await Room.find().lean();

  const fetch = (r) =>
    Reservation.find({ date: { $gte: r.start, $lt: r.end }, status: { $ne: "cancelled" } }).lean();
  const [current, previous] = await Promise.all([fetch(range), fetch(prevRange)]);

  const sum = (arr, fn) => arr.reduce((s, x) => s + fn(x), 0);
  const collected = (r) => r.acompte_paye || 0;
  const pending = (r) => Math.max((r.montant_total || 0) - (r.acompte_paye || 0), 0);

  const revenue_collected = sum(current, collected);
  const revenue_pending = sum(current, pending);
  const revenue_total = sum(current, (r) => r.montant_total || 0);
  const prev_collected = sum(previous, collected);

  // Revenue & bookings per day
  const byDay = {};
  current.forEach((r) => {
    const key = new Date(r.date).toISOString().slice(0, 10);
    byDay[key] = byDay[key] || { date: key, collected: 0, pending: 0, bookings: 0 };
    byDay[key].collected += collected(r);
    byDay[key].pending += pending(r);
    byDay[key].bookings += 1;
  });
  const revenue_by_day = Object.values(byDay)
    .map((d) => ({ ...d, collected: round2(d.collected), pending: round2(d.pending) }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Occupancy + revenue per room
  const capacityHours = OPEN_HOURS_PER_DAY * daysBetween(range.start, range.end);
  const roomAgg = {};
  current.forEach((r) => {
    const id = String(r.room);
    roomAgg[id] = roomAgg[id] || { hours: 0, bookings: 0, revenue: 0 };
    roomAgg[id].hours += r.duration_hours || 0;
    roomAgg[id].bookings += 1;
    roomAgg[id].revenue += r.montant_total || 0;
  });
  const occupancy = rooms
    .map((rm) => {
      const a = roomAgg[String(rm._id)] || { hours: 0, bookings: 0, revenue: 0 };
      return {
        room_id: rm._id,
        name: rm.name,
        color_tag: rm.color_tag,
        hours_booked: round2(a.hours),
        bookings: a.bookings,
        revenue: round2(a.revenue),
        occupancy_pct: capacityHours ? Math.round((a.hours / capacityHours) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  // Peak hours histogram (across the operating window)
  const hourCounts = {};
  current.forEach((r) => {
    const h = parseInt(String(r.start_time).slice(0, 2), 10);
    if (!Number.isNaN(h)) hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const peak_hours = [];
  for (let h = OPEN_HOUR; h < CLOSE_HOUR; h++) {
    peak_hours.push({ hour: `${String(h).padStart(2, "0")}h`, count: hourCounts[h] || 0 });
  }

  const payment_breakdown = ["paid", "partial", "pending"].map((status) => ({
    status,
    count: current.filter((r) => r.payment_status === status).length,
  }));

  const pct = (cur, prev) => (prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : cur ? 100 : 0);

  res.json({
    period,
    from: range.start,
    to: range.end,
    kpis: {
      revenue_collected: round2(revenue_collected),
      revenue_pending: round2(revenue_pending),
      revenue_total: round2(revenue_total),
      reservations: current.length,
      revenue_delta_pct: pct(revenue_collected, prev_collected),
      reservations_delta_pct: pct(current.length, previous.length),
    },
    revenue_by_day,
    occupancy,
    top_rooms: occupancy.slice(0, 5).map((o) => ({ name: o.name, bookings: o.bookings, revenue: o.revenue })),
    peak_hours,
    payment_breakdown,
  });
});
