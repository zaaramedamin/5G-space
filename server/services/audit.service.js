import AuditLog from "../models/AuditLog.js";

// Records a traceable action. Called at the end of every state-changing operation.
// Never throws into the caller — an audit failure must not break the main action,
// but it is logged so it is not silently lost.
export async function logAction(userId, userName, action, entityType, entityId, details) {
  try {
    await AuditLog.create({
      user: userId,
      user_name: userName,
      action,
      entity_type: entityType,
      entity_id: entityId != null ? String(entityId) : undefined,
      details,
    });
  } catch (err) {
    console.error("Audit log failed:", action, err.message);
  }
}

export default logAction;
