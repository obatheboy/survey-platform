import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./api/api";

/* ================= PAGES ================= */
import Auth from "./pages/Auth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Surveys from "./pages/Surveys.jsx";
import Activate from "./pages/Activate.jsx";
import ActivationNotice from "./pages/ActivationNotice.jsx";
import Withdraw from "./pages/Withdraw.jsx";

/* ================= ADMIN ================= */
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminActivations from "./pages/admin/AdminActivations.jsx";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";

/* =====================================================
   🔐 GLOBAL AUTH GUARD (COOKIE BASED — USERS ONLY)
===================================================== */
function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: 80 }}>Loading…</p>;
  }

  if (!user) {
    return <Navigate to="/auth?mode=register" replace />;
  }

  return children;
}

/* =====================================================
   🚦 ROUTER
===================================================== */
export default function App() {
  // 🔥 AUTO-WAKE RENDER
  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* ENTRY */}
        <Route path="/" element={<Navigate to="/auth?mode=register" replace />} />

        {/* AUTH */}
        <Route path="/auth" element={<Auth />} />

        {/* ================= ADMIN LOGIN (PUBLIC) ================= */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* ================= USER ================= */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/surveys"
          element={
            <ProtectedRoute>
              <Surveys />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activation-notice"
          element={
            <ProtectedRoute>
              <ActivationNotice />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activate"
          element={
            <ProtectedRoute>
              <Activate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/withdraw"
          element={
            <ProtectedRoute>
              <Withdraw />
            </ProtectedRoute>
          }
        />

        {/* ================= ADMIN (JWT PROTECTED INSIDE LAYOUT) ================= */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="activations" replace />} />
          <Route path="activations" element={<AdminActivations />} />
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/auth?mode=register" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
