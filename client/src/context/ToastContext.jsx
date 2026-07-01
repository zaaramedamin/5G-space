import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const addToast = useCallback((type, message) => {
    const id = ++counter.current;
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const remove = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  return <ToastCtx.Provider value={{ toasts, addToast, remove }}>{children}</ToastCtx.Provider>;
}

export const useToast = () => useContext(ToastCtx);
