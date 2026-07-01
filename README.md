# 5G Space Manager

**Application de gestion des réservations pour l'espace de coworking 5G Space Bizerte.**

Outil interne pour le personnel : réservation de salles, check-in/check-out, gestion des clients (liste noire), traçabilité complète des actions, tableau de bord temps réel et rapports d'activité. Conçu pour **prévenir les arnaques de réservation** et donner au personnel une visibilité totale, chaque action étant traçable jusqu'à un membre du staff.

---

## ✨ Fonctionnalités

### Cœur métier
- **Authentification JWT** avec rôles (admin / staff)
- **Salles** — création, tarif horaire, capacité, couleur, **équipements** (projecteur, Wi-Fi, visio…), activation/désactivation, suppression
- **Réservations** — création avec **détection de conflits** (aucun double-booking d'une salle sur un créneau qui se recoupe), check-in / check-out, annulation avec motif, mise à jour des paiements
- **Réservations récurrentes** — hebdomadaires jusqu'à une date (les créneaux en conflit sont ignorés automatiquement)
- **Clients** — recherche, historique, **liste noire** (blocage automatique à la réservation)
- **Journal d'audit** — chaque action horodatée et attribuée à un membre du staff
- **Tableau de bord** — état des salles en temps réel (polling 30 s), statistiques du jour, prochaines réservations

### Ajouts avancés
- 📊 **Rapports & analytics** (admin) — revenus par jour, taux d'occupation par salle, heures de pointe, top salles, comparaison vs période précédente (graphiques Recharts)
- 🧾 **Export** — reçu **PDF** par réservation (jsPDF) + export **Excel** de la liste (xlsx)
- ⏰ **No-show automatique** — un job (node-cron) toutes les 30 min marque « no-show » les réservations confirmées non honorées
- 📅 **Ajout à l'agenda** — téléchargement `.ics` (Google Calendar / Apple / Outlook)
- 📱 **PWA installable** — ajout à l'écran d'accueil, lancement plein écran, icône dédiée
- 🔒 **Sécurité** — en-têtes `helmet`, limitation des tentatives de connexion (anti-brute-force)
- 🎨 **UI moderne** — Bootstrap 5 + Framer Motion, entièrement **responsive** (tableaux → cartes sur mobile)

---

## 🧱 Stack technique

| Côté | Technologies |
|------|--------------|
| **Backend** | Node.js (ESM), Express 4, MongoDB Atlas + Mongoose 8, JWT, bcryptjs, express-validator, helmet, express-rate-limit, node-cron |
| **Frontend** | React 18, Vite 5, React Router 6, Bootstrap 5.3, Bootstrap Icons, Framer Motion, Recharts, jsPDF, xlsx, Axios |
| **PWA** | vite-plugin-pwa (service worker + manifest) |

---

## 🏗️ Architecture

```
Développement (2 processus séparés)          Production (service unique)
────────────────────────────────            ────────────────────────────
Vite  :5173  ──proxy /api──▶  Express :5000   Express sur $PORT
React (HMR)                   API + MongoDB     ├── /api/*  → API
                                                └── /*      → client/dist (React SPA)
                                                MongoDB Atlas (cloud)
```

En production, Express sert **à la fois** l'API et l'application React compilée depuis la même origine → aucun problème de CORS.

---

## 📁 Structure du projet

```
5G Space/
├── package.json            # scripts racine (build / start / postinstall) pour le déploiement
├── railway.toml            # config de déploiement Railway
├── DEPLOY.md               # guide de déploiement détaillé
├── IMPROVEMENTS.md         # feuille de route / historique des améliorations
│
├── server/
│   ├── server.js           # point d'entrée Express (+ static serving en prod)
│   ├── seed.js             # données de base (salles, users, clients, réservations)
│   ├── seed-month.mjs      # réservations d'exemple pour le mois courant (démo)
│   ├── config/db.js        # connexion MongoDB
│   ├── controllers/        # auth, rooms, reservations, clients, users, audit, dashboard, reports
│   ├── middleware/         # auth (JWT + requireAdmin), rate limiting, erreurs
│   ├── models/             # User, Room, Client, Reservation, AuditLog
│   ├── routes/             # routes /api/*
│   ├── services/           # conflit, pricing, audit
│   ├── jobs/noShowJob.js   # cron no-show
│   └── utils/              # helpers, temps
│
└── client/
    ├── index.html
    ├── vite.config.js      # proxy dev + PWA + code-splitting
    ├── public/             # logo + icônes PWA
    └── src/
        ├── api/            # clients axios par ressource
        ├── components/     # Sidebar, TopBar, modales, cartes, calendrier…
        ├── context/        # ToastContext
        ├── hooks/          # useAuth, useRooms, useReservations, usePolling, useIsMobile
        ├── pages/          # Login, Dashboard, Calendar, Reservations, Clients, AuditLog, Settings, Reports
        └── utils/          # format, temps, reçu PDF, export Excel, agenda iCal
```

---

## 🚀 Démarrage local

### Prérequis
- Node.js **18+**
- Un cluster **MongoDB Atlas** (ou MongoDB local)

### 1. Installer les dépendances
```bash
# à la racine — installe server ET client via postinstall
npm install
```

### 2. Configurer les variables d'environnement

**`server/.env`**
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/5gspace
JWT_SECRET=<une_chaîne_longue_et_aléatoire>
JWT_EXPIRES_IN=8h
# Optionnel — uniquement si Node refuse la résolution SRV d'Atlas sur ta machine
# DNS_SERVERS=8.8.8.8,1.1.1.1
```

**`client/.env`**
```env
VITE_API_URL=/api
```
> En dev, le proxy Vite redirige `/api` vers `http://localhost:5000`. En production, `/api` est servi par la même origine.

### 3. Peupler la base (optionnel)
```bash
cd server
npm run seed          # données de base + comptes de démo
node seed-month.mjs   # réservations d'exemple pour le mois courant
```

### 4. Lancer en développement (2 terminaux)
```bash
# Terminal 1 — API
cd server && npm run dev      # http://localhost:5000

# Terminal 2 — Front
cd client && npm run dev      # http://localhost:5173
```

Ouvre **http://localhost:5173**.

### Comptes de démo (après `npm run seed`)
| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | `admin@5gspace.tn` | `Admin123!` |
| Staff | `staff@5gspace.tn` | `Staff123!` |

> ⚠️ **Change ces mots de passe** avant toute mise en ligne réelle.

---

## 📜 Scripts

**Racine**
| Script | Action |
|--------|--------|
| `npm install` | Installe les dépendances server + client (postinstall) |
| `npm run build` | Compile le client (`client/dist`) |
| `npm start` | Démarre Express en production (sert l'API + le client) |

**server/**
| Script | Action |
|--------|--------|
| `npm run dev` | API en mode watch (rechargement auto) |
| `npm start` | API en production |
| `npm run seed` | (Re)peuple la base avec les données de base |

**client/**
| Script | Action |
|--------|--------|
| `npm run dev` | Serveur de dev Vite (HMR) |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualise le build (utile pour tester la PWA) |

---

## 🌐 API (aperçu)

Toutes les routes sont préfixées par `/api`. Auth par `Authorization: Bearer <token>`.

| Ressource | Endpoints |
|-----------|-----------|
| `auth` | `POST /login`, `GET /me` |
| `rooms` | `GET /`, `POST /`, `PUT /:id`, `DELETE /:id` *(soft, ou `?hard=1`)* |
| `reservations` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `POST /:id/checkin`, `POST /:id/checkout`, `POST /:id/cancel`, `PATCH /:id/payment`, `GET /:id/ical` |
| `clients` | recherche, détail, (dé)blacklist |
| `users` | `GET /`, `POST /`, `PUT /:id`, `PATCH /:id/deactivate`, `DELETE /:id` *(admin)* |
| `audit` | `GET /` *(admin, filtres + pagination)* |
| `dashboard` | `GET /stats`, `GET /rooms-status` |
| `reports` | `GET /?period=month|week` *(admin)* |

---

## ☁️ Déploiement

Le projet se déploie en **service unique** (Express sert l'API + le React compilé). Guide complet dans **[DEPLOY.md](DEPLOY.md)**.

**Résumé (Railway)** :
1. Pousser le code sur GitHub
2. Dans MongoDB Atlas → **Network Access** → autoriser `0.0.0.0/0`
3. Railway → *Deploy from GitHub repo* (lit `railway.toml` automatiquement)
4. Variables : `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN` — **ne pas** définir `DNS_SERVERS` ni `PORT`

---

## 🔐 Sécurité

- Mots de passe hachés (bcrypt), auth JWT, routes admin protégées (`requireAdmin`)
- `helmet` + limitation des tentatives de connexion (10 échecs / 15 min / IP)
- Validation des entrées (express-validator)
- **À faire avant la prod** : changer les mots de passe de démo, utiliser un `JWT_SECRET` fort.

---

## 📝 Licence

Projet interne — 5G Space Bizerte · Coworking & Business.
