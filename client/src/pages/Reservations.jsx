import { useMemo, useState } from "react";
import { useRooms } from "../hooks/useRooms.js";
import { useReservations } from "../hooks/useReservations.js";
import { useToast } from "../context/ToastContext.jsx";
import ReservationRow from "../components/ReservationRow.jsx";
import ReservationModal from "../components/ReservationModal.jsx";
import PromptModal from "../components/PromptModal.jsx";
import {
  checkinReservation, checkoutReservation, cancelReservation, updatePayment,
} from "../api/reservations.api.js";
import { apiError } from "../api/axiosInstance.js";
import { exportReservationsXlsx } from "../utils/exportXlsx.js";

const SORT_FN = {
  date:    (r) => r.date ?? "",
  total:   (r) => r.montant_total ?? 0,
  status:  (r) => r.status ?? "",
  payment: (r) => r.payment_status ?? "",
};

function SortTh({ label, col, sort, onSort }) {
  const active = sort.col === col;
  return (
    <th className={`th-sort ${active ? sort.dir : ""}`} onClick={() => onSort(col)}>
      {label}<span className="sort-ico" />
    </th>
  );
}

export default function Reservations() {
  const { rooms } = useRooms();
  const { addToast } = useToast();
  const [filters, setFilters] = useState({ date: "", room: "", status: "", payment_status: "" });
  const apiFilters = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), [filters]);
  const { reservations, loading, reload, page, setPage, total, pages } = useReservations(apiFilters);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [busyId, setBusyId]       = useState(null);
  const [cancelCtx, setCancelCtx] = useState(null);
  const [payCtx, setPayCtx]       = useState(null);
  const [sort, setSort]           = useState({ col: "date", dir: "desc" });

  const sorted = useMemo(() => {
    const fn = SORT_FN[sort.col] || SORT_FN.date;
    return [...reservations].sort((a, b) => {
      const va = fn(a), vb = fn(b);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [reservations, sort]);

  function toggleSort(col) {
    setSort((s) => s.col === col ? { col, dir: s.dir === "asc" ? "desc" : "asc" } : { col, dir: "desc" });
  }

  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  async function run(r, fn, successMsg) {
    setBusyId(r._id);
    try { await fn(); reload(); addToast("success", successMsg); }
    catch (err) { addToast("error", apiError(err)); }
    finally { setBusyId(null); }
  }

  const onCheckin  = (r) => run(r, () => checkinReservation(r._id), "Check-in enregistré.");
  const onCheckout = (r) => run(r, () => checkoutReservation(r._id), "Check-out enregistré.");
  const onCancel   = (r) => setCancelCtx({ r });
  const onPayment  = (r) => setPayCtx({ r });
  const onEdit     = (r) => { setEditing(r); setModalOpen(true); };
  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const onSaved    = (result) => {
    setModalOpen(false); setEditing(null); reload();
    if (result?.recurring) {
      const sk = result.skipped?.length ? ` — ${result.skipped.length} ignorée(s) pour conflit` : "";
      addToast("success", `${result.created_count} réservations créées${sk}.`);
    } else {
      addToast("success", editing ? "Réservation modifiée." : "Réservation créée.");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Réservations</div>
          <div className="page-sub">{total} réservation(s)</div>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-light d-flex align-items-center gap-2" onClick={() => exportReservationsXlsx(sorted)} disabled={!sorted.length} title="Exporter la liste filtrée vers Excel"><i className="bi bi-file-earmark-excel" /> Excel</button>
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreate}><i className="bi bi-plus-lg" /> Nouvelle réservation</button>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-6 col-md-3"><label className="form-label">Date</label><input className="form-control" type="date" value={filters.date} onChange={setFilter("date")} /></div>
            <div className="col-6 col-md-3">
              <label className="form-label">Salle</label>
              <select className="form-select" value={filters.room} onChange={setFilter("room")}>
                <option value="">Toutes</option>
                {rooms.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Statut</label>
              <select className="form-select" value={filters.status} onChange={setFilter("status")}>
                <option value="">Tous</option>
                <option value="confirmed">Confirmée</option>
                <option value="checked_in">Check-in</option>
                <option value="checked_out">Terminée</option>
                <option value="cancelled">Annulée</option>
                <option value="no_show">No-show</option>
              </select>
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">Paiement</label>
              <select className="form-select" value={filters.payment_status} onChange={setFilter("payment_status")}>
                <option value="">Tous</option>
                <option value="paid">Payé</option>
                <option value="partial">Partiel</option>
                <option value="pending">En attente</option>
              </select>
            </div>
            <div className="col-md-2 d-grid">
              <button className="btn btn-light" onClick={() => setFilters({ date: "", room: "", status: "", payment_status: "" })}><i className="bi bi-arrow-counterclockwise me-1" />Réinitialiser</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover res-table mb-0 cards-md">
              <thead>
                <tr>
                  <th className="ps-3">Réf</th>
                  <th>Client</th>
                  <th>Salle</th>
                  <SortTh label="Créneau" col="date"    sort={sort} onSort={toggleSort} />
                  <SortTh label="Montant" col="total"   sort={sort} onSort={toggleSort} />
                  <SortTh label="État"    col="status"  sort={sort} onSort={toggleSort} />
                  <th className="pe-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="center-msg"><span className="spinner-border spinner-border-sm me-2" />Chargement…</td></tr>
                ) : sorted.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state"><div className="ico"><i className="bi bi-inbox" /></div>Aucune réservation.</td></tr>
                ) : (
                  sorted.map((r) => (
                    <ReservationRow key={r._id} r={r} busy={busyId === r._id}
                      onCheckin={onCheckin} onCheckout={onCheckout} onCancel={onCancel} onEdit={onEdit} onPayment={onPayment} />
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="pager">
              <span className="pager-info">Page {page} / {pages} · {total} résultats</span>
              <div className="d-flex gap-2">
                <button className="btn btn-light btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><i className="bi bi-chevron-left" /></button>
                <button className="btn btn-light btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}><i className="bi bi-chevron-right" /></button>
              </div>
            </div>
          )}
        </div>
      </div>

      <PromptModal
        open={Boolean(cancelCtx)}
        title="Annuler la réservation"
        label="Motif d'annulation *"
        placeholder="Ex : client absent, annulation demandée…"
        onConfirm={(reason) => run(cancelCtx.r, () => cancelReservation(cancelCtx.r._id, reason), "Réservation annulée.")}
        onClose={() => setCancelCtx(null)}
      />

      <PromptModal
        open={Boolean(payCtx)}
        title="Mettre à jour le paiement"
        label={`Acompte payé (TND) — total : ${payCtx?.r?.montant_total ?? ""} TND`}
        type="number"
        initialValue={String(payCtx?.r?.acompte_paye ?? 0)}
        onConfirm={(val) => run(payCtx.r, () => updatePayment(payCtx.r._id, { acompte_paye: Number(val) || 0 }), "Paiement mis à jour.")}
        onClose={() => setPayCtx(null)}
      />

      {modalOpen && (
        <ReservationModal open rooms={rooms} reservation={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }} onSaved={onSaved} />
      )}
    </div>
  );
}
