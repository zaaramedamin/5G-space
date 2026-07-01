// Shared display helpers (currency, dates, status badges).

export const formatTND = (n) =>
  `${(Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} TND`;

export const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

export const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("fr-FR", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "";

// Mask a CIN to its last 4 digits (frontend fallback; backend also masks).
export const maskCin = (cin) => {
  if (!cin) return "";
  const s = String(cin);
  return s.length <= 4 ? s : "•".repeat(s.length - 4) + s.slice(-4);
};

// Bootstrap badge classes (use with: `badge rounded-pill dotted ${cls}`).
const RES_STATUS = {
  confirmed: { label: "Confirmée", cls: "text-bg-primary" },
  checked_in: { label: "Check-in", cls: "text-bg-success" },
  checked_out: { label: "Terminée", cls: "text-bg-secondary" },
  cancelled: { label: "Annulée", cls: "text-bg-danger" },
  no_show: { label: "No-show", cls: "text-bg-dark" },
};
export const reservationStatusBadge = (s) => RES_STATUS[s] || { label: s, cls: "text-bg-secondary" };

const PAY_STATUS = {
  paid: { label: "Payé", cls: "text-bg-success" },
  partial: { label: "Partiel", cls: "text-bg-warning" },
  pending: { label: "En attente", cls: "text-bg-danger" },
};
export const paymentBadge = (s) => PAY_STATUS[s] || { label: s, cls: "text-bg-secondary" };

const ROOM_STATUS = {
  libre: { label: "Libre", cls: "text-bg-success", color: "#16a34a" },
  occupee: { label: "Occupée", cls: "text-bg-danger", color: "#dc2626" },
  reservee: { label: "Réservée", cls: "text-bg-warning", color: "#d97706" },
};
export const roomStatusBadge = (s) => ROOM_STATUS[s] || { label: s, cls: "text-bg-secondary", color: "#94a3b8" };

// "RES-2026-001" today's ISO date (yyyy-mm-dd) for date inputs / filters.
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Minutes (number) -> "1h30" / "45min".
export const humanMinutes = (mins) => {
  if (mins == null) return "—";
  const m = Math.round(mins);
  const sign = m < 0 ? "-" : "";
  const a = Math.abs(m);
  const h = Math.floor(a / 60);
  const r = a % 60;
  return `${sign}${h ? h + "h" : ""}${h && r ? String(r).padStart(2, "0") : r ? r + "min" : h ? "00" : "0min"}`;
};
