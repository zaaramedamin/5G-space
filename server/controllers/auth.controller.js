import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import User from "../models/User.js";
import { asyncHandler } from "../utils/helpers.js";

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
}

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: "Données invalides.", errors: errors.array() });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Email ou mot de passe incorrect." });
  }
  if (!user.is_active) {
    return res.status(403).json({ message: "Compte désactivé." });
  }

  const token = signToken(user);
  return res.json({ token, user });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  return res.json({ user: req.user });
});
