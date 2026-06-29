import Client from "../models/Client.js";
import Room from "../models/Room.js";
import { durationHours } from "../utils/time.js";
import { ApiError } from "../utils/helpers.js";

// Blocks the reservation if the CIN matches a blacklisted client.
export async function assertClientAllowed(cin) {
  const existing = await Client.findOne({ cin: String(cin).trim() });
  if (existing?.is_blacklisted) {
    throw new ApiError(
      403,
      `Client sur liste noire : ${existing.blacklist_reason || "raison non précisée"}.`
    );
  }
  return existing;
}

// Computes server-side pricing, snapshotting the room's current tarif.
export async function computePricing(roomId, start_time, end_time) {
  const room = await Room.findById(roomId);
  if (!room || !room.is_active) throw new ApiError(404, "Salle introuvable ou inactive.");

  const duration_hours = durationHours(start_time, end_time);
  if (duration_hours <= 0) throw new ApiError(422, "L'heure de fin doit suivre l'heure de début.");

  const tarif_applied = room.tarif_horaire;
  const montant_total = Math.round(duration_hours * tarif_applied * 100) / 100;
  return { room, duration_hours, tarif_applied, montant_total };
}

// Derives payment status from amounts unless one was explicitly provided.
export function derivePaymentStatus(montant_total, acompte_paye) {
  const acompte = Number(acompte_paye) || 0;
  if (acompte <= 0) return "pending";
  if (acompte >= montant_total) return "paid";
  return "partial";
}

// Keeps the clients registry in sync (without touching blacklist fields).
export async function upsertClient({ name, phone, cin, email }) {
  return Client.findOneAndUpdate(
    { cin: String(cin).trim() },
    { $set: { name, phone, email }, $setOnInsert: { cin: String(cin).trim() } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}
