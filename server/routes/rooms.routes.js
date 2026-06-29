import { Router } from "express";
import { body } from "express-validator";
import {
  listRooms,
  createRoom,
  updateRoom,
  deleteRoom,
} from "../controllers/rooms.controller.js";
import { verifyToken, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyToken);

router.get("/", listRooms);

router.post(
  "/",
  requireAdmin,
  [
    body("name").trim().notEmpty().withMessage("Nom requis."),
    body("capacity").isInt({ min: 1 }).withMessage("Capacité invalide."),
  ],
  createRoom
);

router.put("/:id", requireAdmin, updateRoom);
router.delete("/:id", requireAdmin, deleteRoom);

export default router;
