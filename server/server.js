import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

import { connectDB } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import { startNoShowJob } from "./jobs/noShowJob.js";

import authRoutes from "./routes/auth.routes.js";
import roomsRoutes from "./routes/rooms.routes.js";
import reservationsRoutes from "./routes/reservations.routes.js";
import clientsRoutes from "./routes/clients.routes.js";
import usersRoutes from "./routes/users.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import reportsRoutes from "./routes/reports.routes.js";

const app = express();

// Behind exactly one reverse proxy (dev tunnel now, Railway later) so
// express-rate-limit / req.ip read the real client IP from X-Forwarded-For.
app.set("trust proxy", 1);

// Allow the configured client origin plus any localhost port in dev
// (Vite may fall back to 5174, 5175… if 5173 is busy).
const allowedOrigin = (origin, cb) => {
  const ok =
    !origin ||
    origin === process.env.CLIENT_ORIGIN ||
    /^https?:\/\/(localhost|127\.0\.0\.1|\d{1,3}(\.\d{1,3}){3}):\d+$/.test(origin);
  cb(ok ? null : new Error("Not allowed by CORS"), ok);
};
// Security headers. CSP is disabled for now so Bootstrap / inline styles keep
// working; cross-origin resource policy is relaxed so the API can be reached
// from the Vite dev origin / tunnel.
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());
app.use("/api", apiLimiter);

app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomsRoutes);
app.use("/api/reservations", reservationsRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportsRoutes);

// ── Serve the compiled React SPA in production (single-origin) ──
// When client/dist exists, static assets are served and any non-/api route
// falls back to index.html so client-side routing works on refresh.
const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDist = join(__dirname, "../client/dist");
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(join(clientDist, "index.html")));
}

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    startNoShowJob();
    app.listen(PORT, "0.0.0.0", () => console.log(`5gspace-manager API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });
