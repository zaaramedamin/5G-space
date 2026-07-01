import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function TopBar({ onToggle, collapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
        <i className="bi bi-list app-ico-mobile" />
        <i className={`bi ${collapsed ? "bi-text-indent-left" : "bi-text-indent-right"} app-ico-desktop`} />
      </button>
      <button className="app-collapse-btn d-none d-md-inline-flex" onClick={() => navigate(-1)} title="Retour" aria-label="Retour">
        <i className="bi bi-arrow-left" />
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
