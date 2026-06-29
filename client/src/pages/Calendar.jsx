import { useEffect, useMemo, useState } from "react";
import { useRooms } from "../hooks/useRooms.js";
import { getReservations } from "../api/reservations.api.js";
import DayTimeGrid from "../components/DayTimeGrid.jsx";
import CalendarGrid from "../components/CalendarGrid.jsx";
import ReservationModal from "../components/ReservationModal.jsx";
import Modal from "../components/Modal.jsx";
import { reservationStatusBadge, paymentBadge, formatTND } from "../utils/format.js";

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}
const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d; };

export default function Calendar() {
  const { rooms } = useRooms();
  const [view, setView] = useState("day");
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [reservations, setReservations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() { getReservations().then(setReservations).catch(() => setReservations([])); }
  useEffect(load, []);

  const weekDays = useMemo(() => {
    const start = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const shift = (n) => setCursor((c) => addDays(c, view === "day" ? n : n * 7));
  const goToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); setCursor(d); };
  const pickDay = (d) => { setCursor(new Date(d)); setView("day"); };

  const dayLabel = cursor.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const weekLabel = `${weekDays[0].toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} – ${weekDays[6].toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}`;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Calendrier</div>
          <div className="page-sub text-capitalize">{view === "day" ? dayLabel : weekLabel}</div>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <div className="seg">
            <button className={view === "day" ? "active" : ""} onClick={() => setView("day")}>Jour</button>
            <button className={view === "week" ? "active" : ""} onClick={() => setView("week")}>Semaine</button>
          </div>
          <div className="seg">
            <button onClick={() => shift(-1)}><i className="bi bi-chevron-left" /></button>
            <button onClick={goToday}>Aujourd'hui</button>
            <button onClick={() => shift(1)}><i className="bi bi-chevron-right" /></button>
          </div>
        </div>
      </div>

      {view === "day"
        ? <DayTimeGrid rooms={rooms} reservations={reservations} day={cursor} onSelect={setSelected} />
        : <CalendarGrid rooms={rooms} reservations={reservations} days={weekDays} onSelect={setSelected} onPickDay={pickDay} />}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.ref} maxWidth={460}
        footer={selected && (
          <>
            {selected.status === "confirmed" && (
              <button className="btn btn-primary" onClick={() => { setEditing(selected); setSelected(null); }}><i className="bi bi-pencil me-1" />Modifier</button>
            )}
            <button className="btn btn-light" onClick={() => setSelected(null)}>Fermer</button>
          </>
        )}>
        {selected && (
          <div className="d-flex flex-column gap-2">
            <DetailRow label="Client" value={`${selected.client?.name} · ${selected.client?.phone}`} />
            <DetailRow label="Salle" value={selected.room?.name} />
            <DetailRow label="Créneau" value={`${String(selected.date).slice(0, 10)} · ${selected.start_time}–${selected.end_time}`} />
            <DetailRow label="Montant" value={`${formatTND(selected.montant_total)} (acompte ${formatTND(selected.acompte_paye)})`} />
            <div className="d-flex gap-2">
              <span className={`badge rounded-pill dotted ${reservationStatusBadge(selected.status).cls}`}>{reservationStatusBadge(selected.status).label}</span>
              <span className={`badge rounded-pill dotted ${paymentBadge(selected.payment_status).cls}`}>{paymentBadge(selected.payment_status).label}</span>
            </div>
          </div>
        )}
      </Modal>

      {editing && (
        <ReservationModal open rooms={rooms} reservation={editing}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="d-flex justify-content-between gap-3">
      <span className="muted">{label}</span>
      <strong className="text-end">{value}</strong>
    </div>
  );
}
