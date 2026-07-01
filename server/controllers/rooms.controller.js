import { validationResult } from "express-validator";
import Room from "../models/Room.js";
import { logAction } from "../services/audit.service.js";
import { asyncHandler } from "../utils/helpers.js";

// GET /api/rooms  → list active rooms (?all=1 to include inactive)
export const listRooms = asyncHandler(async (req, res) => {
  const filter = req.query.all === "1" ? {} : { is_active: true };
  const rooms = await Room.find(filter).sort({ name: 1 });
  res.json(rooms);
});

// POST /api/rooms  (admin)
export const createRoom = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: "Données invalides.", errors: errors.array() });
  }
  const { name, capacity, tarif_horaire, description, color_tag, amenities } = req.body;
  const room = await Room.create({ name, capacity, tarif_horaire, description, color_tag, amenities });

  await logAction(req.user._id, req.user.name, "CREATE_ROOM", "room", room._id, room.toObject());
  res.status(201).json(room);
});

// PUT /api/rooms/:id  (admin)
export const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ message: "Salle introuvable." });

  const fields = ["name", "capacity", "tarif_horaire", "description", "color_tag", "amenities", "is_active"];
  const before = room.toObject();
  for (const f of fields) {
    if (req.body[f] !== undefined) room[f] = req.body[f];
  }
  await room.save();

  await logAction(req.user._id, req.user.name, "UPDATE_ROOM", "room", room._id, {
    before,
    after: room.toObject(),
  });
  res.json(room);
});

// DELETE /api/rooms/:id  → soft delete (admin)
export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ message: "Salle introuvable." });

  room.is_active = false;
  await room.save();

  await logAction(req.user._id, req.user.name, "DELETE_ROOM", "room", room._id, { name: room.name });
  res.json({ message: "Salle désactivée.", room });
});
