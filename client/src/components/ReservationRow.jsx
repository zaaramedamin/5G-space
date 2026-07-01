import { reservationStatusBadge, paymentBadge, formatTND, formatDate, maskCin } from "../utils/format.js";

export default function ReservationRow({ r, onCheckin, onCheckout, onCancel, onEdit, onPayment, busy }) {
  const st  = reservationStatusBadge(r.status);
  const pay = paymentBadge(r.payment_status);

  return (
    <tr>
      <td className="ps-3 fw-semibold" style={{ fontSize: 12.5 }} data-card-title>{r.ref}</td>
      <td data-label="Client">
        <div>
          <div className="fw-semibold" style={{ fontSize: 13 }}>{r.client?.name}</div>
          <div className="text-muted" style={{ fontSize: 11.5 }}>{r.client?.phone}{r.client?.cin ? ` · ${maskCin(r.client?.cin)}` : ""}</div>
        </div>
      </td>
      <td data-label="Salle" style={{ fontSize: 12.5 }}>{r.room?.name}</td>
      <td data-label="Créneau">
        <div>
          <div style={{ fontSize: 12.5 }}>{formatDate(r.date)}</div>
          <div className="text-muted" style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>{r.start_time}–{r.end_time} · {r.duration_hours}h</div>
        </div>
      </td>
      <td data-label="Montant">
        <div>
          <div className="fw-semibold" style={{ fontSize: 12.5 }}>{formatTND(r.montant_total)}</div>
          <div className="text-muted" style={{ fontSize: 11.5 }}>Acompte {formatTND(r.acompte_paye)}</div>
          <span className={`badge rounded-pill ${pay.cls}`} style={{ fontSize: 10, marginTop: 3 }}>{pay.label}</span>
        </div>
      </td>
      <td data-label="État">
        <span className={`badge rounded-pill dotted ${st.cls}`} style={{ fontSize: 11.5 }}>{st.label}</span>
      </td>
      <td className="pe-3 cards-actions">
        <div className="d-flex gap-1 flex-wrap">
          {r.status === "confirmed" && (
            <>
              <button className="btn btn-success btn-sm d-inline-flex align-items-center gap-1" disabled={busy}
                title="Enregistrer l'arrivée du client"
                onClick={() => onCheckin(r)}><i className="bi bi-box-arrow-in-right" /> Check-in</button>
              <button className="btn btn-light btn-sm d-inline-flex align-items-center gap-1" disabled={busy} title="Modifier la réservation" onClick={() => onEdit(r)}><i className="bi bi-pencil" /> Modifier</button>
            </>
          )}
          {r.status === "checked_in" && (
            <button className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1" disabled={busy} title="Enregistrer le départ du client" onClick={() => onCheckout(r)}><i className="bi bi-box-arrow-right" /> Check-out</button>
          )}
          {(r.status === "confirmed" || r.status === "checked_in") && (
            <button className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1" disabled={busy} title="Annuler la réservation" onClick={() => onCancel(r)}><i className="bi bi-x-lg" /> Annuler</button>
          )}
          {r.payment_status !== "paid" && r.status !== "cancelled" && (
            <button className="btn btn-light btn-sm d-inline-flex align-items-center gap-1" disabled={busy} title="Mettre à jour le paiement" onClick={() => onPayment(r)}><i className="bi bi-cash" /> Paiement</button>
          )}
        </div>
      </td>
    </tr>
  );
}
