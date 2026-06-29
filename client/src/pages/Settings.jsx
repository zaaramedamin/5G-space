import { useEffect, useState } from "react";
import { getRooms, createRoom, updateRoom, deleteRoom } from "../api/rooms.api.js";
import { getUsers, createUser, updateUser, deactivateUser } from "../api/users.api.js";
import { apiError } from "../api/axiosInstance.js";
import { formatTND } from "../utils/format.js";

const TABS = [
  { key: "rooms", label: "Salles", icon: "bi-door-closed" },
  { key: "staff", label: "Personnel", icon: "bi-people" },
  { key: "tarifs", label: "Tarifs", icon: "bi-tag" },
];

export default function Settings() {
  const [tab, setTab] = useState("rooms");
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Paramètres</div>
          <div className="page-sub">Configuration des salles, du personnel et des tarifs</div>
        </div>
      </div>
      <div className="tabs">
        {TABS.map((t) => (
          <div key={t.key} className={`tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
            <i className={`bi ${t.icon} me-2`} />{t.label}
          </div>
        ))}
      </div>
      {tab === "rooms" && <RoomsTab />}
      {tab === "staff" && <StaffTab />}
      {tab === "tarifs" && <TarifsTab />}
    </div>
  );
}

/* ---------------- Rooms ---------------- */
function RoomsTab() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ name: "", capacity: 4, tarif_horaire: 10, color_tag: "#4f46e5", description: "" });
  const [error, setError] = useState("");
  const load = () => getRooms(true).then(setRooms).catch(() => setRooms([]));
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function add(e) {
    e.preventDefault(); setError("");
    try {
      await createRoom({ ...form, capacity: Number(form.capacity), tarif_horaire: Number(form.tarif_horaire) });
      setForm({ name: "", capacity: 4, tarif_horaire: 10, color_tag: "#4f46e5", description: "" });
      load();
    } catch (err) { setError(apiError(err)); }
  }
  async function toggleActive(r) {
    try { r.is_active ? await deleteRoom(r._id) : await updateRoom(r._id, { is_active: true }); load(); }
    catch (err) { setError(apiError(err)); }
  }
  async function rename(r) {
    const name = window.prompt("Nom de la salle :", r.name);
    if (name && name.trim()) { await updateRoom(r._id, { name: name.trim() }); load(); }
  }

  return (
    <>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <form className="card mb-3" onSubmit={add}>
        <div className="card-body">
          <div className="section-label mb-3">Ajouter une salle</div>
          <div className="row g-3 align-items-end">
            <div className="col-md-4"><label className="form-label">Nom</label><input className="form-control" required value={form.name} onChange={set("name")} /></div>
            <div className="col-6 col-md-2"><label className="form-label">Capacité</label><input className="form-control" type="number" min="1" value={form.capacity} onChange={set("capacity")} /></div>
            <div className="col-6 col-md-2"><label className="form-label">Tarif (TND/h)</label><input className="form-control" type="number" min="0" value={form.tarif_horaire} onChange={set("tarif_horaire")} /></div>
            <div className="col-6 col-md-2"><label className="form-label">Couleur</label><input className="form-control form-control-color w-100" type="color" value={form.color_tag} onChange={set("color_tag")} /></div>
            <div className="col-6 col-md-2 d-grid"><button className="btn btn-primary"><i className="bi bi-plus-lg me-1" />Ajouter</button></div>
          </div>
        </div>
      </form>

      <div className="card"><div className="card-body p-0"><div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead><tr><th className="ps-3">Nom</th><th>Capacité</th><th>Tarif</th><th>Statut</th><th className="pe-3"></th></tr></thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r._id} style={{ opacity: r.is_active ? 1 : 0.55 }}>
                <td className="ps-3"><span className="dot me-2" style={{ background: r.color_tag, display: "inline-block" }} /><strong>{r.name}</strong></td>
                <td>{r.capacity}</td>
                <td>{formatTND(r.tarif_horaire)}/h</td>
                <td>{r.is_active ? <span className="badge rounded-pill dotted text-bg-success">Active</span> : <span className="badge rounded-pill dotted text-bg-secondary">Inactive</span>}</td>
                <td className="pe-3">
                  <div className="d-flex gap-2">
                    <button className="btn btn-light btn-sm" onClick={() => rename(r)}><i className="bi bi-pencil me-1" />Renommer</button>
                    <button className={`btn btn-sm ${r.is_active ? "btn-outline-danger" : "btn-success"}`} onClick={() => toggleActive(r)}>
                      {r.is_active ? "Désactiver" : "Réactiver"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div></div>
    </>
  );
}

/* ---------------- Staff ---------------- */
function StaffTab() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "staff" });
  const [error, setError] = useState("");
  const load = () => getUsers().then(setUsers).catch(() => setUsers([]));
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function add(e) {
    e.preventDefault(); setError("");
    try { await createUser(form); setForm({ name: "", email: "", password: "", role: "staff" }); load(); }
    catch (err) { setError(apiError(err)); }
  }
  async function resetPwd(u) {
    const password = window.prompt(`Nouveau mot de passe pour ${u.name} (min 6 caractères) :`);
    if (password && password.length >= 6) { await updateUser(u._id, { password }); window.alert("Mot de passe réinitialisé."); }
  }
  async function toggle(u) {
    try { u.is_active ? await deactivateUser(u._id) : await updateUser(u._id, { is_active: true }); load(); }
    catch (err) { setError(apiError(err)); }
  }

  return (
    <>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <form className="card mb-3" onSubmit={add}>
        <div className="card-body">
          <div className="section-label mb-3">Ajouter un compte</div>
          <div className="row g-3 align-items-end">
            <div className="col-md-3"><label className="form-label">Nom</label><input className="form-control" required value={form.name} onChange={set("name")} /></div>
            <div className="col-md-3"><label className="form-label">Email</label><input className="form-control" type="email" required value={form.email} onChange={set("email")} /></div>
            <div className="col-md-3"><label className="form-label">Mot de passe</label><input className="form-control" type="text" required minLength={6} value={form.password} onChange={set("password")} /></div>
            <div className="col-6 col-md-2"><label className="form-label">Rôle</label><select className="form-select" value={form.role} onChange={set("role")}><option value="staff">Staff</option><option value="admin">Admin</option></select></div>
            <div className="col-6 col-md-1 d-grid"><button className="btn btn-primary"><i className="bi bi-plus-lg" /></button></div>
          </div>
        </div>
      </form>

      <div className="card"><div className="card-body p-0"><div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead><tr><th className="ps-3">Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th className="pe-3"></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} style={{ opacity: u.is_active ? 1 : 0.55 }}>
                <td className="ps-3 fw-semibold">{u.name}</td>
                <td>{u.email}</td>
                <td><span className={`badge rounded-pill ${u.role === "admin" ? "text-bg-primary" : "text-bg-light border"}`}>{u.role}</span></td>
                <td>{u.is_active ? <span className="badge rounded-pill dotted text-bg-success">Actif</span> : <span className="badge rounded-pill dotted text-bg-secondary">Inactif</span>}</td>
                <td className="pe-3">
                  <div className="d-flex gap-2">
                    <button className="btn btn-light btn-sm" onClick={() => resetPwd(u)}><i className="bi bi-key me-1" />MDP</button>
                    <button className={`btn btn-sm ${u.is_active ? "btn-outline-danger" : "btn-success"}`} onClick={() => toggle(u)}>
                      {u.is_active ? "Désactiver" : "Réactiver"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div></div>
    </>
  );
}

/* ---------------- Tarifs ---------------- */
function TarifsTab() {
  const [rooms, setRooms] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState("");
  const load = () => getRooms(true).then((rs) => {
    setRooms(rs);
    setDrafts(Object.fromEntries(rs.map((r) => [r._id, r.tarif_horaire])));
  }).catch(() => setRooms([]));
  useEffect(() => { load(); }, []);

  async function save(r) {
    setError("");
    try { await updateRoom(r._id, { tarif_horaire: Number(drafts[r._id]) }); load(); }
    catch (err) { setError(apiError(err)); }
  }

  return (
    <>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      <div className="alert alert-info py-2"><i className="bi bi-info-circle me-1" />Le tarif est figé sur chaque réservation à sa création — modifier ici n'affecte que les futures réservations.</div>
      <div className="card"><div className="card-body p-0"><div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead><tr><th className="ps-3">Salle</th><th>Tarif horaire (TND)</th><th className="pe-3"></th></tr></thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r._id}>
                <td className="ps-3"><span className="dot me-2" style={{ background: r.color_tag, display: "inline-block" }} /><strong>{r.name}</strong></td>
                <td><input className="form-control" style={{ maxWidth: 160 }} type="number" min="0" step="0.5" value={drafts[r._id] ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [r._id]: e.target.value }))} /></td>
                <td className="pe-3"><button className="btn btn-primary btn-sm" disabled={Number(drafts[r._id]) === r.tarif_horaire} onClick={() => save(r)}><i className="bi bi-check-lg me-1" />Enregistrer</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div></div>
    </>
  );
}
