import { Router } from "express";
import { body } from "express-validator";
import {
  listReservations,
  getReservation,
  createReservation,
  updateReservation,
  checkin,
  checkout,
  cancel,
  updatePayment,
  ical,
} from "../controllers/reservations.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();
router.use(verifyToken);

const createRules = [
  body("client.name").trim().notEmpty().withMessage("Nom du client requis."),
  body("client.phone").trim().notEmpty().withMessage("Téléphone requis."),
  body("client.cin").trim().notEmpty().withMessage("CIN requis."),
  body("room").notEmpty().withMessage("Salle requise."),
  body("date").notEmpty().withMessage("Date requise."),
  body("start_time").matches(/^\d{2}:\d{2}$/).withMessage("Heure de début invalide."),
  body("end_time").matches(/^\d{2}:\d{2}$/).withMessage("Heure de fin invalide."),
];

router.get("/", listReservations);
router.post("/", createRules, createReservation);
router.get("/:id", getReservation);
router.get("/:id/ical", ical);
router.put("/:id", updateReservation);
router.post("/:id/checkin", checkin);
router.post("/:id/checkout", checkout);
router.post("/:id/cancel", cancel);
router.patch("/:id/payment", updatePayment);

export default router;
