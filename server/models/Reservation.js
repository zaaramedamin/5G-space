import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    ref: { type: String, unique: true, index: true },
    client: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      cin: { type: String, required: true, trim: true },
      email: { type: String, trim: true, lowercase: true },
    },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    date: { type: Date, required: true },
    start_time: { type: String, required: true }, // "HH:MM"
    end_time: { type: String, required: true }, // "HH:MM"
    duration_hours: { type: Number },
    // Tarif snapshotted at creation so later room tarif changes don't alter records.
    tarif_applied: { type: Number },
    montant_total: { type: Number },
    acompte_paye: { type: Number, default: 0 },
    payment_status: {
      type: String,
      enum: ["paid", "partial", "pending"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["confirmed", "checked_in", "checked_out", "cancelled", "no_show"],
      default: "confirmed",
    },
    actual_end_time: { type: String }, // recorded at check-out
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    checkin_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    checkout_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancel_reason: { type: String },
    notes: { type: String },
    // Set on every occurrence generated from one recurring booking.
    recurrence_group: { type: String, index: true },
  },
  { timestamps: true }
);

// Auto-generate a human reference like "RES-2026-001" on first save.
reservationSchema.pre("save", async function generateRef(next) {
  if (this.ref) return next();
  try {
    const year = new Date().getFullYear();
    const prefix = `RES-${year}-`;
    const last = await this.constructor
      .findOne({ ref: new RegExp(`^${prefix}`) })
      .sort({ ref: -1 })
      .select("ref")
      .lean();
    let seq = 1;
    if (last?.ref) {
      seq = parseInt(last.ref.slice(prefix.length), 10) + 1;
    }
    this.ref = `${prefix}${String(seq).padStart(3, "0")}`;
    next();
  } catch (err) {
    next(err);
  }
});

export default mongoose.model("Reservation", reservationSchema);
