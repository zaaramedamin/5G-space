import { AnimatePresence, m } from "framer-motion";
import { modalSpring } from "../utils/motion.js";

// Animated overlay modal. `footer` is optional; pass null to omit.
export default function Modal({ open, onClose, title, children, footer, maxWidth = 660 }) {
  return (
    <AnimatePresence>
      {open && (
        <m.div className="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <m.div className="ov-card" style={{ maxWidth }} variants={modalSpring} initial="initial" animate="animate" exit="exit">
            <div className="ov-head">
              <h2>{title}</h2>
              <button type="button" className="ov-x" onClick={onClose} aria-label="Fermer">×</button>
            </div>
            <div className="ov-body">{children}</div>
            {footer && <div className="ov-foot">{footer}</div>}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
