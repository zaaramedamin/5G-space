import { randomUUID } from "crypto";
import { validationResult } from "express-validator";
import Reservation from "../models/Reservation.js";
import { checkConflict } from "../services/conflict.service.js";
import { logAction } from "../services/audit.service.js";
import {
  assertClientAllowed,
  computePricing,
  derivePaymentStatus,
  upsertClient,
} from "../services/reservations.service.js";
import { dayRange } from "../utils/time.js";
import { asyncHandler, ApiError } from "../utils/helpers.js";

const POPULATE = [
  { path: "room", select: "name capacity tarif_horaire color_tag" },
  { path: "created_by checkin_by checkout_by", select: "name" },
];

const nowHHMM = () => new Date().toTimeString().slice(0, 5);

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ message: "Données invalides.", errors: errors.array() });
    return false;
  }
  return true;
}

// GET /api/reservations  → filters: date, room, status, payment_status, page, limit
export const listReservations = asyncHandler(async (req, res) => {
  const { date, room, status, payment_status, page, limit: lim } = req.query;
  const filter = {};
  if (date) {
    const { start, end } = dayRange(date);
    filter.date = { $gte: start, $lt: end };
  }
  if (room) filter.room = room;
  if (status) filter.status = status;
  if (payment_status) filter.payment_status = payment_status;

  const limit = Math.min(Number(lim) || 30, 200);
  const currentPage = Math.max(Number(page) || 1, 1);
  const skip = (currentPage - 1) * limit;
  const total = await Reservation.countDocuments(filter);
  const data = await Reservation.find(filter).populate(POPULATE).sort({ date: -1, start_time: 1 }).skip(skip).limit(limit);
  res.json({ data, total, page: currentPage, pages: Math.ceil(total / limit) || 1 });
});

// GET /api/reservations/:id
export const getReservation = asyncHandler(async (req, res) => {
  const r = await Reservation.findById(req.params.id).populate(POPULATE);
  if (!r) return res.status(404).json({ message: "Réservation introuvable." });
  res.json(r);
});

// POST /api/reservations
export const createReservation = asyncHandler(async (req, res) => {
  if (!validate(req, res)) return;
  const { client, room, date, start_time, end_time, acompte_paye = 0, notes, recurrence } = req.body;

  await assertClientAllowed(client.cin);

  // Build the list of dates: one, or weekly occurrences up to `recurrence.until`.
  const recurring = recurrence?.frequency === "weekly" && recurrence?.until;
  let dates = [new Date(date)];
  if (recurring) {
    dates = [];
    const until = new Date(recurrence.until);
    const cursor = new Date(date);
    for (let i = 0; i < 52 && cursor <= until; i++) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
  }

  const { duration_hours, tarif_applied, montant_total } = await computePricing(room, start_time, end_time);
  const group_id = recurring ? randomUUID() : undefined;

  const created = [];
  const skipped = [];
  for (const dt of dates) {
    const conflict = await checkConflict(room, dt, start_time, end_time);
    if (conflict) { skipped.push({ date: dt, ref: conflict.ref }); continue; }
    // A single deposit can't apply to every occurrence, so recurring ones start at 0.
    const dep = recurring ? 0 : acompte_paye;
    const r = await Reservation.create({
      client, room, date: dt, start_time, end_time,
      duration_hours, tarif_applied, montant_total,
      acompte_paye: dep, payment_status: derivePaymentStatus(montant_total, dep),
      notes, status: "confirmed", created_by: req.user._id,
      recurrence_group: group_id,
    });
    created.push(r);
  }

  if (created.length === 0) {
    throw new ApiError(409, "Toutes les dates sont en conflit. Aucune réservation créée.");
  }
  await upsertClient(client);

  if (!recurring) {
    const single = created[0];
    await single.populate(POPULATE);
    await logAction(req.user._id, req.user.name, "CREATE_RESERVATION", "reservation", single._id, single.toObject());
    return res.status(201).json(single);
  }

  await logAction(req.user._id, req.user.name, "CREATE_RESERVATION", "reservation", created[0]._id, {
    ref: created[0].ref, recurring: true, count: created.length, skipped: skipped.length, group_id,
  });
  res.status(201).json({
    recurring: true,
    created_count: created.length,
    skipped: skipped.map((s) => ({ date: s.date, conflict_ref: s.ref })),
    group_id,
    first_ref: created[0].ref,
  });
});

// PUT /api/reservations/:id  → edit only while confirmed
export const updateReservation = asyncHandler(async (req, res) => {
  const r = await Reservation.findById(req.params.id);
  if (!r) return res.status(404).json({ message: "Réservation introuvable." });
  if (r.status !== "confirmed") {
    throw new ApiError(409, "Seules les réservations confirmées sont modifiables.");
  }

  const before = r.toObject();
  const { client, room, date, start_time, end_time, notes } = req.body;
  if (client) { await assertClientAllowed(client.cin); r.client = client; }
  if (date) r.date = date;
  if (start_time) r.start_time = start_time;
  if (end_time) r.end_time = end_time;
  if (room) r.room = room;
  if (notes !== undefined) r.notes = notes;

  const conflict = await checkConflict(r.room, r.date, r.start_time, r.end_time, r._id);
  if (conflict) throw new ApiError(409, `Conflit avec la réservation ${conflict.ref}.`);

  const pricing = await computePricing(r.room, r.start_time, r.end_time);
  r.duration_hours = pricing.duration_hours;
  r.tarif_applied = pricing.tarif_applied;
  r.montant_total = pricing.montant_total;
  r.payment_status = derivePaymentStatus(r.montant_total, r.acompte_paye);
  await r.save();
  if (client) await upsertClient(client);
  await r.populate(POPULATE);

  await logAction(req.user._id, req.user.name, "UPDATE_RESERVATION", "reservation", r._id, { before, after: r.toObject() });
  res.json(r);
});

// POST /api/reservations/:id/checkin
export const checkin = asyncHandler(async (req, res) => {
  const r = await Reservation.findById(req.params.id);
  if (!r) return res.status(404).json({ message: "Réservation introuvable." });
  if (r.status !== "confirmed") throw new ApiError(409, "Check-in impossible dans cet état.");

  r.status = "checked_in";
  r.checkin_by = req.user._id;
  await r.save();
  await r.populate(POPULATE);

  await logAction(req.user._id, req.user.name, "CHECK_IN", "reservation", r._id, { ref: r.ref });
  res.json(r);
});

// POST /api/reservations/:id/checkout
export const checkout = asyncHandler(async (req, res) => {
  const r = await Reservation.findById(req.params.id);
  if (!r) return res.status(404).json({ message: "Réservation introuvable." });
  if (r.status !== "checked_in") throw new ApiError(409, "Check-out impossible dans cet état.");

  r.status = "checked_out";
  r.checkout_by = req.user._id;
  r.actual_end_time = nowHHMM();
  await r.save();
  await r.populate(POPULATE);

  await logAction(req.user._id, req.user.name, "CHECK_OUT", "reservation", r._id, { ref: r.ref, actual_end_time: r.actual_end_time });
  res.json(r);
});

// POST /api/reservations/:id/cancel  → requires cancel_reason
export const cancel = asyncHandler(async (req, res) => {
  const { cancel_reason } = req.body;
  if (!cancel_reason?.trim()) throw new ApiError(422, "Un motif d'annulation est requis.");
  const r = await Reservation.findById(req.params.id);
  if (!r) return res.status(404).json({ message: "Réservation introuvable." });
  if (["checked_out", "cancelled"].includes(r.status)) {
    throw new ApiError(409, "Cette réservation ne peut plus être annulée.");
  }

  r.status = "cancelled";
  r.cancel_reason = cancel_reason.trim();
  await r.save();
  await r.populate(POPULATE);

  await logAction(req.user._id, req.user.name, "CANCEL", "reservation", r._id, { ref: r.ref, cancel_reason: r.cancel_reason });
  res.json(r);
});

// PATCH /api/reservations/:id/payment
export const updatePayment = asyncHandler(async (req, res) => {
  const r = await Reservation.findById(req.params.id);
  if (!r) return res.status(404).json({ message: "Réservation introuvable." });

  const { acompte_paye, payment_status } = req.body;
  if (acompte_paye !== undefined) r.acompte_paye = Number(acompte_paye) || 0;
  r.payment_status = payment_status || derivePaymentStatus(r.montant_total, r.acompte_paye);
  await r.save();
  await r.populate(POPULATE);

  await logAction(req.user._id, req.user.name, "PAYMENT_UPDATE", "reservation", r._id, {
    ref: r.ref, acompte_paye: r.acompte_paye, payment_status: r.payment_status,
  });
  res.json(r);
});

// GET /api/reservations/:id/ical  → downloadable .ics for personal calendars
export const ical = asyncHandler(async (req, res) => {
  const r = await Reservation.findById(req.params.id).populate({ path: "room", select: "name" });
  if (!r) return res.status(404).json({ message: "Réservation introuvable." });

  const pad = (n) => String(n).padStart(2, "0");
  const dt = (dateObj, hhmm) => {
    const d = new Date(dateObj);
    const [h, m] = String(hhmm).split(":").map(Number);
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(h)}${pad(m)}00`;
  };
  const esc = (s) => String(s || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//5G Space//Reservation//FR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${r._id}@5gspace`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dt(r.date, r.start_time)}`,
    `DTEND:${dt(r.date, r.end_time)}`,
    `SUMMARY:${esc(`${r.room?.name || "Salle"} — ${r.client?.name || ""}`)}`,
    `DESCRIPTION:${esc(`Réservation ${r.ref} · ${r.client?.name || ""} · ${r.client?.phone || ""}`)}`,
    "LOCATION:5G Space Bizerte",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${r.ref || "reservation"}.ics"`);
  res.send(ics);
});
