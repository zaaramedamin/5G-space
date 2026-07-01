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

  const { page, limit: lim } = req.query;
  const limit = Math.min(Number(lim) || 50, 200);
  const currentPage = Math.max(Number(page) || 1, 1);
  const skip = (currentPage - 1) * limit;

  const total = await AuditLog.countDocuments(filter);
  const logs = await AuditLog.find(filter)
    .populate({ path: "user", select: "name email role" })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  res.json({ data: logs, total, page: currentPage, pages: Math.ceil(total / limit) || 1 });
});
