import { Router } from "express";
import { body } from "express-validator";
import { login, me } from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Email invalide."),
    body("password").notEmpty().withMessage("Mot de passe requis."),
  ],
  login
);

router.get("/me", verifyToken, me);

export default router;
