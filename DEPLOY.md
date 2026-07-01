# Deployment Guide — 5gspace-manager on Railway

## Architecture (Production)

```
Railway service (Node.js)
  └── Express on PORT (Railway injects automatically)
        ├── /api/*   → all backend API routes
        └── /*       → serves client/dist/ (compiled React SPA)

MongoDB Atlas (already live — no changes needed)
```

Dev workflow stays unchanged: separate Vite (`:5173`) + Express (`:5000`) processes.

---

## Step 1 — Prepare the code (one-time changes)

### A. Root `package.json` (create at project root)
```json
{
  "name": "5gspace-manager",
  "version": "1.0.0",
  "engines": { "node": ">=18" },
  "scripts": {
    "postinstall": "npm --prefix server install && npm --prefix client install",
    "build": "npm --prefix client run build",
    "start": "node server/server.js"
  }
}
```

### B. `railway.toml` (create at project root)
```toml
[build]
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/api/health"
```

### C. `.gitignore` (create at project root)
```
node_modules/
server/node_modules/
client/node_modules/
client/dist/
server/.env
client/.env
*.local
```

### D. `server/server.js` — add static file serving
After all `app.use("/api/...")` lines and before `app.use(notFound)`:

```javascript
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const clientDist = join(__dirname, "../client/dist");
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api)/, (req, res) => res.sendFile(join(clientDist, "index.html")));
}
```

### E. `client/src/api/axiosInstance.js` — fix production base URL
```diff
-  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
+  baseURL: import.meta.env.VITE_API_URL ?? "/api",
```

### F. `client/.env` (create — dev only, git-ignored)
```
VITE_API_URL=http://localhost:5000/api
```

---

## Step 2 — Push to GitHub

1. Create a GitHub account / repository (e.g. `5gspace-manager`) — set it to **Private**
2. In the project root:
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/5gspace-manager.git
git push -u origin main
```

---

## Step 3 — Deploy on Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select your `5gspace-manager` repository
3. Railway detects Node.js automatically
4. Go to **Variables** tab and set:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | your full Atlas URI |
| `JWT_SECRET` | your long secret string |
| `JWT_EXPIRES_IN` | `8h` |

> **Do NOT set `DNS_SERVERS`** — Railway's DNS works normally (that fix is only for your local Windows machine).
> **Do NOT set `CLIENT_ORIGIN`** — not needed in production (same origin).

5. Railway triggers a build and deploy → you get a URL like `https://5gspace-manager.up.railway.app`

---

## Step 4 — Test production

1. Visit the Railway URL → login page appears
2. Log in with `admin@5gspace.tn` / `Admin123!`
3. Verify dashboard loads and API calls work
4. Check `/api/health` returns `{ "ok": true }`

---

## Cost estimate

| Plan | Cost | Notes |
|------|------|-------|
| Railway Hobby | ~$5/month | Always-on, HTTPS, custom domain |
| Railway Trial | Free | Expires after 30 days |

---

## Custom domain (optional)
In Railway → Settings → Domains → add `app.5gspace.tn` (requires DNS access to 5gspace.tn).
