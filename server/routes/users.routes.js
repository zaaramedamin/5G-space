import { Router } from "express";
import { body } from "express-validator";
import {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
  deleteUser,
} from "../controllers/users.controller.js";
import { verifyToken, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();
router.use(verifyToken, requireAdmin);

router.get("/", listUsers);

router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Nom requis."),
    body("email").isEmail().withMessage("Email invalide."),
    body("password").isLength({ min: 6 }).withMessage("Mot de passe trop court (min 6)."),
  ],
  createUser
);

router.put("/:id", updateUser);
router.patch("/:id/deactivate", deactivateUser);
router.delete("/:id", deleteUser);

export default router;
