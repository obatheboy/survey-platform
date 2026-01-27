import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import api from "./api/api";

/* ================= USER PAGES ================= */
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Surveys from "./pages/Surveys";
import Activate from "./pages/Activate";
import ActivationNotice from "./pages/ActivationNotice";
import Withdraw from "./pages/Withdraw";
import FAQ from "./pages/FAQ";
import TermsAndConditions from "./pages/TermsAndConditions";
import NotFound from "./pages/NotFound";

/* ================= ADMIN ================= */
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminActivations from "./pages/admin/AdminActivations";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminUsers from "./pages/admin/AdminUsers";

/* ================= COMPONENTS ================= */
import PWAInstallPrompt from "./components/PWAInstallPrompt";

/* ================= USER AUTH GUARD ================= */
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

/* ================= ADMIN AUTH GUARD ================= */
function AdminRoute({ children }) {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

/* ================= ROUTER ================= */
export default function App() {
  /* ===============================
     🔥 GLOBAL BACKEND WAKE (ONCE)
  ================================ */
  useEffect(() => {
    const wakeBackend = async () => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 8000);

      try {
        await api.get("/health", {
          signal: controller.signal,
        });
      } catch {
        // Silent: Render is waking up
      }
    };

    wakeBackend();
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
      <PWAInstallPrompt />
      <Routes>
        {/* ENTRY */}
        <Route path="/" element={<Navigate to="/auth?mode=register" replace />} />

        {/* USER AUTH */}
        <Route path="/auth" element={<Auth />} />

        {/* TERMS AND CONDITIONS */}
        <Route path="/terms" element={<TermsAndConditions />} />

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

        {/* FAQ */}
        <Route path="/faq" element={<FAQ />} />

        {/* ADMIN */}
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

        {/* FALLBACK - 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}