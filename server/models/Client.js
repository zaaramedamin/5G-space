import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    cin: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    is_blacklisted: { type: Boolean, default: false },
    blacklist_reason: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Client", clientSchema);
