import "dotenv/config";
import mongoose from "mongoose";

import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Room from "./models/Room.js";
import Client from "./models/Client.js";
import Reservation from "./models/Reservation.js";
import AuditLog from "./models/AuditLog.js";
import { durationHours } from "./utils/time.js";
import { logAction } from "./services/audit.service.js";

const pad = (n) => String(n).padStart(2, "0");
const hhmm = (h, m = 0) => `${pad(Math.min(Math.max(h, 0), 23))}:${pad(m)}`;
const dayOffset = (days) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
};

async function seed() {
  await connectDB();

  console.log("Clearing collections...");
  await Promise.all([
    User.deleteMany({}),
    Room.deleteMany({}),
    Client.deleteMany({}),
    Reservation.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  console.log("Creating rooms...");
  const [alpha, beta, gamma] = await Room.create([
    { name: "Salle Alpha", capacity: 8, tarif_horaire: 10, color_tag: "#3b82f6", description: "Salle de réunion principale" },
    { name: "Salle Beta", capacity: 4, tarif_horaire: 10, color_tag: "#10b981", description: "Petite salle" },
    { name: "Salle Gamma", capacity: 12, tarif_horaire: 15, color_tag: "#f59e0b", description: "Grande salle / formation" },
  ]);

  console.log("Creating users...");
  const admin = await User.create({ name: "Administrateur", email: "admin@5gspace.tn", password: "Admin123!", role: "admin" });
  const staff = await User.create({ name: "Agent Accueil", email: "staff@5gspace.tn", password: "Staff123!", role: "staff" });

  console.log("Creating clients (incl. one blacklisted)...");
  await Client.create([
    { name: "Mohamed Trabelsi", phone: "20123456", cin: "09887766", email: "m.trabelsi@example.tn" },
    { name: "Sonia Ben Salah", phone: "55998877", cin: "11223344", email: "sonia.bs@example.tn" },
    { name: "Karim Jelassi", phone: "98765432", cin: "07654321", email: "karim.j@example.tn" },
    { name: "Yassine Gharbi", phone: "22113355", cin: "05551234", is_blacklisted: true, blacklist_reason: "No-show répété + paiement non honoré" },
  ]);

  const h = new Date().getHours();

  // 5 reservations across today and the next 3 days with varied states.
  const plans = [
    { room: alpha, date: dayOffset(0), start: hhmm(h - 1), end: hhmm(h + 1), status: "checked_in", acompteRatio: 0.5,
      client: { name: "Mohamed Trabelsi", phone: "20123456", cin: "09887766", email: "m.trabelsi@example.tn" }, checkin: staff },
    { room: beta, date: dayOffset(0), start: hhmm(h + 1), end: hhmm(h + 2), status: "confirmed", acompteRatio: 0,
      client: { name: "Sonia Ben Salah", phone: "55998877", cin: "11223344", email: "sonia.bs@example.tn" } },
    { room: gamma, date: dayOffset(0), start: hhmm(9), end: hhmm(11), status: "checked_out", acompteRatio: 1,
      client: { name: "Karim Jelassi", phone: "98765432", cin: "07654321", email: "karim.j@example.tn" }, checkin: admin, checkout: admin, actual_end: hhmm(11) },
    { room: alpha, date: dayOffset(1), start: hhmm(14), end: hhmm(16), status: "confirmed", acompteRatio: 1,
      client: { name: "Sonia Ben Salah", phone: "55998877", cin: "11223344", email: "sonia.bs@example.tn" } },
    { room: beta, date: dayOffset(3), start: hhmm(10), end: hhmm(12), status: "cancelled", acompteRatio: 0, cancel_reason: "Client a annulé par téléphone",
      client: { name: "Mohamed Trabelsi", phone: "20123456", cin: "09887766", email: "m.trabelsi@example.tn" } },
  ];

  console.log("Creating reservations...");
  for (const p of plans) {
    const duration = durationHours(p.start, p.end);
    const montant = Math.round(duration * p.room.tarif_horaire * 100) / 100;
    const acompte = Math.round(montant * p.acompteRatio * 100) / 100;
    const payment_status = acompte <= 0 ? "pending" : acompte >= montant ? "paid" : "partial";

    // Created sequentially so the auto-incremented ref stays unique.
    const r = await Reservation.create({
      client: p.client, room: p.room._id, date: p.date,
      start_time: p.start, end_time: p.end, duration_hours: duration,
      tarif_applied: p.room.tarif_horaire, montant_total: montant,
      acompte_paye: acompte, payment_status, status: p.status,
      created_by: admin._id,
      checkin_by: p.checkin?._id, checkout_by: p.checkout?._id,
      actual_end_time: p.actual_end, cancel_reason: p.cancel_reason,
    });
    await logAction(admin._id, admin.name, "CREATE_RESERVATION", "reservation", r._id, { ref: r.ref, seeded: true });
  }

  console.log("\nSeed complete.");
  console.log("  Rooms:        3 (Alpha, Beta, Gamma)");
  console.log("  Admin login:  admin@5gspace.tn / Admin123!");
  console.log("  Staff login:  staff@5gspace.tn / Staff123!");
  console.log("  Reservations: 5 (today + next 3 days, varied statuses)");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("Seed failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
