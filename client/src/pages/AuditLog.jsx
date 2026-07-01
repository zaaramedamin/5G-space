import React, { useEffect, useMemo, useState } from "react";
import { getAudit } from "../api/audit.api.js";
import { getUsers } from "../api/users.api.js";
import { formatDateTime } from "../utils/format.js";

/* ─── Action metadata ─── */
const ACTION_META = {
  CREATE_RESERVATION:  { label: "Réservation créée",   cls: "aud-create",   icon: "bi-plus-circle" },
  UPDATE_RESERVATION:  { label: "Réservation modif.",  cls: "aud-update",   icon: "bi-pencil" },
  CHECK_IN:            { label: "Check-in",            cls: "aud-checkin",  icon: "bi-box-arrow-in-right" },
  CHECK_OUT:           { label: "Check-out",           cls: "aud-checkout", icon: "bi-box-arrow-right" },
  CANCEL:              { label: "Annulation",          cls: "aud-cancel",   icon: "bi-x-circle" },
  NO_SHOW:             { label: "No-show (auto)",       cls: "aud-delete",   icon: "bi-person-slash" },
  PAYMENT_UPDATE:      { label: "Paiement",            cls: "aud-payment",  icon: "bi-cash-coin" },
  CREATE_ROOM:         { label: "Salle créée",         cls: "aud-create",   icon: "bi-plus-square" },
  UPDATE_ROOM:         { label: "Salle modif.",        cls: "aud-update",   icon: "bi-pencil-square" },
  DELETE_ROOM:         { label: "Salle supprimée",     cls: "aud-delete",   icon: "bi-trash" },
  BLACKLIST_CLIENT:    { label: "Liste noire +",       cls: "aud-cancel",   icon: "bi-slash-circle" },
  UNBLACKLIST_CLIENT:  { label: "Liste noire −",       cls: "aud-create",   icon: "bi-check-circle" },
  CREATE_USER:         { label: "Compte créé",         cls: "aud-create",   icon: "bi-person-plus" },
  UPDATE_USER:         { label: "Compte modif.",       cls: "aud-update",   icon: "bi-person-gear" },
  DEACTIVATE_USER:     { label: "Compte désactivé",   cls: "aud-delete",   icon: "bi-person-x" },
  DELETE_USER:         { label: "Compte supprimé",     cls: "aud-delete",   icon: "bi-person-x-fill" },
};

const ACTIONS = Object.keys(ACTION_META);

/* ─── Detail formatter ─── */
function detailRows(action, raw) {
  if (!raw) return [];
  const d = typeof raw === "string" ? JSON.parse(raw) : raw;
  const rows = [];

  const add = (k, v) => { if (v != null && v !== "") rows.push([k, String(v)]); };

  // Client info
  if (d.client?.name)  add("Client", d.client.name);
  if (d.client?.phone) add("Tél.", d.client.phone);
  if (d.client?.cin)   add("CIN", d.client.cin);

  // Room
  if (d.room?.name)    add("Salle", d.room.name);

  // Reservation fields
  if (d.ref)           add("Réf", d.ref);
  if (d.date)          add("Date", String(d.date).slice(0, 10));
  if (d.start_time && d.end_time) add("Créneau", `${d.start_time} – ${d.end_time}`);
  if (d.duration_hours) add("Durée", `${d.duration_hours} h`);
  if (d.montant_total != null)    add("Total", `${d.montant_total} TND`);
  if (d.acompte_paye  != null)    add("Acompte", `${d.acompte_paye} TND`);
  if (d.payment_status)           add("Paiement", d.payment_status);
  if (d.cancel_reason)            add("Motif", d.cancel_reason);

  // Room / User fields (not nested under client)
  if (!d.client && d.name)   add("Nom", d.name);
  if (d.email)               add("Email", d.email);
  if (d.capacity)            add("Capacité", `${d.capacity} pers.`);
  if (d.tarif_horaire != null) add("Tarif", `${d.tarif_horaire} TND/h`);
  if (d.role)                add("Rôle", d.role);
  if (d.blacklist_reason)    add("Raison", d.blacklist_reason);

  // Before / after diff (update actions)
  if (d.before && d.after) {
    Object.keys(d.after).forEach((k) => {
      if (d.before[k] !== d.after[k] && typeof d.after[k] !== "object") {
        add(k, `${d.before[k]} → ${d.after[k]}`);
      }
    });
  }

  // Fallback: first 3 scalar key-value pairs
  if (rows.length === 0) {
    Object.entries(d).slice(0, 4).forEach(([k, v]) => {
      if (v != null && typeof v !== "object") add(k, v);
    });
  }

  return rows;
}

function AuditDetails({ action, details }) {
  const rows = useMemo(() => {
    try { return detailRows(action, details); }
    catch { return []; }
  }, [action, details]);

  if (!rows.length) return <span className="text-muted" style={{ fontSize: 12 }}>—</span>;

  return (
    <div className="aud-kv">
      {rows.map(([k, v], i) => (
        <React.Fragment key={i}>
          <span className="aud-k">{k}</span>
          <span className="aud-v">{v}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ─── Page ─── */
export default function AuditLog() {
  const [filters, setFilters] = useState({ user: "", action: "", from: "", to: "" });
  const [logs, setLogs]       = useState([]);
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [total, setTotal]     = useState(0);

  const apiFilters = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), [filters]);

  useEffect(() => { getUsers().then(setUsers).catch(() => setUsers([])); }, []);

  function load(p = page) {
    setLoading(true);
    getAudit({ ...apiFilters, page: p, limit: 50 })
      .then((res) => { setLogs(res.data || []); setTotal(res.total || 0); setPages(res.pages || 1); })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { setPage(1); load(1); }, [JSON.stringify(apiFilters)]);
  useEffect(() => { load(); }, [page]);

  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Journal d'audit</div>
          <div className="page-sub">Traçabilité de toutes les actions du personnel · {total} entrées</div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-6 col-md-3">
              <label className="form-label">Staff</label>
              <select className="form-select" value={filters.user} onChange={setFilter("user")}>
                <option value="">Tous les membres</option>
                {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label">Action</label>
              <select className="form-select" value={filters.action} onChange={setFilter("action")}>
                <option value="">Toutes les actions</option>
                {ACTIONS.map((a) => (
                  <option key={a} value={a}>{ACTION_META[a]?.label || a}</option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Du</label>
              <input className="form-control" type="date" value={filters.from} onChange={setFilter("from")} />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Au</label>
              <input className="form-control" type="date" value={filters.to} onChange={setFilter("to")} />
            </div>
            <div className="col-md-2 d-grid">
              <button className="btn btn-light" onClick={() => { setFilters({ user: "", action: "", from: "", to: "" }); setPage(1); }}>
                <i className="bi bi-arrow-counterclockwise me-1" />Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 res-table cards-md">
              <thead>
                <tr>
                  <th className="ps-3">Horodatage</th>
                  <th>Staff</th>
                  <th>Action</th>
                  <th className="res-col-hide-lg">Entité</th>
                  <th className="pe-3">Détails</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="center-msg"><span className="spinner-border spinner-border-sm me-2" />Chargement…</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state"><div className="ico"><i className="bi bi-journal-text" /></div>Aucune entrée.</td></tr>
                ) : (
                  logs.map((l) => {
                    const meta = ACTION_META[l.action] || { label: l.action, cls: "aud-checkout", icon: "bi-circle" };
                    return (
                      <tr key={l._id}>
                        <td className="ps-3" style={{ whiteSpace: "nowrap" }} data-card-title>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{formatDateTime(l.createdAt)}</div>
                        </td>
                        <td style={{ fontSize: 13 }} data-label="Staff">{l.user?.name || l.user_name || "—"}</td>
                        <td data-label="Action">
                          <span className={`aud-badge ${meta.cls}`}>
                            <i className={`bi ${meta.icon}`} />{meta.label}
                          </span>
                        </td>
                        <td className="res-col-hide-lg" style={{ fontSize: 12, color: "var(--muted)" }} data-label="Entité">
                          {l.entity_type}{l.entity_id ? ` · ${String(l.entity_id).slice(-6)}` : ""}
                        </td>
                        <td className="pe-3 cards-block" style={{ maxWidth: 300 }} data-label="Détails">
                          <AuditDetails action={l.action} details={l.details} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="pager">
              <span className="pager-info">Page {page} / {pages} · {total} entrées</span>
              <div className="d-flex gap-2">
                <button className="btn btn-light btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><i className="bi bi-chevron-left" /></button>
                <button className="btn btn-light btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}><i className="bi bi-chevron-right" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
