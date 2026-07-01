import { useState, useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useOutlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "./hooks/useAuth.js";
import { pageVariants } from "./utils/motion.js";
import { ToastProvider } from "./context/ToastContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import TopBar from "./components/TopBar.jsx";
import ToastStack from "./components/ToastStack.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Calendar from "./pages/Calendar.jsx";
import Reservations from "./pages/Reservations.jsx";
import Clients from "./pages/Clients.jsx";
import AuditLog from "./pages/AuditLog.jsx";
import Settings from "./pages/Settings.jsx";
import Reports from "./pages/Reports.jsx";

function FullPageMessage({ children }) {
  return <div className="center-msg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>;
}

function Protected({ adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <FullPageMessage>Chargement…</FullPageMessage>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}

function Layout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar_collapsed") === "1");
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const outlet = useOutlet();

  // On phones the toggle opens a slide-in drawer; on desktop it collapses to icons.
  const toggle = () => {
    if (window.innerWidth <= 768) setMobileOpen((o) => !o);
    else setCollapsed((c) => { localStorage.setItem("sidebar_collapsed", c ? "0" : "1"); return !c; });
  };

  // Close the mobile drawer whenever the route changes.
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      <div className={`app-backdrop ${mobileOpen ? "show" : ""}`} onClick={() => setMobileOpen(false)} />
      <div className={`app-main ${collapsed ? "collapsed" : ""}`}>
        <TopBar onToggle={toggle} collapsed={collapsed} />
        <AnimatePresence mode="wait">
          <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
            {outlet}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ToastStack />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route element={<Protected adminOnly />}>
            <Route path="/reports" element={<Reports />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/audit" element={<AuditLog />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ToastProvider>
  );
}
