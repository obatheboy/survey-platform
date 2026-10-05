import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import api from "./api/api";
import { initCacheBusting } from "./utils/cache";

/* ================= USER PAGES ================= */
  import Auth from "./pages/Auth";
  import Dashboard from "./pages/Dashboard";
import Surveys from "./pages/Surveys";
import Activate from "./pages/Activate";
import ActivationNotice from "./pages/ActivationNotice";
import Withdraw from "./pages/Withdraw";
import WithdrawForm from "./pages/WithdrawForm";
import WithdrawSuccess from "./pages/WithdrawSuccess";
import FAQ from "./pages/FAQ";
import TermsAndConditions from "./pages/TermsAndConditions";
import NotFound from "./pages/NotFound";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import SurveyTake from "./pages/SurveyTake";
import OnboardingSurvey from "./pages/OnboardingSurvey";
import ChatWazunguDashboard from "./pages/ChatWazunguDashboard";
import MultiFunctionDashboard from "./pages/MultiFunctionDashboard";
import LandingBanner from "./pages/LandingBanner";
import WorkTaskHub from "./pages/WorkTaskHub";
import WorkTaskList from "./pages/WorkTaskList";
import WorkTaskSubmit from "./pages/WorkTaskSubmit";
import WorkSubmissions from "./pages/WorkSubmissions";

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
import AdminLoginFee from "./pages/admin/AdminLoginFee";

/* ================= USER AUTH GUARD ================= */
/* hasPaidActivationFee mirrors backend/src/utils/activationStatus.js
   hasPaidActivationFee(). The derived is_activated / account_activated
   flags are recomputed server-side on every /auth/me call, so they are
   safe to trust here. */
function hasPaidActivationFee(user) {
  if (!user) return false;
  if (sessionStorage.getItem("justActivated") === "1") {
    sessionStorage.removeItem("justActivated");
    return true;
  }
  return (
    user.is_activated === true ||
    user.account_activated === true ||
    user.all_plans_completed === true ||
    user.welcome_bonus_paid === true ||
    user.regular_paid === true ||
    user.plans_paid?.WELCOME_BONUS === true ||
    user.plans_paid?.REGULAR === true ||
    user.plans_paid?.VIP === true ||
    user.plans_paid?.VVIP === true
  );
}

/* requireActivation gates the app behind the one-time activation fee.
   Pages that must stay reachable while UNPAID must opt out, otherwise the
   redirect to /activate loops forever. */
function ProtectedRoute({ children, requireActivation = true }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    api
      .get("/auth/me")
      .then((res) => {
        if (!isMounted) return;
        const userData = res.data;
        setUser(userData);
      })
      .catch((err) => {
        console.error("Auth check failed:", err);
        setUser(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [navigate]);

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: 80 }}>Loading…</p>;
  }

  if (!user) {
    return <Navigate to="/auth?mode=register" replace />;
  }

  // The activation fee is a one-time gate to the dashboard. Unpaid users
  // are sent to the payment page, which STK-pushes the fee and then
  // redirects them into the app once MegaPay confirms it.
  // TEMPORARILY DISABLED - activation fee gateway removed.
  // The KES 98 activation fee (paid via /activate) is still fully wired
  // up - payment page, backend routes, controllers, and constants are
  // untouched. To re-enable, restore the line below and remove this
  // comment block.
  //
  // if (requireActivation && !hasPaidActivationFee(user)) {
  //   return <Navigate to="/activate" replace />;
  // }
  if (requireActivation && !hasPaidActivationFee(user)) {
    return <Navigate to="/activate" replace />;
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

/* ================= AUTH REDIRECT ================= */
function AuthRedirect() {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const ref = searchParams.get("ref");

  // ✅ FIX: Allow rendering Auth when ref is present (referral link), even without mode
  if (mode === "login" || mode === "register" || ref) {
    return <Auth />;
  }

  return <Navigate to="/" replace />;
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

  /* ===============================
     🔄 CACHE BUSTING ON APP START
  ================================ */
  useEffect(() => {
    initCacheBusting(() => {
      console.log('[App] Version mismatch - app data cleared');
    });
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* ENTRY — earning banner. Every visitor lands here first;
            tapping anywhere goes to /auth?mode=register. */}
        <Route path="/" element={<LandingBanner />} />

        {/* USER AUTH */}
        <Route path="/auth" element={<AuthRedirect />} />

        {/* ONBOARDING SURVEY */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute requireActivation={false}>
              <OnboardingSurvey />
            </ProtectedRoute>
          }
        />


        {/* TERMS AND CONDITIONS */}
        <Route path="/terms" element={<TermsAndConditions />} />

        {/* USER APP — Hub for multiple earning options */}
        <Route
          path="/hub"
          element={
            <ProtectedRoute>
              <MultiFunctionDashboard />
            </ProtectedRoute>
          }
        />

        {/* USER APP — Survey Dashboard (original, unchanged) */}
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
          path="/surveys/:surveyId"
          element={
            <ProtectedRoute>
              <SurveyTake />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activation-notice"
          element={
            <ProtectedRoute requireActivation={false}>
              <ActivationNotice />
            </ProtectedRoute>
          }
        />

        <Route
          path="/activate"
          element={
            <ProtectedRoute requireActivation={false}>
              <Activate />
            </ProtectedRoute>
          }
        />

        {/* OLD WITHDRAW PAGE */}
        <Route
          path="/withdraw"
          element={
            <ProtectedRoute>
              <Withdraw />
            </ProtectedRoute>
          }
        />

        {/* NEW WITHDRAW PAGES */}
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

        {/* ChatWazungu Dashboard */}
        <Route
          path="/chatwazungu"
          element={
            <ProtectedRoute>
              <ChatWazunguDashboard />
            </ProtectedRoute>
          }
        />

        {/* Work Tasks */}
        <Route
          path="/work"
          element={
            <ProtectedRoute>
              <WorkTaskHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/work/:typeSlug"
          element={
            <ProtectedRoute>
              <WorkTaskList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/work/task/:taskId"
          element={
            <ProtectedRoute>
              <WorkTaskSubmit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/work/submissions"
          element={
            <ProtectedRoute>
              <WorkSubmissions />
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
          <Route path="login-fee" element={<AdminLoginFee />} />
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
