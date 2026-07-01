import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

function Item({ to, end, icon, label, onNavigate }) {
  return (
    <NavLink to={to} end={end} title={label} onClick={onNavigate} className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}>
      <i className={`bi ${icon} app-nav-ico`} />
      <span className="app-nav-label">{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onNavigate }) {
  const { isAdmin, user } = useAuth();
  const initials = (user?.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <aside className={`app-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="app-brand">
        <img
          src="/logo-5gspace.png"
          alt="5G Space"
          className="app-brand-logo"
        />
      </div>

      <nav className="app-nav">
        <Item to="/" end icon="bi-grid-1x2-fill" label="Tableau de bord" onNavigate={onNavigate} />
        <Item to="/calendar" icon="bi-calendar3" label="Calendrier" onNavigate={onNavigate} />
        <Item to="/reservations" icon="bi-card-list" label="Réservations" onNavigate={onNavigate} />
        {isAdmin && (
          <>
            <div className="app-nav-section">Administration</div>
            <Item to="/reports" icon="bi-graph-up-arrow" label="Rapports" onNavigate={onNavigate} />
            <Item to="/clients" icon="bi-people-fill" label="Clients" onNavigate={onNavigate} />
            <Item to="/audit" icon="bi-shield-check" label="Journal d'audit" onNavigate={onNavigate} />
            <Item to="/settings" icon="bi-gear-fill" label="Paramètres" onNavigate={onNavigate} />
          </>
        )}
      </nav>

      <div className="app-user" title={user?.name}>
        <span className="avatar">{initials}</span>
        <div className="app-user-info">
          <div className="nm">{user?.name}</div>
          <div className="rl">{user?.role === "admin" ? "Administrateur" : "Staff"}</div>
        </div>
      </div>
    </aside>
  );
}
