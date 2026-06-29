import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth.js";
import { apiError } from "../api/axiosInstance.js";

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
      setError(apiError(err, "Connexion impossible."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-wrap">
      <motion.form className="login-card" onSubmit={onSubmit}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}>
        <div className="login-logo"><span className="app-brand-mark" style={{ width: 42, height: 42 }}>5G</span> 5G Space</div>
        <div className="login-sub">Gestion des espaces · Bizerte</div>

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
      </motion.form>
    </div>
  );
}
