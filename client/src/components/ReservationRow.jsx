import { reservationStatusBadge, paymentBadge, formatTND, formatDate, maskCin } from "../utils/format.js";
import { canCheckInNow } from "../utils/timeClient.js";

export default function ReservationRow({ r, onCheckin, onCheckout, onCancel, onEdit, onPayment, busy }) {
  const st = reservationStatusBadge(r.status);
  const pay = paymentBadge(r.payment_status);
  const responsible = r.checkout_by?.name || r.checkin_by?.name || r.created_by?.name || "—";
  const checkinEligible = r.status === "confirmed" && canCheckInNow(r.date, r.start_time);

  return (
    <tr>
      <td className="ps-3 fw-semibold">{r.ref}</td>
      <td>{r.client?.name}<div className="muted small">{r.client?.phone}</div></td>
      <td className="font-monospace">{maskCin(r.client?.cin)}</td>
      <td>{r.room?.name}</td>
      <td>{formatDate(r.date)}</td>
      <td>{r.start_time}–{r.end_time}</td>
      <td>{r.duration_hours}h</td>
      <td className="fw-semibold">{formatTND(r.montant_total)}</td>
      <td>{formatTND(r.acompte_paye)}</td>
      <td><span className={`badge rounded-pill dotted ${pay.cls}`}>{pay.label}</span></td>
      <td><span className={`badge rounded-pill dotted ${st.cls}`}>{st.label}</span></td>
      <td>{responsible}</td>
      <td className="pe-3">
        <div className="d-flex gap-1 flex-nowrap">
          {r.status === "confirmed" && (
            <>
              <button className="btn btn-success btn-sm" disabled={!checkinEligible || busy}
                title={checkinEligible ? "Enregistrer l'arrivée" : "Disponible ±15 min autour de l'heure de début"}
                onClick={() => onCheckin(r)}><i className="bi bi-box-arrow-in-right" /></button>
              <button className="btn btn-light btn-sm" disabled={busy} title="Éditer" onClick={() => onEdit(r)}><i className="bi bi-pencil" /></button>
            </>
          )}
          {r.status === "checked_in" && (
            <button className="btn btn-primary btn-sm" disabled={busy} title="Check-out" onClick={() => onCheckout(r)}><i className="bi bi-box-arrow-right" /> Sortie</button>
          )}
          {(r.status === "confirmed" || r.status === "checked_in") && (
            <button className="btn btn-outline-danger btn-sm" disabled={busy} title="Annuler" onClick={() => onCancel(r)}><i className="bi bi-x-lg" /></button>
          )}
          {r.payment_status !== "paid" && r.status !== "cancelled" && (
            <button className="btn btn-light btn-sm" disabled={busy} title="Paiement" onClick={() => onPayment(r)}><i className="bi bi-cash" /></button>
          )}
        </div>
      </td>
    </tr>
  );
}
