import { useEffect, useMemo, useState } from "react";
import { getAudit } from "../api/audit.api.js";
import { getUsers } from "../api/users.api.js";
import { formatDateTime } from "../utils/format.js";

const ACTIONS = [
  "CREATE_RESERVATION", "UPDATE_RESERVATION", "CHECK_IN", "CHECK_OUT", "CANCEL", "PAYMENT_UPDATE",
  "CREATE_ROOM", "UPDATE_ROOM", "DELETE_ROOM",
  "BLACKLIST_CLIENT", "UNBLACKLIST_CLIENT",
  "CREATE_USER", "UPDATE_USER", "DEACTIVATE_USER",
];

export default function AuditLog() {
  const [filters, setFilters] = useState({ user: "", action: "", from: "", to: "" });
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const apiFilters = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), [filters]);

  useEffect(() => { getUsers().then(setUsers).catch(() => setUsers([])); }, []);
  useEffect(() => {
    setLoading(true);
    getAudit(apiFilters).then(setLogs).catch(() => setLogs([])).finally(() => setLoading(false));
  }, [apiFilters]);

  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Journal d'audit</div>
          <div className="page-sub">Traçabilité de toutes les actions du personnel</div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-6 col-md-3">
              <label className="form-label">Staff</label>
              <select className="form-select" value={filters.user} onChange={setFilter("user")}>
                <option value="">Tous</option>
                {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label">Action</label>
              <select className="form-select" value={filters.action} onChange={setFilter("action")}>
                <option value="">Toutes</option>
                {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-2"><label className="form-label">Du</label><input className="form-control" type="date" value={filters.from} onChange={setFilter("from")} /></div>
            <div className="col-6 col-md-2"><label className="form-label">Au</label><input className="form-control" type="date" value={filters.to} onChange={setFilter("to")} /></div>
            <div className="col-md-2 d-grid">
              <button className="btn btn-light" onClick={() => setFilters({ user: "", action: "", from: "", to: "" })}><i className="bi bi-arrow-counterclockwise me-1" />Réinitialiser</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th className="ps-3">Horodatage</th><th>Staff</th><th>Action</th><th>Entité</th><th className="pe-3">Détails</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="center-msg"><span className="spinner-border spinner-border-sm me-2" />Chargement…</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state"><div className="ico"><i className="bi bi-journal-text" /></div>Aucune entrée.</td></tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l._id}>
                      <td className="ps-3">{formatDateTime(l.createdAt)}</td>
                      <td>{l.user?.name || l.user_name || "—"}</td>
                      <td><span className="badge rounded-pill text-bg-light border">{l.action}</span></td>
                      <td>{l.entity_type}{l.entity_id ? ` · ${String(l.entity_id).slice(-6)}` : ""}</td>
                      <td className="pe-3" style={{ maxWidth: 360, whiteSpace: "normal" }}>
                        <code className="small text-muted">{l.details ? JSON.stringify(l.details).slice(0, 160) : "—"}</code>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
