import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Room from "./models/Room.js";
import Client from "./models/Client.js";
import Reservation from "./models/Reservation.js";
import { durationHours } from "./utils/time.js";

const DEMO_NOTE = "Exemple démo";
const pad = (n) => String(n).padStart(2, "0");
const hhmm = (h) => `${pad(h)}:00`;

const CLIENTS = [
  { name: "Mohamed Trabelsi", phone: "20123456", cin: "09887766", email: "m.trabelsi@example.tn" },
  { name: "Sonia Ben Salah", phone: "55998877", cin: "11223344", email: "sonia.bs@example.tn" },
  { name: "Karim Jelassi", phone: "98765432", cin: "07654321", email: "karim.j@example.tn" },
  { name: "Ines Bouazizi", phone: "24558899", cin: "08123456", email: "ines.b@example.tn" },
  { name: "Ahmed Khelifi", phone: "52447788", cin: "06789012", email: "ahmed.k@example.tn" },
  { name: "Rania Mansour", phone: "27889900", cin: "10345678", email: "rania.m@example.tn" },
  { name: "Bilel Hamdi", phone: "94112233", cin: "09456123", email: "bilel.h@example.tn" },
  { name: "Fatma Zouari", phone: "23667788", cin: "07998877", email: "fatma.z@example.tn" },
];

async function run() {
  await connectDB();

  const admin = await User.findOne({ role: "admin" });
  if (!admin) throw new Error("Aucun administrateur trouvé.");
  const rooms = await Room.find({ is_active: true }).sort({ name: 1 });
  if (!rooms.length) throw new Error("Aucune salle active trouvée.");

  // Idempotent: wipe any previous demo reservations before re-inserting.
  const del = await Reservation.deleteMany({ notes: DEMO_NOTE });
  console.log(`Removed ${del.deletedCount} previous demo reservation(s).`);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // current month
  const today = now.getDate();

  const days = [1, 2, 3, 5, 7, 8, 9, 10, 12, 14, 15, 16, 17, 19, 21, 22, 23, 24, 26, 28, 29, 30, 31]
    .filter((d) => new Date(year, month, d).getMonth() === month);

  const startHours = [9, 11, 14, 16, 10, 13, 8, 15, 17];
  const durations = [1, 2, 2, 3, 1, 2];
  const acompteRatios = [0, 0.5, 1, 1, 0.5, 1]; // pending / partial / paid mix

  const used = new Set(); // `${roomIdx}-${day}-${hour}`
  const plans = [];
  let i = 0;
  for (const day of days) {
    const perDay = day % 3 === 0 ? 2 : 1;
    for (let k = 0; k < perDay; k++) {
      const roomIdx = i % rooms.length;
      const start = startHours[(i + k) % startHours.length];
      const dur = durations[i % durations.length];
      const end = start + dur;
      i++;
      if (end > 21) continue;
      let overlap = false;
      for (let hh = start; hh < end; hh++) if (used.has(`${roomIdx}-${day}-${hh}`)) overlap = true;
      if (overlap) continue;
      for (let hh = start; hh < end; hh++) used.add(`${roomIdx}-${day}-${hh}`);

      // Today's demos are completed (checked_out) so the no-show cron leaves them
      // alone; future ones stay confirmed; a few are cancelled for variety.
      let status = day <= today ? "checked_out" : "confirmed";
      if (status === "confirmed" && i % 8 === 5) status = "cancelled";

      plans.push({
        roomIdx, day, start, end,
        client: CLIENTS[i % CLIENTS.length],
        acompteRatio: acompteRatios[i % acompteRatios.length],
        status,
      });
    }
  }

  let created = 0;
  for (const p of plans) {
    const room = rooms[p.roomIdx];
    // UTC midnight — matches how the app stores dates (from "YYYY-MM-DD" strings).
    const date = new Date(Date.UTC(year, month, p.day));
    const duration = durationHours(hhmm(p.start), hhmm(p.end));
    const montant = Math.round(duration * room.tarif_horaire * 100) / 100;
    const acompte = p.status === "cancelled" ? 0 : Math.round(montant * p.acompteRatio * 100) / 100;
    const payment_status = acompte <= 0 ? "pending" : acompte >= montant ? "paid" : "partial";

    const r = await Reservation.create({
      client: p.client, room: room._id, date,
      start_time: hhmm(p.start), end_time: hhmm(p.end), duration_hours: duration,
      tarif_applied: room.tarif_horaire, montant_total: montant,
      acompte_paye: acompte, payment_status, status: p.status,
      created_by: admin._id,
      checkout_by: p.status === "checked_out" ? admin._id : undefined,
      actual_end_time: p.status === "checked_out" ? hhmm(p.end) : undefined,
      cancel_reason: p.status === "cancelled" ? "Annulation client (démo)" : undefined,
      notes: DEMO_NOTE,
    });
    await Client.findOneAndUpdate(
      { cin: p.client.cin },
      { $set: { name: p.client.name, phone: p.client.phone, email: p.client.email }, $setOnInsert: { cin: p.client.cin } },
      { upsert: true }
    );
    created++;
    if (created <= 30) console.log(`  ${r.ref}  ${date.toISOString().slice(0, 10)} ${hhmm(p.start)}-${hhmm(p.end)}  ${room.name}  ${p.status}  ${payment_status}`);
  }

  console.log(`\n✅ ${created} réservations d'exemple créées pour ${year}-${pad(month + 1)} (notes: "${DEMO_NOTE}").`);
  await mongoose.disconnect();
}

run().catch(async (e) => {
  console.error("Échec:", e.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
