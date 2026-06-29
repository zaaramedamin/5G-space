// Week overview: rooms as rows, 7 days as columns. Compact blocks with "+N more".
const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const isoDay = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

export default function CalendarGrid({ rooms, reservations, days, onSelect, onPickDay }) {
  const todayIso = isoDay(new Date());

  return (
    <div className="wk">
      <div className="wk-row wk-head">
        <div className="wk-room" style={{ color: "var(--text-faint)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em" }}>Salle</div>
        {days.map((d, i) => (
          <div key={i} className="wk-daylabel" style={{ background: isoDay(d) === todayIso ? "var(--primary-soft)" : undefined, cursor: "pointer" }}
            onClick={() => onPickDay(d)} title="Voir la journée">
            <div className="muted">{DAY_LABELS[i]}</div>
            <div className="num">{d.getDate()}</div>
          </div>
        ))}
      </div>

      {rooms.map((room) => (
        <div key={room._id} className="wk-row">
          <div className="wk-room">
            <span className="dot" style={{ background: room.color_tag || "#4f46e5" }} />
            {room.name}
          </div>
          {days.map((day, i) => {
            const dayIso = isoDay(day);
            const blocks = reservations
              .filter((r) => (r.room?._id || r.room) === room._id && String(r.date).slice(0, 10) === dayIso && r.status !== "cancelled")
              .sort((a, b) => a.start_time.localeCompare(b.start_time));
            const shown = blocks.slice(0, 3);
            const extra = blocks.length - shown.length;
            return (
              <div key={i} className="wk-cell" style={{ background: dayIso === todayIso ? "rgba(79,70,229,.04)" : undefined }}>
                {shown.map((r) => (
                  <div key={r._id} className="wk-block"
                    style={{ background: room.color_tag || "#4f46e5", opacity: r.status === "checked_out" ? 0.55 : 1 }}
                    title={`${r.ref} · ${r.client?.name}`} onClick={() => onSelect(r)}>
                    {r.start_time} · {r.client?.name}
                  </div>
                ))}
                {extra > 0 && (
                  <div className="muted" style={{ fontSize: 11, cursor: "pointer", fontWeight: 600 }} onClick={() => onPickDay(day)}>
                    +{extra} de plus
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
