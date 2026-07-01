import * as XLSX from "xlsx";
import { formatDate, paymentBadge, reservationStatusBadge } from "./format.js";

// Exports a reservations array to a downloadable .xlsx file.
export function exportReservationsXlsx(reservations, filename = "reservations") {
  const rows = (reservations || []).map((r) => ({
    "Réf": r.ref,
    "Client": r.client?.name,
    "Téléphone": r.client?.phone,
    "CIN": r.client?.cin,
    "Salle": r.room?.name,
    "Date": formatDate(r.date),
    "Début": r.start_time,
    "Fin": r.end_time,
    "Durée (h)": r.duration_hours,
    "Total (TND)": r.montant_total,
    "Acompte (TND)": r.acompte_paye,
    "Paiement": paymentBadge(r.payment_status).label,
    "Statut": reservationStatusBadge(r.status).label,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 14 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
    { wch: 7 }, { wch: 7 }, { wch: 9 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Réservations");
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
