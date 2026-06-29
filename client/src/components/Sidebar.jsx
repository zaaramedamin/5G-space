import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

function Item({ to, end, icon, label }) {
  return (
    <NavLink to={to} end={end} title={label} className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}>
      <i className={`bi ${icon} app-nav-ico`} />
      <span className="app-nav-label">{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ collapsed }) {
  const { isAdmin, user } = useAuth();
  const initials = (user?.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="app-brand">
        <span className="app-brand-mark">5G</span>
        <span className="app-brand-text">5G Space<small>Bizerte · Gestion</small></span>
      </div>

      <nav className="app-nav">
        <Item to="/" end icon="bi-grid-1x2-fill" label="Tableau de bord" />
        <Item to="/calendar" icon="bi-calendar3" label="Calendrier" />
        <Item to="/reservations" icon="bi-card-list" label="Réservations" />
        {isAdmin && (
          <>
            <div className="app-nav-section">Administration</div>
            <Item to="/clients" icon="bi-people-fill" label="Clients" />
            <Item to="/audit" icon="bi-shield-check" label="Journal d'audit" />
            <Item to="/settings" icon="bi-gear-fill" label="Paramètres" />
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
