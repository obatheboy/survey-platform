import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import MainMenuDrawer from "./components/MainMenuDrawer.jsx";
import LiveWithdrawalFeed from "./components/LiveWithdrawalFeed.jsx";
import "./Dashboard.css";

/* =========================
   PLAN CONFIG
========================= */
const PLANS = {
  REGULAR: {
    name: "Regular",
    icon: "⭐",
    total: 1500,
    perSurvey: 150,
  },
  VIP: {
    name: "VIP",
    icon: "💎",
    total: 2000,
    perSurvey: 200,
  },
  VVIP: {
    name: "VVIP",
    icon: "👑",
    total: 3000,
    perSurvey: 300,
  },
};

const TOTAL_SURVEYS = 10;

export default function Dashboard() {
  const navigate = useNavigate();
  const surveySectionRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");

  /* =========================
     LOAD USER (DB = SOURCE OF TRUTH)
  ========================= */
  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => navigate("/auth", { replace: true }))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <p className="loading">Loading dashboard…</p>;
  if (!user) return null;

  /* =========================
     HELPERS (DB-BASED)
  ========================= */

  // surveys are tracked PER ACTIVE PLAN in DB
  const getSurveysDone = (planKey) =>
    user.plan === planKey ? user.surveys_completed : 0;

  const isPlanCompleted = (planKey) =>
    user.plan === planKey && user.surveys_completed >= TOTAL_SURVEYS;

  const getPlanEarnings = (planKey) =>
    isPlanCompleted(planKey) ? PLANS[planKey].total : 0;

  /* =========================
     TOTALS
  ========================= */
  const totalEarnings = user.total_earned || 0;

  /* =========================
     ACTIONS
  ========================= */
  const startSurvey = (planKey) => {
    // If this plan already completed → show activation notice
    if (isPlanCompleted(planKey)) {
      navigate("/activation-notice", {
        state: { reason: "completed" },
      });
      return;
    }

    localStorage.setItem("selectedPlan", planKey);
    navigate("/surveys");
  };

  const handleWithdraw = (planKey) => {
    if (!isPlanCompleted(planKey)) {
      setToast("Complete surveys to unlock withdrawal");
      surveySectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      setTimeout(() => setToast(""), 3000);
      return;
    }

    if (!user.is_activated) {
      navigate("/activation-notice", {
        state: { reason: "withdraw" },
      });
      return;
    }

    navigate("/withdraw");
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="dashboard">
      {toast && <div className="toast">{toast}</div>}

      {/* HEADER */}
      <header className="dashboard-header">
        <button className="menu-btn" onClick={() => setMenuOpen(true)}>
          ☰
        </button>
        <h2>Dashboard</h2>
      </header>

      <MainMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        user={user}
      />

      <LiveWithdrawalFeed />

      {/* GREETING */}
      <section className="card greeting">
        <h3>Hello, {user.full_name} 👋</h3>
        <p>Your journey to real earnings continues.</p>
      </section>

      {/* EARNINGS */}
      <section className="card earnings">
        <div>
          <span>Total Earnings</span>
          <strong>KES {totalEarnings.toLocaleString()}</strong>
        </div>
        <div>
          <span>Current Balance</span>
          <strong>KES {totalEarnings.toLocaleString()}</strong>
        </div>
      </section>

      {/* WITHDRAW */}
      <h3 className="section-title withdraw-title">💸 Withdraw Earnings</h3>

      {Object.entries(PLANS).map(([key, plan]) => {
        const earnings = getPlanEarnings(key);
        const locked = earnings === 0;

        return (
          <div
            key={key}
            className={`card withdraw-card ${locked ? "locked" : ""}`}
          >
            <div>
              <h4 className={`plan-title ${key.toLowerCase()}`}>
                {plan.icon} {plan.name}
              </h4>
              <strong>KES {earnings.toLocaleString()}</strong>
            </div>

            <button
              className={`outline-btn plan-btn plan-${key.toLowerCase()}`}
              onClick={() => handleWithdraw(key)}
            >
              Withdraw
            </button>
          </div>
        );
      })}

      {/* SURVEYS */}
      <h3 ref={surveySectionRef} className="section-title">
        Survey Plans
      </h3>

      {Object.entries(PLANS).map(([key, plan]) => (
        <div key={key} className="card plan-card">
          <div>
            <h4 className={`plan-title ${key.toLowerCase()}`}>
              {plan.icon} {plan.name}
            </h4>
            <p>Total Earnings: KES {plan.total}</p>
            <p>Per Survey: KES {plan.perSurvey}</p>
            <p>
              Progress: {getSurveysDone(key)} / {TOTAL_SURVEYS}
            </p>
          </div>

          <button
            className={`primary-btn plan-btn plan-${key.toLowerCase()}`}
            onClick={() => startSurvey(key)}
          >
            {isPlanCompleted(key) ? "Completed" : "Start Survey"}
          </button>
        </div>
      ))}
    </div>
  );
}
