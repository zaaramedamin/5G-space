import { useEffect, useState } from "react";
import { getClients, getClient, blacklistClient, unblacklistClient } from "../api/clients.api.js";
import { apiError } from "../api/axiosInstance.js";
import { useToast } from "../context/ToastContext.jsx";
import Modal from "../components/Modal.jsx";
import PromptModal from "../components/PromptModal.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { formatDate, formatTND, reservationStatusBadge } from "../utils/format.js";

export default function Clients() {
  const { addToast } = useToast();
  const [search, setSearch]   = useState("");
  const [clients, setClients] = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail]   = useState(null);
  const [blacklistCtx, setBlacklistCtx]     = useState(null);
  const [unblacklistCtx, setUnblacklistCtx] = useState(null);

  function load(p = page) {
    setLoading(true);
    getClients(search ? { search, page: p, limit: 25 } : { page: p, limit: 25 })
      .then((res) => { setClients(res.data || []); setTotal(res.total || 0); setPages(res.pages || 1); })
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const id = setTimeout(() => { setPage(1); load(1); }, 250);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => { load(); }, [page]);

  async function openDetail(id) {
    try { setDetail(await getClient(id)); }
    catch (err) { addToast("error", apiError(err)); }
  }

  async function doBlacklist(reason) {
    try {
      await blacklistClient(blacklistCtx._id, reason);
      addToast("success", `${blacklistCtx.name} ajouté à la liste noire.`);
      if (detail?._id === blacklistCtx._id) await openDetail(blacklistCtx._id);
      load();
    } catch (err) { addToast("error", apiError(err)); }
    setBlacklistCtx(null);
  }

  async function doUnblacklist() {
    try {
      await unblacklistClient(unblacklistCtx._id);
      addToast("success", `${unblacklistCtx.name} retiré de la liste noire.`);
      if (detail?._id === unblacklistCtx._id) await openDetail(unblacklistCtx._id);
      load();
    } catch (err) { addToast("error", apiError(err)); }
    setUnblacklistCtx(null);
  }

  function handleToggleBlacklist(client) {
    if (client.is_blacklisted) setUnblacklistCtx(client);
    else setBlacklistCtx(client);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Clients</div>
          <div className="page-sub">{total} client(s)</div>
        </div>
        <div className="input-group" style={{ maxWidth: 320 }}>
          <span className="input-group-text"><i className="bi bi-search" /></span>
          <input className="form-control" placeholder="Rechercher (nom, téléphone, CIN)…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 cards-md">
              <thead><tr><th className="ps-3">Nom</th><th>Téléphone</th><th>CIN</th><th>Réservations</th><th>Statut</th><th className="pe-3"></th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="center-msg"><span className="spinner-border spinner-border-sm me-2" />Chargement…</td></tr>
                ) : clients.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state"><div className="ico"><i className="bi bi-person-x" /></div>Aucun client.</td></tr>
                ) : (
                  clients.map((c) => (
                    <tr key={c._id} style={{ cursor: "pointer" }} onClick={() => openDetail(c._id)}>
                      <td className="ps-3 fw-semibold" data-card-title>{c.name}</td>
                      <td data-label="Téléphone">{c.phone}</td>
                      <td className="font-monospace" data-label="CIN">{c.cin}</td>
                      <td data-label="Réservations">{c.reservations_count}</td>
                      <td data-label="Statut">{c.is_blacklisted
                        ? <span className="badge rounded-pill dotted text-bg-danger">Liste noire</span>
                        : <span className="badge rounded-pill dotted text-bg-success">OK</span>}</td>
                      <td className="pe-3 text-muted cards-hide"><i className="bi bi-chevron-right" /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="pager">
              <span className="pager-info">Page {page} / {pages} · {total} clients</span>
              <div className="d-flex gap-2">
                <button className="btn btn-light btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><i className="bi bi-chevron-left" /></button>
                <button className="btn btn-light btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}><i className="bi bi-chevron-right" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.name}
        footer={detail && (
          <>
            <button className={`btn ${detail.is_blacklisted ? "btn-success" : "btn-danger"}`} onClick={() => handleToggleBlacklist(detail)}>
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
              <table className="table table-sm table-hover align-middle mb-0 cards-md">
                <thead><tr><th className="ps-3">Réf</th><th>Salle</th><th>Date</th><th>Montant</th><th>Statut</th></tr></thead>
                <tbody>
                  {(detail.history || []).map((r) => (
                    <tr key={r._id}>
                      <td className="ps-3" data-card-title>{r.ref}</td><td data-label="Salle">{r.room?.name}</td><td data-label="Date">{formatDate(r.date)}</td><td data-label="Montant">{formatTND(r.montant_total)}</td>
                      <td data-label="Statut"><span className={`badge rounded-pill dotted ${reservationStatusBadge(r.status).cls}`}>{reservationStatusBadge(r.status).label}</span></td>
                    </tr>
                  ))}
                  {(detail.history || []).length === 0 && <tr><td colSpan="5" className="text-muted text-center py-3">Aucune réservation.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modal>

      <PromptModal
        open={Boolean(blacklistCtx)}
        title="Ajouter à la liste noire"
        label={`Motif pour ${blacklistCtx?.name} *`}
        placeholder="Ex : paiement non honoré, no-show répété…"
        onConfirm={doBlacklist}
        onClose={() => setBlacklistCtx(null)}
      />

      <ConfirmModal
        open={Boolean(unblacklistCtx)}
        title="Retirer de la liste noire"
        message={`Confirmer le retrait de ${unblacklistCtx?.name} de la liste noire ?`}
        confirmLabel="Retirer"
        variant="success"
        onConfirm={doUnblacklist}
        onClose={() => setUnblacklistCtx(null)}
      />
    </div>
  );
}
