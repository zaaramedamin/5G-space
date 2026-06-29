import Reservation from "../models/Reservation.js";
import { dayRange, rangesOverlap } from "../utils/time.js";

// Business rule: only one active reservation (confirmed | checked_in) per room
// at any overlapping time slot. Returns the conflicting reservation, or null.
export async function checkConflict(roomId, date, start_time, end_time, excludeId) {
  const { start, end } = dayRange(date);

  const query = {
    room: roomId,
    date: { $gte: start, $lt: end },
    status: { $in: ["confirmed", "checked_in"] },
  };
  if (excludeId) query._id = { $ne: excludeId };

  const sameDay = await Reservation.find(query).select(
    "ref start_time end_time"
  );

  return (
    sameDay.find((r) =>
      rangesOverlap(start_time, end_time, r.start_time, r.end_time)
    ) || null
  );
}

export default checkConflict;
