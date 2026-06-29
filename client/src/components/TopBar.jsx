import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth.js";

export default function TopBar({ onToggle, collapsed }) {
  const { user, logout } = useAuth();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <header className="app-topbar">
      <button className="app-collapse-btn" onClick={onToggle} title={collapsed ? "Déplier" : "Replier"} aria-label="Basculer le menu">
        <i className={`bi ${collapsed ? "bi-text-indent-left" : "bi-text-indent-right"}`} />
      </button>
      <div className="app-clock"><span className="dim">{dateStr} · </span>{timeStr}</div>
      <div className="spacer" />
      <span className="d-none d-md-block fw-semibold">{user?.name}</span>
      <button className="btn btn-light btn-sm d-flex align-items-center gap-2" onClick={logout}>
        <i className="bi bi-box-arrow-right" /> Déconnexion
      </button>
    </header>
  );
}
