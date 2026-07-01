import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { m } from "framer-motion";
import { useAuth } from "../hooks/useAuth.js";


export default function Login() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      if (!err.response && (err.code === "ERR_NETWORK" || err.code === "ECONNREFUSED" || !navigator.onLine)) {
        setError("Impossible de joindre le serveur. Vérifiez votre connexion Wi-Fi ou contactez l'administrateur.");
      } else if (status === 401) {
        setError("Email ou mot de passe incorrect. Vérifiez vos identifiants.");
      } else if (status === 403) {
        setError("Votre compte est désactivé. Contactez l'administrateur.");
      } else if (status === 422) {
        setError("Email invalide ou mot de passe manquant.");
      } else if (status >= 500) {
        setError("Le serveur rencontre un problème. Réessayez dans quelques instants.");
      } else {
        setError(serverMsg || "Connexion impossible. Réessayez.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-wrap">
      <m.form className="login-card" onSubmit={onSubmit}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}>
        <div className="login-logo">
          <img src="/logo-5gspace.png" alt="5G Space" className="login-logo-img" />
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <div className="mb-3">
          <label className="form-label">Email</label>
          <div className="input-group">
            <span className="input-group-text"><i className="bi bi-envelope" /></span>
            <input className="form-control" type="email" autoComplete="username" value={email}
              onChange={(e) => setEmail(e.target.value)} required autoFocus placeholder="vous@5gspace.tn" />
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Mot de passe</label>
          <div className="input-group">
            <span className="input-group-text"><i className="bi bi-lock" /></span>
            <input className="form-control" type="password" autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
        </div>

        <button className="btn btn-primary w-100 mt-2 d-flex align-items-center justify-content-center gap-2" disabled={submitting}>
          {submitting ? <><span className="spinner-border spinner-border-sm" /> Connexion…</> : <><i className="bi bi-box-arrow-in-right" /> Se connecter</>}
        </button>
      </m.form>
    </div>
  );
}
