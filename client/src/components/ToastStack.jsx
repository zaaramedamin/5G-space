import { AnimatePresence, m } from "framer-motion";
import { useToast } from "../context/ToastContext.jsx";

const META = {
  success: { icon: "bi-check-circle-fill", color: "#22c55e" },
  error:   { icon: "bi-exclamation-circle-fill", color: "#ef4444" },
  warning: { icon: "bi-exclamation-triangle-fill", color: "#f59e0b" },
  info:    { icon: "bi-info-circle-fill", color: "#3b82f6" },
};

export default function ToastStack() {
  const { toasts, remove } = useToast();

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
      <AnimatePresence>
        {toasts.map((t) => {
          const meta = META[t.type] || META.info;
          return (
            <m.div key={t.id}
              initial={{ opacity: 0, x: 70, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 70, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              style={{
                pointerEvents: "auto", background: "#fff", borderRadius: 14,
                padding: "13px 16px", boxShadow: "0 8px 28px rgba(16,24,40,.14)",
                display: "flex", alignItems: "center", gap: 11,
                minWidth: 260, maxWidth: 380,
                borderLeft: `4px solid ${meta.color}`,
              }}>
              <i className={`bi ${meta.icon}`} style={{ color: meta.color, fontSize: 19, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, color: "#1e293b", lineHeight: 1.4 }}>{t.message}</span>
              <button onClick={() => remove(t.id)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 18, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
            </m.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
