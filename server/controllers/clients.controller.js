import Client from "../models/Client.js";
import Reservation from "../models/Reservation.js";
import { logAction } from "../services/audit.service.js";
import { asyncHandler } from "../utils/helpers.js";

// GET /api/clients?search=&cin=  → list with reservation counts
export const listClients = asyncHandler(async (req, res) => {
  const { search, cin } = req.query;
  const filter = {};
  if (cin) filter.cin = cin.trim();
  if (search) {
    const rx = new RegExp(search.trim(), "i");
    filter.$or = [{ name: rx }, { phone: rx }, { cin: rx }];
  }

  const clients = await Client.find(filter).sort({ name: 1 }).lean();

  // Attach reservation counts (reservations link to clients by CIN).
  const counts = await Reservation.aggregate([
    { $group: { _id: "$client.cin", count: { $sum: 1 } } },
  ]);
  const byCin = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  res.json(clients.map((c) => ({ ...c, reservations_count: byCin[c.cin] || 0 })));
});

// GET /api/clients/:id  → detail with full reservation history
export const getClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id).lean();
  if (!client) return res.status(404).json({ message: "Client introuvable." });

  const history = await Reservation.find({ "client.cin": client.cin })
    .populate({ path: "room", select: "name" })
    .sort({ date: -1 });
  res.json({ ...client, history });
});

// POST /api/clients/:id/blacklist  (admin)
export const blacklist = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  if (!reason?.trim()) return res.status(422).json({ message: "Un motif est requis." });

  const client = await Client.findByIdAndUpdate(
    req.params.id,
    { is_blacklisted: true, blacklist_reason: reason.trim() },
    { new: true }
  );
  if (!client) return res.status(404).json({ message: "Client introuvable." });

  await logAction(req.user._id, req.user.name, "BLACKLIST_CLIENT", "client", client._id, {
    cin: client.cin, reason: reason.trim(),
  });
  res.json(client);
});

// POST /api/clients/:id/unblacklist  (admin)
export const unblacklist = asyncHandler(async (req, res) => {
  const client = await Client.findByIdAndUpdate(
    req.params.id,
    { is_blacklisted: false, blacklist_reason: "" },
    { new: true }
  );
  if (!client) return res.status(404).json({ message: "Client introuvable." });

  await logAction(req.user._id, req.user.name, "UNBLACKLIST_CLIENT", "client", client._id, {
    cin: client.cin,
  });
  res.json(client);
});
