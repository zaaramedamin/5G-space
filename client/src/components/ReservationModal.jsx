import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth.js";
import { lookupByCin } from "../api/clients.api.js";
import { createReservation, updateReservation } from "../api/reservations.api.js";
import { apiError } from "../api/axiosInstance.js";
import { durationHours } from "../utils/timeClient.js";
import { formatTND, todayISO, paymentBadge } from "../utils/format.js";
import { modalSpring } from "../utils/motion.js";

const emptyForm = () => ({
  name: "", phone: "", cin: "", email: "",
  room: "", date: todayISO(), start_time: "09:00", end_time: "10:00",
  acompte_paye: 0, notes: "",
});

export default function ReservationModal({ open, onClose, onSaved, rooms, reservation }) {
  const { user } = useAuth();
  const editing = Boolean(reservation);

  const [form, setForm] = useState(() =>
    reservation
      ? {
          name: reservation.client.name, phone: reservation.client.phone,
          cin: reservation.client.cin, email: reservation.client.email || "",
          room: reservation.room?._id || reservation.room, date: reservation.date?.slice(0, 10),
          start_time: reservation.start_time, end_time: reservation.end_time,
          acompte_paye: reservation.acompte_paye || 0, notes: reservation.notes || "",
        }
      : emptyForm()
  );
  const [blacklistWarn, setBlacklistWarn] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const selectedRoom = rooms.find((r) => r._id === form.room);

  const preview = useMemo(() => {
    const dur = durationHours(form.start_time, form.end_time);
    const tarif = selectedRoom?.tarif_horaire || 0;
    const total = dur > 0 ? Math.round(dur * tarif * 100) / 100 : 0;
    const acompte = Number(form.acompte_paye) || 0;
    const status = acompte <= 0 ? "pending" : acompte >= total ? "paid" : "partial";
    return { dur, total, status };
  }, [form.start_time, form.end_time, form.acompte_paye, selectedRoom]);

  async function checkCin() {
    setBlacklistWarn("");
    if (!form.cin.trim()) return;
    try {
      const matches = await lookupByCin(form.cin.trim());
      const hit = matches.find((c) => c.is_blacklisted);
      if (hit) setBlacklistWarn(`Client sur liste noire : ${hit.blacklist_reason || "raison non précisée"}.`);
    } catch { /* best-effort */ }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(""); setSubmitting(true);
    const payload = {
      client: { name: form.name, phone: form.phone, cin: form.cin, email: form.email },
      room: form.room, date: form.date, start_time: form.start_time, end_time: form.end_time,
      acompte_paye: Number(form.acompte_paye) || 0, notes: form.notes,
    };
    try {
      if (editing) await updateReservation(reservation._id, payload);
      else await createReservation(payload);
      onSaved();
    } catch (err) {
      setError(apiError(err, "Enregistrement impossible."));
    } finally {
      setSubmitting(false);
    }
  }

  const pay = paymentBadge(preview.status);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.form className="ov-card" onSubmit={onSubmit} variants={modalSpring} initial="initial" animate="animate" exit="exit">
            <div className="ov-head">
              <h2>{editing ? `Modifier ${reservation.ref}` : "Nouvelle réservation"}</h2>
              <button type="button" className="ov-x" onClick={onClose}>×</button>
            </div>

            <div className="ov-body">
              {error && <div className="alert alert-danger py-2">{error}</div>}

              <div className="section-label mb-2"><i className="bi bi-person me-1" /> Client</div>
              <div className="row g-3 mb-2">
                <div className="col-md-6"><label className="form-label">Nom *</label><input className="form-control" required value={form.name} onChange={set("name")} /></div>
                <div className="col-md-6"><label className="form-label">Téléphone *</label><input className="form-control" required value={form.phone} onChange={set("phone")} /></div>
                <div className="col-md-6"><label className="form-label">CIN *</label><input className="form-control" required value={form.cin} onChange={set("cin")} onBlur={checkCin} /></div>
                <div className="col-md-6"><label className="form-label">Email</label><input className="form-control" type="email" value={form.email} onChange={set("email")} /></div>
              </div>
              {blacklistWarn && <div className="alert alert-warning py-2 d-flex align-items-center gap-2"><i className="bi bi-exclamation-triangle-fill" /> {blacklistWarn}</div>}

              <div className="section-label mb-2 mt-3"><i className="bi bi-calendar-event me-1" /> Créneau</div>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Salle *</label>
                  <select className="form-select" required value={form.room} onChange={set("room")}>
                    <option value="">— Choisir —</option>
                    {rooms.map((r) => <option key={r._id} value={r._id}>{r.name} · {r.capacity}p · {r.tarif_horaire} TND/h</option>)}
                  </select>
                </div>
                <div className="col-md-6"><label className="form-label">Date *</label><input className="form-control" type="date" required value={form.date} onChange={set("date")} /></div>
                <div className="col-md-6"><label className="form-label">Début *</label><input className="form-control" type="time" required value={form.start_time} onChange={set("start_time")} /></div>
                <div className="col-md-6"><label className="form-label">Fin *</label><input className="form-control" type="time" required value={form.end_time} onChange={set("end_time")} /></div>
              </div>

              <div className="d-flex align-items-center gap-3 bg-light rounded-3 p-3 my-3">
                <span><span className="muted">Durée :</span> <strong>{preview.dur > 0 ? `${preview.dur} h` : "—"}</strong></span>
                <span className="spacer" />
                <span className="fs-5"><span className="muted">Total :</span> <strong className="text-brand">{formatTND(preview.total)}</strong></span>
              </div>

              <div className="row g-3">
                <div className="col-md-6"><label className="form-label">Acompte payé (TND)</label><input className="form-control" type="number" min="0" step="0.5" value={form.acompte_paye} onChange={set("acompte_paye")} /></div>
                <div className="col-md-6"><label className="form-label">Statut paiement (calculé)</label><div><span className={`badge rounded-pill dotted ${pay.cls}`}>{pay.label}</span></div></div>
                <div className="col-12"><label className="form-label">Notes</label><textarea className="form-control" rows="2" value={form.notes} onChange={set("notes")} /></div>
                <div className="col-12"><label className="form-label">Responsable</label><input className="form-control" value={user?.name || ""} readOnly disabled /></div>
              </div>
            </div>

            <div className="ov-foot">
              <button type="button" className="btn btn-light" onClick={onClose}>Annuler</button>
              <button className="btn btn-primary d-flex align-items-center gap-2" disabled={submitting}>
                {submitting ? <><span className="spinner-border spinner-border-sm" /> Enregistrement…</> : <><i className="bi bi-check-lg" /> Enregistrer</>}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
