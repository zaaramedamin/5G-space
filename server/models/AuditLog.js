import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    user_name: { type: String },
    action: { type: String, required: true }, // e.g. "CREATE_RESERVATION"
    entity_type: { type: String }, // "reservation" | "room" | "client" | "user"
    entity_id: { type: String },
    details: { type: mongoose.Schema.Types.Mixed }, // snapshot of what changed
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model("AuditLog", auditLogSchema);
