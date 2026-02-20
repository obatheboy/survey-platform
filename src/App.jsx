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
import WithdrawForm from "./pages/WithdrawForm"; // Add this import
import WithdrawSuccess from "./pages/WithdrawSuccess"; // Add this import
import FAQ from "./pages/FAQ";
import TermsAndConditions from "./pages/TermsAndConditions";
import NotFound from "./pages/NotFound";
import AffiliateDashboard from "./pages/AffiliateDashboard";

/* ================= ADMIN ================= */
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminActivations from "./pages/admin/AdminActivations";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAffiliates from "./pages/admin/AdminAffiliates";
import AdminAffiliateWithdrawals from "./pages/admin/AdminAffiliateWithdrawals";

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

        {/* OLD WITHDRAW PAGE - You might want to keep or remove this */}
        <Route
          path="/withdraw"
          element={
            <ProtectedRoute>
              <Withdraw />
            </ProtectedRoute>
          }
        />

        {/* NEW WITHDRAW PAGES - Add these routes */}
        <Route
          path="/withdraw-form"
          element={
            <ProtectedRoute>
              <WithdrawForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/withdraw-success"
          element={
            <ProtectedRoute>
              <WithdrawSuccess />
            </ProtectedRoute>
          }
        />

        {/* FAQ */}
        <Route path="/faq" element={<FAQ />} />

        {/* Affiliate Dashboard */}
        <Route
          path="/affiliate"
          element={
            <ProtectedRoute>
              <AffiliateDashboard />
            </ProtectedRoute>
          }
        />

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
          <Route index element={<AdminDashboard />} />
          <Route path="activations" element={<AdminActivations />} />
          <Route path="withdrawals" element={<AdminWithdrawals />} />
          <Route path="affiliates" element={<AdminAffiliates />} />
          <Route path="affiliate-withdrawals" element={<AdminAffiliateWithdrawals />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="notifications" element={<AdminNotifications />} />
        </Route>

        {/* FALLBACK - 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}