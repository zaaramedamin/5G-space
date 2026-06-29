import AuditLog from "../models/AuditLog.js";
import { asyncHandler } from "../utils/helpers.js";

// GET /api/audit?user=&action=&from=&to=  (admin)
export const listAudit = asyncHandler(async (req, res) => {
  const { user, action, from, to } = req.query;
  const filter = {};
  if (user) filter.user = user;
  if (action) filter.action = action;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const logs = await AuditLog.find(filter)
    .populate({ path: "user", select: "name email role" })
    .sort({ createdAt: -1 })
    .limit(500);
  res.json(logs);
});
