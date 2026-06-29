import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePolling } from "../hooks/usePolling.js";
import { getRoomsStatus, getStats } from "../api/dashboard.api.js";
import { getReservations } from "../api/reservations.api.js";
import RoomCard from "../components/RoomCard.jsx";
import { formatTND, todayISO, paymentBadge } from "../utils/format.js";
import { toMinutes } from "../utils/timeClient.js";
import { staggerContainer, fadeUpItem } from "../utils/motion.js";

const TILES = [
  { key: "total_reservations", label: "Réservations aujourd'hui", icon: "bi-card-list", bg: "#dbeafe", fg: "#2563eb", money: false },
  { key: "rooms_occupied", label: "Salles occupées", icon: "bi-door-open-fill", bg: "#fef3c7", fg: "#d97706", money: false },
  { key: "revenue_collected", label: "Revenu encaissé (jour)", icon: "bi-cash-coin", bg: "#dcfce7", fg: "#16a34a", money: true },
  { key: "pending_amount", label: "Montant en attente", icon: "bi-hourglass-split", bg: "#fee2e2", fg: "#dc2626", money: true },
];

export default function Dashboard() {
  const { data: rooms, loading } = usePolling(getRoomsStatus, 30000);
  const { data: stats } = usePolling(getStats, 30000);
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    getReservations({ date: todayISO(), status: "confirmed" })
      .then((list) => {
        const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
        setUpcoming(
          list.filter((r) => { const s = toMinutes(r.start_time); return s >= nowMin && s <= nowMin + 180; })
            .sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time))
        );
      })
      .catch(() => setUpcoming([]));
  }, [stats]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Tableau de bord</div>
          <div className="page-sub">Vue d'ensemble en temps réel de vos espaces</div>
        </div>
      </div>

      <motion.div className="stats" variants={staggerContainer} initial="initial" animate="animate">
        {TILES.map((t) => (
          <motion.div key={t.key} className="stat-tile" variants={fadeUpItem} whileHover={{ y: -4 }}>
            <div className="stat-tile-ico" style={{ background: t.bg, color: t.fg }}><i className={`bi ${t.icon}`} /></div>
            <div>
              <div className="lbl">{t.label}</div>
              <div className="val">{stats ? (t.money ? formatTND(stats[t.key]) : stats[t.key]) : "—"}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="section-label mb-3"><i className="bi bi-broadcast me-1" /> État des salles en temps réel</div>
      {loading && !rooms ? (
        <div className="center-msg"><span className="spinner-border spinner-border-sm me-2" /> Chargement…</div>
      ) : (
        <motion.div className="room-grid" variants={staggerContainer} initial="initial" animate="animate">
          {rooms?.map((room) => (
            <motion.div key={room.room_id} variants={fadeUpItem} whileHover={{ y: -4 }}>
              <RoomCard room={room} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="section-label mb-3 mt-4"><i className="bi bi-clock-history me-1" /> Prochaines réservations (3 h)</div>
      <div className="card">
        <div className="card-body p-0">
          {upcoming.length === 0 ? (
            <div className="empty-state"><div className="ico"><i className="bi bi-calendar-check" /></div>Aucune réservation prévue dans les 3 prochaines heures.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead><tr><th className="ps-3">Réf</th><th>Salle</th><th>Client</th><th>Créneau</th><th className="pe-3">Paiement</th></tr></thead>
                <tbody>
                  {upcoming.map((r) => (
                    <tr key={r._id}>
                      <td className="ps-3 fw-semibold">{r.ref}</td>
                      <td>{r.room?.name}</td>
                      <td>{r.client?.name}</td>
                      <td>{r.start_time} – {r.end_time}</td>
                      <td className="pe-3"><span className={`badge rounded-pill dotted ${paymentBadge(r.payment_status).cls}`}>{paymentBadge(r.payment_status).label}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
