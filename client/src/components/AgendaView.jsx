import { useMemo } from "react";
import { reservationStatusBadge, paymentBadge, formatTND } from "../utils/format.js";

const isoDay = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

/**
 * Mobile-friendly calendar: a vertical agenda grouped by day (Google-Calendar
 * "Schedule" style). No horizontal scrolling — each reservation is a full-width
 * tappable card. Used for both the day and week views on phones.
 */
export default function AgendaView({ days, reservations, rooms, onSelect }) {
  const roomById = useMemo(
    () => Object.fromEntries((rooms || []).map((r) => [r._id, r])),
    [rooms]
  );

  const groups = useMemo(() => {
    return (days || []).map((day) => {
      const dayIso = isoDay(day);
      const items = (reservations || [])
        .filter((r) => String(r.date).slice(0, 10) === dayIso && r.status !== "cancelled")
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      return { day, dayIso, items };
    });
  }, [days, reservations]);

  const todayIso = isoDay(new Date());
  const nonEmpty = groups.filter((g) => g.items.length > 0);

  if (nonEmpty.length === 0) {
    return (
      <div className="agenda">
        <div className="empty-state"><div className="ico"><i className="bi bi-calendar2-week" /></div>Aucune réservation sur cette période.</div>
      </div>
    );
  }

  return (
    <div className="agenda">
      {nonEmpty.map(({ day, dayIso, items }) => (
        <div key={dayIso} className="agenda-day">
          <div className={`agenda-date ${dayIso === todayIso ? "is-today" : ""}`}>
            <span className="agenda-dnum">{day.getDate()}</span>
            <span className="agenda-dlabel">
              {day.toLocaleDateString("fr-FR", { weekday: "long" })}
              <small>{day.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</small>
            </span>
            <span className="agenda-count">{items.length}</span>
          </div>

          <div className="agenda-items">
            {items.map((r) => {
              const room = roomById[r.room?._id || r.room] || r.room || {};
              const st = reservationStatusBadge(r.status);
              const pay = paymentBadge(r.payment_status);
              const color = room.color_tag || "#4f46e5";
              return (
                <button key={r._id} type="button" className="agenda-item" onClick={() => onSelect(r)}
                  style={{ opacity: r.status === "checked_out" ? 0.62 : 1 }}>
                  <span className="agenda-accent" style={{ background: color }} />
                  <span className="agenda-time">
                    <span className="t1">{r.start_time}</span>
                    <span className="t2">{r.end_time}</span>
                  </span>
                  <span className="agenda-body">
                    <span className="agenda-client">{r.client?.name}</span>
                    <span className="agenda-room">
                      <span className="dot" style={{ background: color }} />{room.name || "—"}
                    </span>
                    <span className="agenda-badges">
                      <span className={`badge rounded-pill dotted ${st.cls}`}>{st.label}</span>
                      <span className={`badge rounded-pill dotted ${pay.cls}`}>{pay.label}</span>
                    </span>
                  </span>
                  <span className="agenda-amount">{formatTND(r.montant_total)}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
