import { Router } from "express";
import { report } from "../controllers/reports.controller.js";
import { verifyToken, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();
router.use(verifyToken, requireAdmin);

router.get("/", report);

export default router;
