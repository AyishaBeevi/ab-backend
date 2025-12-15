// server/models/AuditLog.js
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true, // e.g. PROPERTY_APPROVED, ROLE_CHANGED
    },
    targetType: {
      type: String,
      required: true, // "User" | "Property"
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    meta: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);
