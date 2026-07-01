import { useEffect, useState } from "react";
import { getRooms, createRoom, updateRoom, deleteRoom, hardDeleteRoom } from "../api/rooms.api.js";
import { getUsers, createUser, updateUser, deactivateUser, deleteUser } from "../api/users.api.js";
import { apiError } from "../api/axiosInstance.js";
import { useToast } from "../context/ToastContext.jsx";
import PromptModal from "../components/PromptModal.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import Modal from "../components/Modal.jsx";
import { formatTND } from "../utils/format.js";
import { AMENITIES, amenityIcon } from "../utils/amenities.js";

const ROOM_COLORS = [
  "#4f46e5", "#0ea5e9", "#22c55e", "#f59e0b",
  "#ef4444", "#8b5cf6", "#f97316",
  "#ec4899","#14b8a6",
];

function SwatchPicker({ value, onChange }) {
  return (
    <div className="swatch-row">
      {ROOM_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className={`swatch-btn${value === c ? " selected" : ""}`}
          style={{ background: c }}
          onClick={() => onChange(c)}
          title={c}
        />
      ))}
    </div>
  );
}

function AmenityPicker({ value = [], onChange }) {
  const toggle = (k) => onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  return (
    <div className="amenity-row">
      {AMENITIES.map((a) => (
        <button
          key={a.key}
          type="button"
          className={`amenity-chip${value.includes(a.key) ? " selected" : ""}`}
          onClick={() => toggle(a.key)}
        >
          <i className={`bi ${a.icon}`} /> {a.key}
        </button>
      ))}
    </div>
  );
}

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
      {tab === "rooms"  && <RoomsTab />}
      {tab === "staff"  && <StaffTab />}
      {tab === "tarifs" && <TarifsTab />}
    </div>
  );
}

/* ---------------- Rooms ---------------- */
function RoomsTab() {
  const { addToast } = useToast();
  const [rooms, setRooms] = useState([]);
  const [form, setForm]   = useState({ name: "", capacity: 4, tarif_horaire: 10, color_tag: "#4f46e5", description: "", amenities: [] });
  const [renameCtx, setRenameCtx]     = useState(null);
  const [deactivateCtx, setDeactivateCtx] = useState(null);
  const [reactivateCtx, setReactivateCtx] = useState(null);
  const [deleteCtx, setDeleteCtx] = useState(null);
  const [amenCtx, setAmenCtx] = useState(null);
  const [amenDraft, setAmenDraft] = useState([]);

  const load = () => getRooms(true).then(setRooms).catch(() => setRooms([]));
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function add(e) {
    e.preventDefault();
    try {
      await createRoom({ ...form, capacity: Number(form.capacity), tarif_horaire: Number(form.tarif_horaire) });
      setForm({ name: "", capacity: 4, tarif_horaire: 10, color_tag: "#4f46e5", description: "", amenities: [] });
      load();
      addToast("success", "Salle ajoutée.");
    } catch (err) { addToast("error", apiError(err)); }
  }

  function openAmen(r) { setAmenDraft(r.amenities || []); setAmenCtx(r); }
  async function doSaveAmen() {
    try { await updateRoom(amenCtx._id, { amenities: amenDraft }); setAmenCtx(null); load(); addToast("success", "Équipements mis à jour."); }
    catch (err) { addToast("error", apiError(err)); }
  }

  async function doDelete(r) {
    try { await hardDeleteRoom(r._id); load(); addToast("success", "Salle supprimée définitivement."); }
    catch (err) { addToast("error", apiError(err)); }
  }

  async function doToggleActive(r, active) {
    try {
      if (active) await updateRoom(r._id, { is_active: true });
      else await deleteRoom(r._id);
      load();
      addToast("success", active ? "Salle réactivée." : "Salle désactivée.");
    } catch (err) { addToast("error", apiError(err)); }
  }

  async function doRename(name) {
    try { await updateRoom(renameCtx._id, { name }); load(); addToast("success", "Salle renommée."); }
    catch (err) { addToast("error", apiError(err)); }
  }

  return (
    <>
      <form className="card mb-3" onSubmit={add}>
        <div className="card-body">
          <div className="section-label mb-3">Ajouter une salle</div>
          <div className="row g-3 align-items-end">
            <div className="col-md-4"><label className="form-label">Nom</label><input className="form-control" required value={form.name} onChange={set("name")} /></div>
            <div className="col-6 col-md-2"><label className="form-label">Capacité</label><input className="form-control" type="number" min="1" value={form.capacity} onChange={set("capacity")} /></div>
            <div className="col-6 col-md-2"><label className="form-label">Tarif (TND/h)</label><input className="form-control" type="number" min="0" value={form.tarif_horaire} onChange={set("tarif_horaire")} /></div>
            <div className="col-md-4">
              <label className="form-label">Couleur</label>
              <SwatchPicker value={form.color_tag} onChange={(c) => setForm((f) => ({ ...f, color_tag: c }))} />
            </div>
            <div className="col-12">
              <label className="form-label">Équipements</label>
              <AmenityPicker value={form.amenities} onChange={(a) => setForm((f) => ({ ...f, amenities: a }))} />
            </div>
            <div className="col-md-3 d-grid"><button className="btn btn-primary"><i className="bi bi-plus-lg me-1" />Ajouter la salle</button></div>
          </div>
        </div>
      </form>

      <div className="card"><div className="card-body p-0"><div className="table-responsive">
        <table className="table table-hover align-middle mb-0 cards-md">
          <thead><tr><th className="ps-3">Nom</th><th>Capacité</th><th>Tarif</th><th>Statut</th><th className="pe-3"></th></tr></thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r._id} style={{ opacity: r.is_active ? 1 : 0.55 }}>
                <td className="ps-3" data-card-title>
                  <span className="dot me-2" style={{ background: r.color_tag, display: "inline-block" }} /><strong>{r.name}</strong>
                  {r.amenities?.length > 0 && (
                    <div className="amenity-tags-mini">
                      {r.amenities.map((a) => <span key={a} className="amenity-tag" title={a}><i className={`bi ${amenityIcon(a)}`} />{a}</span>)}
                    </div>
                  )}
                </td>
                <td data-label="Capacité">{r.capacity}</td>
                <td data-label="Tarif">{formatTND(r.tarif_horaire)}/h</td>
                <td data-label="Statut">{r.is_active ? <span className="badge rounded-pill dotted text-bg-success">Active</span> : <span className="badge rounded-pill dotted text-bg-secondary">Inactive</span>}</td>
                <td className="pe-3 cards-actions">
                  <div className="d-flex gap-2">
                    <button className="btn btn-light btn-sm" onClick={() => setRenameCtx(r)}><i className="bi bi-pencil me-1" />Renommer</button>
                    <button className="btn btn-light btn-sm" onClick={() => openAmen(r)}><i className="bi bi-tools me-1" />Équipements</button>
                    {r.is_active
                      ? <button className="btn btn-outline-danger btn-sm" onClick={() => setDeactivateCtx(r)}>Désactiver</button>
                      : <button className="btn btn-success btn-sm" onClick={() => setReactivateCtx(r)}>Réactiver</button>}
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteCtx(r)} title="Supprimer définitivement"><i className="bi bi-trash me-1" />Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div></div>

      <PromptModal open={Boolean(renameCtx)} title="Renommer la salle" label="Nouveau nom *"
        initialValue={renameCtx?.name || ""}
        onConfirm={doRename} onClose={() => setRenameCtx(null)} />

      <ConfirmModal open={Boolean(deactivateCtx)} title="Désactiver la salle"
        message={`Désactiver ${deactivateCtx?.name} ? Elle n'apparaîtra plus dans les nouvelles réservations.`}
        confirmLabel="Désactiver" variant="danger"
        onConfirm={() => doToggleActive(deactivateCtx, false)} onClose={() => setDeactivateCtx(null)} />

      <ConfirmModal open={Boolean(reactivateCtx)} title="Réactiver la salle"
        message={`Réactiver ${reactivateCtx?.name} ?`}
        confirmLabel="Réactiver" variant="success"
        onConfirm={() => doToggleActive(reactivateCtx, true)} onClose={() => setReactivateCtx(null)} />

      <ConfirmModal open={Boolean(deleteCtx)} title="Supprimer la salle"
        message={`Supprimer définitivement « ${deleteCtx?.name} » ? Cette action est irréversible. (Impossible si des réservations utilisent cette salle — désactivez-la plutôt.)`}
        confirmLabel="Supprimer" variant="danger"
        onConfirm={() => doDelete(deleteCtx)} onClose={() => setDeleteCtx(null)} />

      <Modal open={Boolean(amenCtx)} onClose={() => setAmenCtx(null)} title={`Équipements — ${amenCtx?.name || ""}`} maxWidth={460}
        footer={(
          <>
            <button className="btn btn-primary" onClick={doSaveAmen}><i className="bi bi-check-lg me-1" />Enregistrer</button>
            <button className="btn btn-light" onClick={() => setAmenCtx(null)}>Annuler</button>
          </>
        )}>
        <div className="section-label mb-2">Sélectionnez les équipements disponibles</div>
        <AmenityPicker value={amenDraft} onChange={setAmenDraft} />
      </Modal>
    </>
  );
}

/* ---------------- Staff ---------------- */
function StaffTab() {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [form, setForm]   = useState({ name: "", email: "", password: "", role: "staff" });
  const [pwdCtx, setPwdCtx]           = useState(null);
  const [deactivateCtx, setDeactivateCtx] = useState(null);
  const [reactivateCtx, setReactivateCtx] = useState(null);
  const [deleteCtx, setDeleteCtx] = useState(null);

  const load = () => getUsers().then(setUsers).catch(() => setUsers([]));
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function add(e) {
    e.preventDefault();
    try { await createUser(form); setForm({ name: "", email: "", password: "", role: "staff" }); load(); addToast("success", "Compte créé."); }
    catch (err) { addToast("error", apiError(err)); }
  }

  async function doResetPwd(password) {
    try { await updateUser(pwdCtx._id, { password }); addToast("success", "Mot de passe réinitialisé."); }
    catch (err) { addToast("error", apiError(err)); }
  }

  async function doToggle(u, activate) {
    try {
      activate ? await updateUser(u._id, { is_active: true }) : await deactivateUser(u._id);
      load();
      addToast("success", activate ? "Compte réactivé." : "Compte désactivé.");
    } catch (err) { addToast("error", apiError(err)); }
  }

  async function doDelete(u) {
    try { await deleteUser(u._id); load(); addToast("success", "Compte supprimé définitivement."); }
    catch (err) { addToast("error", apiError(err)); }
  }

  return (
    <>
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
        <table className="table table-hover align-middle mb-0 cards-md">
          <thead><tr><th className="ps-3">Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th className="pe-3"></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} style={{ opacity: u.is_active ? 1 : 0.55 }}>
                <td className="ps-3 fw-semibold" data-card-title>{u.name}</td>
                <td data-label="Email">{u.email}</td>
                <td data-label="Rôle"><span className={`badge rounded-pill ${u.role === "admin" ? "text-bg-primary" : "text-bg-light border"}`}>{u.role}</span></td>
                <td data-label="Statut">{u.is_active ? <span className="badge rounded-pill dotted text-bg-success">Actif</span> : <span className="badge rounded-pill dotted text-bg-secondary">Inactif</span>}</td>
                <td className="pe-3 cards-actions">
                  <div className="d-flex gap-2">
                    <button className="btn btn-light btn-sm" onClick={() => setPwdCtx(u)}><i className="bi bi-key me-1" />MDP</button>
                    {u.is_active
                      ? <button className="btn btn-outline-danger btn-sm" onClick={() => setDeactivateCtx(u)}>Désactiver</button>
                      : <button className="btn btn-success btn-sm" onClick={() => setReactivateCtx(u)}>Réactiver</button>}
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteCtx(u)} title="Supprimer définitivement"><i className="bi bi-trash me-1" />Supprimer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div></div>

      <PromptModal open={Boolean(pwdCtx)} title={`Réinitialiser le MDP — ${pwdCtx?.name}`}
        label="Nouveau mot de passe *" type="text" minLength={6}
        placeholder="Min. 6 caractères"
        onConfirm={doResetPwd} onClose={() => setPwdCtx(null)} />

      <ConfirmModal open={Boolean(deactivateCtx)} title="Désactiver le compte"
        message={`Désactiver le compte de ${deactivateCtx?.name} (${deactivateCtx?.email}) ?`}
        confirmLabel="Désactiver" variant="danger"
        onConfirm={() => doToggle(deactivateCtx, false)} onClose={() => setDeactivateCtx(null)} />

      <ConfirmModal open={Boolean(reactivateCtx)} title="Réactiver le compte"
        message={`Réactiver le compte de ${reactivateCtx?.name} ?`}
        confirmLabel="Réactiver" variant="success"
        onConfirm={() => doToggle(reactivateCtx, true)} onClose={() => setReactivateCtx(null)} />

      <ConfirmModal open={Boolean(deleteCtx)} title="Supprimer le compte"
        message={`Supprimer définitivement le compte de ${deleteCtx?.name} (${deleteCtx?.email}) ? Cette action est irréversible. L'historique du journal d'audit est conservé.`}
        confirmLabel="Supprimer" variant="danger"
        onConfirm={() => doDelete(deleteCtx)} onClose={() => setDeleteCtx(null)} />
    </>
  );
}

/* ---------------- Tarifs ---------------- */
function TarifsTab() {
  const { addToast } = useToast();
  const [rooms, setRooms]   = useState([]);
  const [drafts, setDrafts] = useState({});

  const load = () => getRooms(true).then((rs) => {
    setRooms(rs);
    setDrafts(Object.fromEntries(rs.map((r) => [r._id, r.tarif_horaire])));
  }).catch(() => setRooms([]));
  useEffect(() => { load(); }, []);

  async function save(r) {
    try { await updateRoom(r._id, { tarif_horaire: Number(drafts[r._id]) }); load(); addToast("success", "Tarif mis à jour."); }
    catch (err) { addToast("error", apiError(err)); }
  }

  return (
    <>
      <div className="alert alert-info py-2"><i className="bi bi-info-circle me-1" />Le tarif est figé sur chaque réservation à sa création — modifier ici n'affecte que les futures réservations.</div>
      <div className="card"><div className="card-body p-0"><div className="table-responsive">
        <table className="table table-hover align-middle mb-0 cards-md">
          <thead><tr><th className="ps-3">Salle</th><th>Tarif horaire (TND)</th><th className="pe-3"></th></tr></thead>
          <tbody>
            {rooms.map((r) => (
              <tr key={r._id}>
                <td className="ps-3" data-card-title><span className="dot me-2" style={{ background: r.color_tag, display: "inline-block" }} /><strong>{r.name}</strong></td>
                <td data-label="Tarif (TND)"><input className="form-control" style={{ maxWidth: 160 }} type="number" min="0" step="0.5" value={drafts[r._id] ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [r._id]: e.target.value }))} /></td>
                <td className="pe-3 cards-actions"><button className="btn btn-primary btn-sm" disabled={Number(drafts[r._id]) === r.tarif_horaire} onClick={() => save(r)}><i className="bi bi-check-lg me-1" />Enregistrer</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div></div>
    </>
  );
}
