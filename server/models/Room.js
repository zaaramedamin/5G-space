import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true },
    tarif_horaire: { type: Number, default: 10 },
    description: { type: String, default: "" },
    color_tag: { type: String, default: "#3b82f6" },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Room", roomSchema);
