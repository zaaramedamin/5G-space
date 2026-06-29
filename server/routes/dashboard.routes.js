import { Router } from "express";
import { stats, roomsStatus } from "../controllers/dashboard.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();
router.use(verifyToken);

router.get("/stats", stats);
router.get("/rooms-status", roomsStatus);

export default router;
