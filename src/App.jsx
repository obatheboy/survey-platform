import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./api/api";

/* ================= USER PAGES ================= */
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Surveys from "./pages/Surveys";
import Activate from "./pages/Activate";
import ActivationNotice from "./pages/ActivationNotice";
import Withdraw from "./pages/Withdraw";

/* ================= ADMIN ================= */
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminActivations from "./pages/admin/AdminActivations";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminUsers from "./pages/admin/AdminUsers";

/* =====================================================
   🔐 USER AUTH GUARD (COOKIE BASED)
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
   🔐 ADMIN GUARD (TOKEN BASED)
===================================================== */
function AdminRoute({ children }) {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

/* =====================================================
   🚦 ROUTER
===================================================== */
export default function App() {
  // Wake backend (Render)
  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL, {
      credentials: "include",
    }).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* ENTRY */}
        <Route path="/" element={<Navigate to="/auth?mode=register" replace />} />

        {/* USER AUTH */}
        <Route path="/auth" element={<Auth />} />

        {/* USER APP */}
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

        {/* ================= ADMIN ================= */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="activations" replace />} />
          <Route path="activations" element={<AdminActivations />} />
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
