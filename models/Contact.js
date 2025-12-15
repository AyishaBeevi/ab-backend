import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    contact: { type: String, required: true }, // email or phone
    message: { type: String, required: true },
    method: { type: String, enum: ["call", "message"], default: "call" },

    isRead: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },

    // Auto-detect type
    contactType: { type: String, enum: ["phone", "email"], default: "phone" },

    // Track admin who handled it (optional)
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Lead priority (optional)
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  },
  { timestamps: true }
);

export default mongoose.model("Contact", contactSchema);
