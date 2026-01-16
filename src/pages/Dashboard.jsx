// ========================= Dashboard.jsx =========================
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import MainMenuDrawer from "./components/MainMenuDrawer.jsx";
import LiveWithdrawalFeed from "./components/LiveWithdrawalFeed.jsx";
import Notifications from "./components/Notifications.jsx";
import "./Dashboard.css";

/* =========================
   PLAN CONFIG
========================= */
const PLANS = {
  REGULAR: { name: "Regular", icon: "⭐", total: 1500, perSurvey: 150 },
  VIP: { name: "VIP", icon: "💎", total: 2000, perSurvey: 200 },
  VVIP: { name: "VVIP", icon: "👑", total: 3000, perSurvey: 300 },
};

const TOTAL_SURVEYS = 10;

export default function Dashboard() {
  const navigate = useNavigate();
  const surveyRef = useRef(null);

  /* =========================
     UI STATE
  ========================= */
  const [activeTab, setActiveTab] = useState("SURVEYS");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  /* =========================
     DATA STATE
  ========================= */
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);

  /* =========================
     WITHDRAW STATE
  ========================= */
  const [activeWithdrawPlan, setActiveWithdrawPlan] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawMessage, setWithdrawMessage] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [fullScreenNotification, setFullScreenNotification] = useState(null);

  /* =========================
     LOAD DASHBOARD
  ========================= */
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const resUser = await api.get("/auth/me");
        if (!alive) return;

        setUser(resUser.data);
        setPlans(resUser.data.plans || {});
        localStorage.setItem("cached_user", JSON.stringify(resUser.data));

        if (resUser.data.welcome_bonus_received) {
          setShowWelcomeBonus(true);
        }

        const resNotifs = await api.get("/notifications");
        setNotifications(resNotifs.data);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 30000);
    window.addEventListener("focus", load);

    return () => {
      alive = false;
      clearInterval(interval);
      window.removeEventListener("focus", load);
    };
  }, []);

  if (loading) return <p className="loading">Loading dashboard…</p>;
  if (!user) return null;

  /* =========================
     HELPERS
  ========================= */
  const surveysDone = (plan) => plans[plan]?.surveys_completed || 0;
  const isCompleted = (plan) => plans[plan]?.completed === true;
  const isActivated = (plan) => plans[plan]?.is_activated === true;
  const activationSubmitted = (plan) => plans[plan]?.activation_status === "SUBMITTED";

  /* =========================
     SURVEY ACTION
  ========================= */
  const startSurvey = async (plan) => {
    try {
      localStorage.setItem("active_plan", plan);
      await api.post("/surveys/select-plan", { plan });
      navigate("/surveys");
    } catch {
      setToast("Failed to start survey");
      setTimeout(() => setToast(""), 3000);
    }
  };

  /* =========================
     WITHDRAW LOGIC
  ========================= */
  const handleWithdrawClick = (plan) => {
    setWithdrawError("");
    setWithdrawMessage("");

    if (!isCompleted(plan)) {
      setToast("Complete all surveys to withdraw");
      surveyRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => setToast(""), 3000);
      return;
    }

    if (!isActivated(plan)) {
      if (activationSubmitted(plan)) {
        setFullScreenNotification({
          message: "Activation submitted. Awaiting approval.",
        });
      } else {
        setFullScreenNotification({
          message: "❌ Account not activated.",
          redirect: "/activation-notice",
        });
      }
      return;
    }

    setActiveWithdrawPlan(plan);
  };

  const submitWithdraw = async () => {
    if (!withdrawAmount || !withdrawPhone) {
      setWithdrawError("Enter amount and phone number");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/withdraw/request", {
        phone_number: withdrawPhone,
        amount: Number(withdrawAmount),
        type: activeWithdrawPlan,
      });

      setWithdrawMessage("🎉 Withdrawal submitted successfully");

      const refreshed = await api.get("/auth/me");
      setUser(refreshed.data);
      setPlans(refreshed.data.plans || {});
    } catch (err) {
      setWithdrawError(err.response?.data?.message || "Withdraw failed");
    } finally {
      setSubmitting(false);
      setActiveWithdrawPlan("");
    }
  };

  /* =========================
     WELCOME BONUS
  ========================= */
  const handleWelcomeBonusWithdraw = () => {
    setFullScreenNotification({
      message: "Activate your account with KES 100 to withdraw your welcome bonus.",
      redirect: "/activate?welcome_bonus=1",
    });
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="dashboard">
      {toast && <Notifications message={toast} />}

      {fullScreenNotification && (
        <div className="full-screen-notif">
          <div className="notif-content">
            <p>{fullScreenNotification.message}</p>
            {fullScreenNotification.redirect && (
              <button
                className="primary-btn"
                onClick={() => navigate(fullScreenNotification.redirect)}
              >
                Activate
              </button>
            )}
          </div>
        </div>
      )}

      <header className="dashboard-header">
        <button className="menu-btn" onClick={() => setMenuOpen(true)}>☰</button>
        <h2>Dashboard</h2>
      </header>

      <MainMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} user={user} />
      <LiveWithdrawalFeed />

      {/* ================= HERO ================= */}
      <section className="dashboard-hero">
        <div className="card greeting">
          <h3>Hello, {user.full_name} 👋</h3>
          <p>Your journey to real earnings continues.</p>
        </div>

        <div className="earnings">
          <div>
            <span>Total Earnings</span>
            <strong>KES {Number(user.total_earned || 0).toLocaleString()}</strong>
          </div>
          <div>
            <span>Current Balance</span>
            <strong>KES {Number(user.total_earned || 0).toLocaleString()}</strong>
          </div>
        </div>
      </section>

      {/* ================= WELCOME BONUS ================= */}
      {showWelcomeBonus && (
        <div className="card welcome-bonus-card">
          <h3>🎉 Welcome Bonus</h3>
          <p>You’ve received KES 1,200</p>
          <button className="primary-btn" onClick={handleWelcomeBonusWithdraw}>
            Withdraw
          </button>
        </div>
      )}

      {/* ================= TABS ================= */}
      <div className="dashboard-tabs">
        <button
          className={activeTab === "SURVEYS" ? "active" : ""}
          onClick={() => setActiveTab("SURVEYS")}
        >
          Surveys
        </button>
        <button
          className={activeTab === "WITHDRAW" ? "active" : ""}
          onClick={() => setActiveTab("WITHDRAW")}
        >
          Withdraw
        </button>
      </div>

      {/* ================= SURVEYS ================= */}
      {activeTab === "SURVEYS" && (
        <section ref={surveyRef} className="tab-section">
          {Object.entries(PLANS).map(([key, plan]) => (
            <div key={key} className="card plan-card">
              <h4>{plan.icon} {plan.name}</h4>
              <p>Total: KES {plan.total}</p>
              <p>Per Survey: KES {plan.perSurvey}</p>
              <p>Progress: {surveysDone(key)} / {TOTAL_SURVEYS}</p>
              <button className="primary-btn" onClick={() => startSurvey(key)}>
                Start Survey
              </button>
            </div>
          ))}
        </section>
      )}

      {/* ================= WITHDRAW ================= */}
      {activeTab === "WITHDRAW" && (
        <section className="tab-section">
          {Object.entries(PLANS).map(([key, plan]) => (
            <div key={key} className="card withdraw-card">
              <h4>{plan.icon} {plan.name}</h4>
              <strong>KES {isCompleted(key) ? plan.total : 0}</strong>
              <button className="withdraw-btn" onClick={() => handleWithdrawClick(key)}>
                Withdraw
              </button>
            </div>
          ))}

          {activeWithdrawPlan && (
            <div className="card withdraw-form">
              <h4>Withdraw {PLANS[activeWithdrawPlan].name}</h4>
              {withdrawMessage && <p className="success-msg">{withdrawMessage}</p>}
              {withdrawError && <p className="error-msg">{withdrawError}</p>}

              <input
                type="number"
                placeholder="Amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={withdrawPhone}
                onChange={(e) => setWithdrawPhone(e.target.value)}
              />

              <button className="primary-btn" onClick={submitWithdraw} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
