import { AnimatePresence, m } from "framer-motion";
import { modalSpring } from "../utils/motion.js";

export default function ConfirmModal({ open, title, message, confirmLabel = "Confirmer", variant = "danger", onConfirm, onClose }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <m.div className="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <m.div className="ov-card" style={{ maxWidth: 420 }} variants={modalSpring} initial="initial" animate="animate" exit="exit">
          <div className="ov-head">
            <h2>{title}</h2>
            <button type="button" className="ov-x" onClick={onClose}>×</button>
          </div>
          <div className="ov-body">
            <p className="mb-0" style={{ color: "var(--muted)" }}>{message}</p>
          </div>
          <div className="ov-foot">
            <button className="btn btn-light" onClick={onClose}>Annuler</button>
            <button className={`btn btn-${variant}`} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
          </div>
        </m.div>
      </m.div>
    </AnimatePresence>
  );
}
