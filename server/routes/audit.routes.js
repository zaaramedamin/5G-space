import { Router } from "express";
import { listAudit } from "../controllers/audit.controller.js";
import { verifyToken, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();
router.use(verifyToken, requireAdmin);

router.get("/", listAudit);

export default router;
