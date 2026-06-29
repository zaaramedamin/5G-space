import { useEffect, useState } from "react";
import { getClients, getClient, blacklistClient, unblacklistClient } from "../api/clients.api.js";
import { apiError } from "../api/axiosInstance.js";
import Modal from "../components/Modal.jsx";
import { formatDate, formatTND, reservationStatusBadge } from "../utils/format.js";

export default function Clients() {
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    getClients(search ? { search } : {}).then(setClients).catch(() => setClients([])).finally(() => setLoading(false));
  }
  useEffect(() => { const id = setTimeout(load, 250); return () => clearTimeout(id); }, [search]);

  async function openDetail(id) {
    setError("");
    try { setDetail(await getClient(id)); } catch (err) { setError(apiError(err)); }
  }

  async function toggleBlacklist(client) {
    setError("");
    try {
      if (client.is_blacklisted) await unblacklistClient(client._id);
      else {
        const reason = window.prompt(`Motif de la mise sur liste noire de ${client.name} :`);
        if (!reason || !reason.trim()) return;
        await blacklistClient(client._id, reason.trim());
      }
      await openDetail(client._id);
      load();
    } catch (err) { setError(apiError(err)); }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Clients</div>
          <div className="page-sub">{clients.length} client(s)</div>
        </div>
        <div className="input-group" style={{ maxWidth: 320 }}>
          <span className="input-group-text"><i className="bi bi-search" /></span>
          <input className="form-control" placeholder="Rechercher (nom, téléphone, CIN)…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead><tr><th className="ps-3">Nom</th><th>Téléphone</th><th>CIN</th><th>Réservations</th><th>Statut</th><th className="pe-3"></th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="center-msg"><span className="spinner-border spinner-border-sm me-2" />Chargement…</td></tr>
                ) : clients.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state"><div className="ico"><i className="bi bi-person-x" /></div>Aucun client.</td></tr>
                ) : (
                  clients.map((c) => (
                    <tr key={c._id} style={{ cursor: "pointer" }} onClick={() => openDetail(c._id)}>
                      <td className="ps-3 fw-semibold">{c.name}</td>
                      <td>{c.phone}</td>
                      <td className="font-monospace">{c.cin}</td>
                      <td>{c.reservations_count}</td>
                      <td>{c.is_blacklisted
                        ? <span className="badge rounded-pill dotted text-bg-danger">Liste noire</span>
                        : <span className="badge rounded-pill dotted text-bg-success">OK</span>}</td>
                      <td className="pe-3 text-muted"><i className="bi bi-chevron-right" /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.name}
        footer={detail && (
          <>
            <button className={`btn ${detail.is_blacklisted ? "btn-success" : "btn-danger"}`} onClick={() => toggleBlacklist(detail)}>
              <i className={`bi ${detail.is_blacklisted ? "bi-check-circle" : "bi-slash-circle"} me-1`} />
              {detail.is_blacklisted ? "Retirer de la liste noire" : "Mettre sur liste noire"}
            </button>
            <button className="btn btn-light" onClick={() => setDetail(null)}>Fermer</button>
          </>
        )}>
        {detail && (
          <>
            <div className="d-flex flex-wrap gap-4 mb-3">
              <div><div className="muted small">Téléphone</div><strong>{detail.phone}</strong></div>
              <div><div className="muted small">CIN</div><strong className="font-monospace">{detail.cin}</strong></div>
              {detail.email && <div><div className="muted small">Email</div><strong>{detail.email}</strong></div>}
            </div>
            {detail.is_blacklisted && <div className="alert alert-danger py-2"><i className="bi bi-exclamation-octagon me-1" />Sur liste noire — {detail.blacklist_reason || "raison non précisée"}</div>}

            <div className="section-label mb-2">Historique ({detail.history?.length || 0})</div>
            <div className="table-responsive border rounded-3">
              <table className="table table-sm table-hover align-middle mb-0">
                <thead><tr><th className="ps-3">Réf</th><th>Salle</th><th>Date</th><th>Montant</th><th>Statut</th></tr></thead>
                <tbody>
                  {(detail.history || []).map((r) => (
                    <tr key={r._id}>
                      <td className="ps-3">{r.ref}</td><td>{r.room?.name}</td><td>{formatDate(r.date)}</td><td>{formatTND(r.montant_total)}</td>
                      <td><span className={`badge rounded-pill dotted ${reservationStatusBadge(r.status).cls}`}>{reservationStatusBadge(r.status).label}</span></td>
                    </tr>
                  ))}
                  {(detail.history || []).length === 0 && <tr><td colSpan="5" className="text-muted text-center py-3">Aucune réservation.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
