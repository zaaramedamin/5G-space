import { Router } from "express";
import {
  listClients,
  getClient,
  blacklist,
  unblacklist,
} from "../controllers/clients.controller.js";
import { verifyToken, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();
router.use(verifyToken);

// GET endpoints are available to staff (the reservation modal looks up CIN here).
router.get("/", listClients);
router.get("/:id", getClient);

// Blacklist controls are admin-only.
router.post("/:id/blacklist", requireAdmin, blacklist);
router.post("/:id/unblacklist", requireAdmin, unblacklist);

export default router;
