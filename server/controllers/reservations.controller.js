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
import { dayRange, minutesUntil } from "../utils/time.js";
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

// GET /api/reservations  → filters: date, room, status, payment_status
export const listReservations = asyncHandler(async (req, res) => {
  const { date, room, status, payment_status } = req.query;
  const filter = {};
  if (date) {
    const { start, end } = dayRange(date);
    filter.date = { $gte: start, $lt: end };
  }
  if (room) filter.room = room;
  if (status) filter.status = status;
  if (payment_status) filter.payment_status = payment_status;

  const list = await Reservation.find(filter).populate(POPULATE).sort({ date: 1, start_time: 1 });
  res.json(list);
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
  const { client, room, date, start_time, end_time, acompte_paye = 0, notes } = req.body;

  await assertClientAllowed(client.cin);
  const conflict = await checkConflict(room, date, start_time, end_time);
  if (conflict) throw new ApiError(409, `Conflit avec la réservation ${conflict.ref}.`);

  const { duration_hours, tarif_applied, montant_total } = await computePricing(
    room, start_time, end_time
  );

  const reservation = await Reservation.create({
    client, room, date, start_time, end_time,
    duration_hours, tarif_applied, montant_total,
    acompte_paye, payment_status: derivePaymentStatus(montant_total, acompte_paye),
    notes, status: "confirmed", created_by: req.user._id,
  });
  await upsertClient(client);
  await reservation.populate(POPULATE);

  await logAction(req.user._id, req.user.name, "CREATE_RESERVATION", "reservation", reservation._id, reservation.toObject());
  res.status(201).json(reservation);
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
  if (Math.abs(minutesUntil(r.date, r.start_time)) > 15) {
    throw new ApiError(422, "Check-in autorisé seulement à ±15 min de l'heure de début.");
  }

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
