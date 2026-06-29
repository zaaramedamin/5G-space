import { roomStatusBadge, humanMinutes } from "../utils/format.js";

function KV({ label, children }) {
  return (
    <div className="room-kv">
      <b>{label}</b>
      <span className="fw-semibold text-end">{children}</span>
    </div>
  );
}

export default function RoomCard({ room }) {
  const badge = roomStatusBadge(room.status);
  const r = room.reservation;
  const accent = room.color_tag || badge.color;

  return (
    <div className="room-tile">
      <div className="room-tile-accent" style={{ background: accent }} />
      <div className="room-tile-body">
        <div className="d-flex justify-content-between align-items-center gap-2">
          <span className="fw-bold fs-5">{room.name}</span>
          <span className={`badge rounded-pill dotted ${badge.cls}`}>{badge.label}</span>
        </div>
        <div className="muted small mt-1"><i className="bi bi-people me-1" />Capacité · {room.capacity} personnes</div>

        {room.status === "libre" && <div className="room-empty"><i className="bi bi-check-circle me-1" />Aucune réservation active</div>}

        {r && (
          <div className="mt-3">
            <KV label="Client">{r.client_name}</KV>
            <KV label="CIN">{r.cin_masked}</KV>
            <KV label="Créneau">{r.start_time} – {r.end_time}</KV>
            {room.status === "occupee" ? (
              <>
                <KV label="Check-in par">{r.checkin_by_name || "—"}</KV>
                <KV label="Temps restant">
                  {r.minutes_remaining >= 0
                    ? humanMinutes(r.minutes_remaining)
                    : <span className="text-danger">dépassé de {humanMinutes(-r.minutes_remaining)}</span>}
                </KV>
              </>
            ) : (
              <KV label="Débute dans">{r.minutes_until_start != null ? humanMinutes(r.minutes_until_start) : "—"}</KV>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
