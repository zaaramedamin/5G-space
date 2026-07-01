import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from "recharts";
import { getReport } from "../api/reports.api.js";
import { formatTND } from "../utils/format.js";
import { staggerContainer, fadeUpItem } from "../utils/motion.js";

const PERIODS = [
  { k: "month", label: "Ce mois" },
  { k: "week", label: "Cette semaine" },
];
const BRAND = "#4f46e5";
const AMBER = "#f59e0b";

function Delta({ v }) {
  if (!v) return <span className="rp-delta flat">—</span>;
  const up = v > 0;
  return (
    <span className={`rp-delta ${up ? "up" : "down"}`}>
      <i className={`bi ${up ? "bi-arrow-up-right" : "bi-arrow-down-right"}`} />{Math.abs(v)}%
    </span>
  );
}

const shortDay = (iso) => iso.slice(8, 10) + "/" + iso.slice(5, 7);

export default function Reports() {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getReport(period)
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [period]);

  const k = data?.kpis;
  const revByDay = (data?.revenue_by_day || []).map((d) => ({ ...d, label: shortDay(d.date) }));

  const TILES = [
    { lbl: "Revenu encaissé", val: formatTND(k?.revenue_collected ?? 0), delta: k?.revenue_delta_pct, icon: "bi-cash-coin", bg: "#dcfce7", fg: "#16a34a" },
    { lbl: "En attente", val: formatTND(k?.revenue_pending ?? 0), icon: "bi-hourglass-split", bg: "#fee2e2", fg: "#dc2626" },
    { lbl: "Chiffre d'affaires", val: formatTND(k?.revenue_total ?? 0), icon: "bi-graph-up", bg: "#dbeafe", fg: "#2563eb" },
    { lbl: "Réservations", val: k?.reservations ?? 0, delta: k?.reservations_delta_pct, icon: "bi-card-list", bg: "#ede9fe", fg: "#6d28d9" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Rapports</div>
          <div className="page-sub">Revenus, occupation et fréquentation</div>
        </div>
        <div className="seg">
          {PERIODS.map((p) => (
            <button key={p.k} className={period === p.k ? "active" : ""} onClick={() => setPeriod(p.k)}>{p.label}</button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="center-msg"><span className="spinner-border spinner-border-sm me-2" /> Chargement…</div>
      ) : !data ? (
        <div className="empty-state"><div className="ico"><i className="bi bi-bar-chart" /></div>Aucune donnée sur cette période.</div>
      ) : (
        <>
          <motion.div className="stats" variants={staggerContainer} initial="initial" animate="animate">
            {TILES.map((t) => (
              <motion.div key={t.lbl} className="stat-tile" variants={fadeUpItem}>
                <div className="stat-tile-ico" style={{ background: t.bg, color: t.fg }}><i className={`bi ${t.icon}`} /></div>
                <div style={{ flex: 1 }}>
                  <div className="lbl">{t.lbl}</div>
                  <div className="val">{t.val}</div>
                  {t.delta !== undefined && <Delta v={t.delta} />}
                </div>
              </motion.div>
            ))}
          </motion.div>

          <div className="rp-grid">
            <div className="card rp-chart">
              <div className="card-body">
                <div className="section-label mb-3"><i className="bi bi-cash-stack me-1" /> Revenus par jour</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={revByDay} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v, n) => [formatTND(v), n === "collected" ? "Encaissé" : "En attente"]} />
                    <Legend formatter={(n) => (n === "collected" ? "Encaissé" : "En attente")} />
                    <Bar dataKey="collected" stackId="a" fill={BRAND} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="pending" stackId="a" fill={AMBER} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card rp-chart">
              <div className="card-body">
                <div className="section-label mb-3"><i className="bi bi-clock-history me-1" /> Heures de pointe</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.peak_hours} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" vertical={false} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={0} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v) => [v, "Réservations"]} />
                    <Bar dataKey="count" fill={BRAND} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card rp-chart">
              <div className="card-body">
                <div className="section-label mb-3"><i className="bi bi-pie-chart me-1" /> Occupation par salle</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data.occupancy} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef1f6" horizontal={false} />
                    <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v) => [`${v}%`, "Occupation"]} />
                    <Bar dataKey="occupancy_pct" radius={[0, 4, 4, 0]}>
                      {data.occupancy.map((o) => <Cell key={o.room_id} fill={o.color_tag || BRAND} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card rp-chart">
              <div className="card-body">
                <div className="section-label mb-3"><i className="bi bi-trophy me-1" /> Salles les plus réservées</div>
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead><tr><th className="ps-2">Salle</th><th>Réservations</th><th className="pe-2 text-end">Revenu</th></tr></thead>
                    <tbody>
                      {data.occupancy.filter((o) => o.bookings > 0).map((o) => (
                        <tr key={o.room_id}>
                          <td className="ps-2"><span className="dot me-2" style={{ background: o.color_tag }} /><strong>{o.name}</strong></td>
                          <td>{o.bookings}</td>
                          <td className="pe-2 text-end fw-semibold">{formatTND(o.revenue)}</td>
                        </tr>
                      ))}
                      {data.occupancy.every((o) => !o.bookings) && (
                        <tr><td colSpan="3" className="text-muted text-center py-3">Aucune réservation.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
