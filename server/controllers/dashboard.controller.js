import Reservation from "../models/Reservation.js";
import Room from "../models/Room.js";
import { dayRange, minutesUntil } from "../utils/time.js";
import { asyncHandler, maskCin } from "../utils/helpers.js";

// GET /api/dashboard/stats  → today's headline numbers
export const stats = asyncHandler(async (req, res) => {
  const { start, end } = dayRange(new Date());
  const today = await Reservation.find({
    date: { $gte: start, $lt: end },
    status: { $ne: "cancelled" },
  }).select("montant_total acompte_paye status room");

  const occupiedRooms = new Set(
    today.filter((r) => r.status === "checked_in").map((r) => String(r.room))
  );

  const revenue_collected = today.reduce((s, r) => s + (r.acompte_paye || 0), 0);
  const pending_amount = today.reduce(
    (s, r) => s + Math.max((r.montant_total || 0) - (r.acompte_paye || 0), 0),
    0
  );

  res.json({
    total_reservations: today.length,
    rooms_occupied: occupiedRooms.size,
    revenue_collected: Math.round(revenue_collected * 100) / 100,
    pending_amount: Math.round(pending_amount * 100) / 100,
  });
});

// GET /api/dashboard/rooms-status  → live per-room occupancy (polled every 30s)
export const roomsStatus = asyncHandler(async (req, res) => {
  const { start, end } = dayRange(new Date());
  const rooms = await Room.find({ is_active: true }).sort({ name: 1 }).lean();

  const todays = await Reservation.find({
    date: { $gte: start, $lt: end },
    status: { $in: ["confirmed", "checked_in"] },
  })
    .populate({ path: "checkin_by", select: "name" })
    .sort({ start_time: 1 });

  const result = rooms.map((room) => {
    const forRoom = todays.filter((r) => String(r.room) === String(room._id));
    const active = forRoom.find((r) => r.status === "checked_in");
    const upcoming = forRoom.find((r) => r.status === "confirmed");
    const r = active || upcoming;

    const base = {
      room_id: room._id,
      name: room.name,
      capacity: room.capacity,
      color_tag: room.color_tag,
      status: active ? "occupee" : upcoming ? "reservee" : "libre",
    };
    if (!r) return { ...base, reservation: null };

    return {
      ...base,
      reservation: {
        id: r._id,
        ref: r.ref,
        client_name: r.client.name,
        cin_masked: maskCin(r.client.cin),
        start_time: r.start_time,
        end_time: r.end_time,
        checkin_by_name: r.checkin_by?.name || null,
        minutes_remaining: active ? minutesUntil(r.date, r.end_time) : null,
        minutes_until_start: !active ? minutesUntil(r.date, r.start_time) : null,
      },
    };
  });

  res.json(result);
});
