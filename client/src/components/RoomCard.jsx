import { useNavigate } from "react-router-dom";
import { roomStatusBadge, humanMinutes } from "../utils/format.js";
import { toMinutes } from "../utils/timeClient.js";
import { amenityIcon } from "../utils/amenities.js";

const DAY_START = 8 * 60;
const DAY_END   = 21 * 60;
const RANGE     = DAY_END - DAY_START;
const TICKS     = [8, 10, 12, 14, 16, 18, 20];

const slotColor = (status, fallback) => {
  if (status === "checked_in")  return "#22c55e";
  if (status === "checked_out") return "#94a3b8";
  return fallback || "#4f46e5";
};

function TimelineBar({ slots = [], colorTag }) {
  const now    = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowPct = Math.min(100, Math.max(0, ((nowMin - DAY_START) / RANGE) * 100));

  return (
    <div className="rtile-tl-wrap">
      <div className="rtile-tl-bar">
        {slots.map((s, i) => {
          const start  = toMinutes(s.start_time);
          const end    = toMinutes(s.end_time);
          const left   = Math.max(0, ((start - DAY_START) / RANGE) * 100);
          const width  = Math.min(100 - left, ((end - start) / RANGE) * 100);
          if (width <= 0) return null;
          return (
            <div key={i} className="rtile-tl-seg"
              style={{ left: `${left}%`, width: `${width}%`, background: slotColor(s.status, colorTag) }}
              title={`${s.start_time}–${s.end_time}${s.ref ? ` · ${s.ref}` : ""}`} />
          );
        })}
        <div className="rtile-tl-now" style={{ left: `${nowPct}%` }} />
      </div>
      <div className="rtile-tl-labels">
        {TICKS.map((h) => (
          <span key={h} style={{ left: `${((h * 60 - DAY_START) / RANGE) * 100}%` }}>{h}h</span>
        ))}
      </div>
    </div>
  );
}

export default function RoomCard({ room, onBook }) {
  const navigate = useNavigate();
  const badge    = roomStatusBadge(room.status);
  const r        = room.reservation;
  const color    = room.color_tag || "#4f46e5";

  function handleBookBtn(e) {
    e.stopPropagation();
    if (onBook) onBook(room);
  }

  return (
    <div className="rtile" style={{ cursor: "pointer" }} onClick={() => navigate("/calendar")}>
      {/* Coloured header band */}
      <div className="rtile-hdr" style={{ background: `linear-gradient(135deg, ${color}15 0%, ${color}28 100%)`, borderTop: `3px solid ${color}` }}>
        <div className="d-flex align-items-center gap-2">
          <span className="rtile-cap"><i className="bi bi-people-fill me-1" />×{room.capacity}</span>
          <span className="rtile-tag">SALLE DE RÉUNION</span>
        </div>
        <span className={`badge rounded-pill dotted ${badge.cls}`}>{badge.label}</span>
      </div>

      {/* Card body */}
      <div className="rtile-body">
        <div className="rtile-name">{room.name}</div>
        {room.tarif_horaire != null && (
          <div className="rtile-price"><i className="bi bi-tag me-1" />{room.tarif_horaire} TND/h</div>
        )}

        {room.amenities?.length > 0 && (
          <div className="rtile-amenities">
            {room.amenities.map((a) => (
              <span key={a} className="amenity-tag" title={a}><i className={`bi ${amenityIcon(a)}`} />{a}</span>
            ))}
          </div>
        )}

        {room.status === "libre" && !r && (
          <div className="rtile-free"><i className="bi bi-check-circle-fill me-1" />Disponible</div>
        )}

        {r && (
          <div className="rtile-current">
            <div className="d-flex align-items-center gap-2 mb-1">
              <i className="bi bi-person-fill" style={{ color, fontSize: 13 }} />
              <span className="fw-semibold" style={{ fontSize: 13 }}>{r.client_name}</span>
              <span className="text-muted" style={{ fontSize: 12 }}>{r.cin_masked}</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-clock" style={{ color: "var(--muted)", fontSize: 12 }} />
              <span style={{ fontSize: 12 }}>{r.start_time} – {r.end_time}</span>
              {room.status === "occupee" && r.minutes_remaining != null && (
                <span className="ms-auto fw-semibold" style={{ fontSize: 12, color: r.minutes_remaining < 15 ? "#ef4444" : "#22c55e" }}>
                  {r.minutes_remaining >= 0 ? `${humanMinutes(r.minutes_remaining)} restant` : "Dépassé"}
                </span>
              )}
              {room.status === "reservee" && r.minutes_until_start != null && (
                <span className="ms-auto" style={{ fontSize: 12, color: "var(--muted)" }}>dans {humanMinutes(r.minutes_until_start)}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Day availability timeline */}
      <TimelineBar slots={room.today_slots || []} colorTag={color} />

      {/* Footer action */}
      <div className="rtile-foot">
        <button className="btn btn-primary btn-sm flex-fill" onClick={handleBookBtn}>
          <i className="bi bi-plus-lg me-1" />Réserver
        </button>
      </div>
    </div>
  );
}
