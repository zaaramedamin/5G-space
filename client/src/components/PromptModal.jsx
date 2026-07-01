import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { modalSpring } from "../utils/motion.js";

export default function PromptModal({
  open, title, label, placeholder = "", type = "text",
  initialValue = "", minLength = 1, confirmLabel = "Confirmer",
  onConfirm, onClose,
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  function submit(e) {
    e.preventDefault();
    const v = type === "number" ? value : value.trim();
    if (type !== "number" && v.length < minLength) return;
    onConfirm(v);
    onClose();
  }

  const valid = type === "number" ? value !== "" : value.trim().length >= minLength;

  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div className="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <motion.form className="ov-card" style={{ maxWidth: 440 }} variants={modalSpring}
          initial="initial" animate="animate" exit="exit" onSubmit={submit}>
          <div className="ov-head">
            <h2>{title}</h2>
            <button type="button" className="ov-x" onClick={onClose}>×</button>
          </div>
          <div className="ov-body">
            <label className="form-label fw-semibold">{label}</label>
            <input
              autoFocus
              className="form-control"
              type={type}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              min={type === "number" ? 0 : undefined}
              step={type === "number" ? "0.5" : undefined}
            />
          </div>
          <div className="ov-foot">
            <button type="button" className="btn btn-light" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={!valid}>{confirmLabel}</button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}
