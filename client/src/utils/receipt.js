import { jsPDF } from "jspdf";
import { formatTND, formatDate, paymentBadge, reservationStatusBadge } from "./format.js";

// Generates and downloads a branded A5 PDF receipt for one reservation.
export function generateReceipt(r) {
  const doc = new jsPDF({ unit: "mm", format: "a5" }); // 148 × 210 mm
  const W = 148;
  const brand = [79, 70, 229];
  const ink = [30, 41, 59];
  const muted = [100, 116, 139];

  // Header band
  doc.setFillColor(brand[0], brand[1], brand[2]);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("5G Space", 14, 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Reçu de réservation", 14, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(r.ref || "", W - 14, 15, { align: "right" });

  const reste = Math.max((r.montant_total || 0) - (r.acompte_paye || 0), 0);
  let y = 42;
  const row = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.text(label.toUpperCase(), 14, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(ink[0], ink[1], ink[2]);
    doc.text(String(value ?? "—"), 14, y + 5.5);
    y += 13;
  };

  row("Client", r.client?.name);
  row("Téléphone", r.client?.phone);
  row("CIN", r.client?.cin);
  row("Salle", r.room?.name);
  row("Date", formatDate(r.date));
  row("Créneau", `${r.start_time} – ${r.end_time}  (${r.duration_hours ?? "—"} h)`);

  // Amount box
  y += 2;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, W - 28, 34, 2, 2, "FD");
  const amt = (label, value, yy, bold) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 10);
    doc.setTextColor(bold ? ink[0] : muted[0], bold ? ink[1] : muted[1], bold ? ink[2] : muted[2]);
    doc.text(label, 20, yy);
    doc.text(value, W - 20, yy, { align: "right" });
  };
  amt("Montant total", formatTND(r.montant_total), y + 9, true);
  amt("Acompte payé", formatTND(r.acompte_paye), y + 18, false);
  amt("Reste à payer", formatTND(reste), y + 27, false);
  y += 42;

  row("Statut paiement", paymentBadge(r.payment_status).label);
  row("Statut réservation", reservationStatusBadge(r.status).label);

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 190, W - 14, 190);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(muted[0], muted[1], muted[2]);
  doc.text(`Édité le ${new Date().toLocaleString("fr-FR")}`, 14, 196);
  doc.text("5G Space Bizerte · Coworking & Business", W - 14, 196, { align: "right" });

  doc.save(`recu-${r.ref || "reservation"}.pdf`);
}
