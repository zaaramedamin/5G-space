import { useEffect, useState } from "react";
import { toMinutes } from "../utils/timeClient.js";
import { reservationStatusBadge } from "../utils/format.js";

const START_HOUR = 8;
const END_HOUR = 21;
const HOUR_PX = 64;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

const isoDay = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

// Interval-partition events into side-by-side lanes so overlaps never stack.
function assignLanes(events) {
  const sorted = [...events].sort((a, b) => a.s - b.s || a.e - b.e);
  const out = [];
  let cluster = [];
  let clusterEnd = -1;
  const flush = () => {
    const colEnds = [];
    cluster.forEach((ev) => {
      let col = colEnds.findIndex((end) => ev.s >= end);
      if (col === -1) { col = colEnds.length; colEnds.push(ev.e); }
      else colEnds[col] = ev.e;
      ev.col = col;
    });
    cluster.forEach((ev) => { ev.cols = colEnds.length; out.push(ev); });
    cluster = []; clusterEnd = -1;
  };
  sorted.forEach((ev) => {
    if (cluster.length && ev.s >= clusterEnd) flush();
    cluster.push(ev);
    clusterEnd = Math.max(clusterEnd, ev.e);
  });
  flush();
  return out;
}

export default function DayTimeGrid({ rooms, reservations, day, onSelect }) {
  const [nowMin, setNowMin] = useState(() => new Date().getHours() * 60 + new Date().getMinutes());
  useEffect(() => {
    const id = setInterval(() => setNowMin(new Date().getHours() * 60 + new Date().getMinutes()), 60000);
    return () => clearInterval(id);
  }, []);

  const dayIso = isoDay(day);
  const isToday = dayIso === isoDay(new Date());
  const gridHeight = HOURS.length * HOUR_PX;
  const cols = `64px repeat(${rooms.length || 1}, minmax(150px, 1fr))`;
  const nowTop = ((nowMin - START_HOUR * 60) / 60) * HOUR_PX;

  return (
    <div className="tg">
      <div className="tg-scroll">
        <div style={{ minWidth: 64 + rooms.length * 150 }}>
          {/* Header: room columns */}
          <div className="tg-head" style={{ gridTemplateColumns: cols }}>
            <div className="tg-corner">Heure</div>
            {rooms.map((r) => (
              <div key={r._id} className="tg-col-head">
                <span className="dot" style={{ background: r.color_tag || "#4f46e5" }} />
                <span>{r.name} <small>· {r.capacity}p</small></span>
              </div>
            ))}
          </div>

          {/* Body: time axis + room columns with absolutely-placed events */}
          <div style={{ display: "flex" }}>
            <div style={{ width: 64, flexShrink: 0, position: "relative", height: gridHeight }}>
              {HOURS.map((h, i) => (
                <div key={h} className="tg-time" style={{ position: "absolute", top: i * HOUR_PX, width: "100%", borderRight: "1px solid var(--border)" }}>
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>

            <div style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${rooms.length || 1}, minmax(150px, 1fr))`, position: "relative" }}>
              {rooms.map((room) => {
                const events = assignLanes(
                  reservations
                    .filter((r) => (r.room?._id || r.room) === room._id && String(r.date).slice(0, 10) === dayIso && r.status !== "cancelled")
                    .map((r) => ({ r, s: toMinutes(r.start_time), e: toMinutes(r.end_time) }))
                );
                return (
                  <div key={room._id} className="tg-roomcol"
                    style={{
                      position: "relative", height: gridHeight, borderLeft: "1px solid var(--border)",
                      background: `repeating-linear-gradient(to bottom, transparent, transparent ${HOUR_PX - 1}px, var(--border) ${HOUR_PX - 1}px, var(--border) ${HOUR_PX}px)`,
                    }}>
                    {events.map(({ r, s, e, col, cols: n }) => {
                      const top = Math.max(((s - START_HOUR * 60) / 60) * HOUR_PX, 0);
                      const height = Math.max(((e - s) / 60) * HOUR_PX - 3, 34);
                      const dim = r.status === "checked_out";
                      const widthPct = 100 / n;
                      return (
                        <div key={r._id} className="tg-event"
                          onClick={() => onSelect(r)}
                          title={`${r.ref} · ${r.client?.name} · ${r.start_time}–${r.end_time}`}
                          style={{
                            top, height, left: `calc(${col * widthPct}% + 4px)`, width: `calc(${widthPct}% - 7px)`,
                            background: room.color_tag || "#4f46e5", opacity: dim ? 0.55 : 1,
                            borderLeftColor: r.status === "checked_in" ? "#fff" : "rgba(255,255,255,.55)",
                          }}>
                          <div className="te-time">{r.start_time}–{r.end_time}</div>
                          <div className="te-client">{r.client?.name}</div>
                          {height > 66 && <div className="te-meta">{r.ref} · {reservationStatusBadge(r.status).label}</div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}

              {isToday && nowTop >= 0 && nowTop <= gridHeight && (
                <div className="tg-now" style={{ top: nowTop }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
