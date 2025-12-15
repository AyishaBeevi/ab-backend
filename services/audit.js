// server/services/audit.js
import AuditLog from "../models/AuditLog.js";

export async function logAdminAction({
  adminId,
  action,
  targetType,
  targetId,
  meta = {},
}) {
  try {
    await AuditLog.create({
      admin: adminId,
      action,
      targetType,
      targetId,
      meta,
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
}
