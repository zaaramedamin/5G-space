import { useMemo, useState } from "react";
import { useRooms } from "../hooks/useRooms.js";
import { useReservations } from "../hooks/useReservations.js";
import ReservationRow from "../components/ReservationRow.jsx";
import ReservationModal from "../components/ReservationModal.jsx";
import {
  checkinReservation, checkoutReservation, cancelReservation, updatePayment,
} from "../api/reservations.api.js";
import { apiError } from "../api/axiosInstance.js";

export default function Reservations() {
  const { rooms } = useRooms();
  const [filters, setFilters] = useState({ date: "", room: "", status: "", payment_status: "" });
  const apiFilters = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), [filters]);
  const { reservations, loading, reload } = useReservations(apiFilters);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const setFilter = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  async function run(r, fn) {
    setBusyId(r._id); setError("");
    try { await fn(); reload(); }
    catch (err) { setError(apiError(err)); }
    finally { setBusyId(null); }
  }

  const onCheckin = (r) => run(r, () => checkinReservation(r._id));
  const onCheckout = (r) => run(r, () => checkoutReservation(r._id));
  const onCancel = (r) => {
    const reason = window.prompt(`Motif d'annulation pour ${r.ref} :`);
    if (reason && reason.trim()) run(r, () => cancelReservation(r._id, reason.trim()));
  };
  const onPayment = (r) => {
    const input = window.prompt(`Acompte payé pour ${r.ref} (total ${r.montant_total} TND) :`, r.acompte_paye);
    if (input != null) run(r, () => updatePayment(r._id, { acompte_paye: Number(input) || 0 }));
  };
  const onEdit = (r) => { setEditing(r); setModalOpen(true); };
  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const onSaved = () => { setModalOpen(false); setEditing(null); reload(); };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Réservations</div>
          <div className="page-sub">{reservations.length} réservation(s)</div>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={openCreate}><i className="bi bi-plus-lg" /> Nouvelle réservation</button>
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

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th className="ps-3">Réf</th><th>Client</th><th>CIN</th><th>Salle</th><th>Date</th><th>Créneau</th>
                  <th>Durée</th><th>Total</th><th>Acompte</th><th>Paiement</th><th>Statut</th><th>Responsable</th><th className="pe-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="13" className="center-msg"><span className="spinner-border spinner-border-sm me-2" />Chargement…</td></tr>
                ) : reservations.length === 0 ? (
                  <tr><td colSpan="13" className="empty-state"><div className="ico"><i className="bi bi-inbox" /></div>Aucune réservation.</td></tr>
                ) : (
                  reservations.map((r) => (
                    <ReservationRow key={r._id} r={r} busy={busyId === r._id}
                      onCheckin={onCheckin} onCheckout={onCheckout} onCancel={onCancel} onEdit={onEdit} onPayment={onPayment} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <ReservationModal open rooms={rooms} reservation={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }} onSaved={onSaved} />
      )}
    </div>
  );
}
