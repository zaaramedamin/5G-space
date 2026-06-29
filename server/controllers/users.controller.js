import { validationResult } from "express-validator";
import User from "../models/User.js";
import { logAction } from "../services/audit.service.js";
import { asyncHandler } from "../utils/helpers.js";

// GET /api/users  (admin)
export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users);
});

// POST /api/users  (admin)
export const createUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: "Données invalides.", errors: errors.array() });
  }
  const { name, email, password, role } = req.body;

  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) return res.status(409).json({ message: "Cet email est déjà utilisé." });

  const user = await User.create({ name, email, password, role });
  await logAction(req.user._id, req.user.name, "CREATE_USER", "user", user._id, {
    name, email, role: user.role,
  });
  res.status(201).json(user);
});

// PUT /api/users/:id  (admin) — also handles password reset
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

  const { name, email, role, password, is_active } = req.body;
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;
  if (is_active !== undefined) user.is_active = is_active;
  if (password) user.password = password; // re-hashed by the pre-save hook
  await user.save();

  await logAction(req.user._id, req.user.name, "UPDATE_USER", "user", user._id, {
    name: user.name, email: user.email, role: user.role,
    password_reset: Boolean(password),
  });
  res.json(user);
});

// PATCH /api/users/:id/deactivate  (admin)
export const deactivateUser = asyncHandler(async (req, res) => {
  if (req.params.id === String(req.user._id)) {
    return res.status(400).json({ message: "Vous ne pouvez pas désactiver votre propre compte." });
  }
  const user = await User.findByIdAndUpdate(req.params.id, { is_active: false }, { new: true });
  if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

  await logAction(req.user._id, req.user.name, "DEACTIVATE_USER", "user", user._id, { email: user.email });
  res.json(user);
});
