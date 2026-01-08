import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import MainMenuDrawer from "./components/MainMenuDrawer.jsx";
import LiveWithdrawalFeed from "./components/LiveWithdrawalFeed.jsx";
import "./Dashboard.css";

/* =========================
   PLAN CONFIG (DISPLAY)
========================= */
const PLANS = {
  REGULAR: { name: "Regular", icon: "⭐", total: 1500 },
  VIP: { name: "VIP", icon: "💎", total: 2000 },
  VVIP: { name: "VVIP", icon: "👑", total: 3000 },
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
     LOAD USER (DB = TRUTH)
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
     HELPERS (STRICT + UX SAFE)
  ========================= */
  const isCurrentPlan = (planKey) => user.plan === planKey;

  const surveysDone = (planKey) =>
    isCurrentPlan(planKey) ? user.surveys_completed : 0;

  const isCompleted = (planKey) =>
    isCurrentPlan(planKey) && user.surveys_completed >= TOTAL_SURVEYS;

  const isWithdrawable = (planKey) =>
    isCompleted(planKey) && user.is_activated;

  /* =========================
     ACTIONS
  ========================= */
  const startSurvey = (planKey) => {
    localStorage.setItem("selectedPlan", planKey);
    navigate("/surveys");
  };

  const handleWithdraw = (planKey) => {
    if (!isCompleted(planKey)) {
      setToast("Complete all surveys to unlock withdrawal");
      surveySectionRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => setToast(""), 3000);
      return;
    }

    if (!user.is_activated) {
      navigate("/activation-notice");
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
        <button className="menu-btn" onClick={() => setMenuOpen(true)}>☰</button>
        <h2>Dashboard</h2>
      </header>

      <MainMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        user={user}
      />

      {/* 🔒 FEED MUST NOT BLOCK CLICKS */}
      <div style={{ pointerEvents: "none" }}>
        <LiveWithdrawalFeed />
      </div>

      {/* GREETING */}
      <section className="card greeting">
        <h3>Hello, {user.full_name} 👋</h3>
        <p>Your journey to real earnings continues.</p>
      </section>

      {/* TOTALS */}
      <section className="card earnings">
        <div>
          <span>Total Earned</span>
          <strong>KES {Number(user.total_earned || 0).toLocaleString()}</strong>
        </div>
      </section>

      {/* WITHDRAW */}
      <h3 className="section-title withdraw-title">💸 Withdraw Earnings</h3>

      {Object.entries(PLANS).map(([key, plan]) => (
        <div key={key} className="card withdraw-card">
          <div>
            <h4>{plan.icon} {plan.name}</h4>
            <p>
              💰 {plan.total}{" "}
              {isWithdrawable(key)
                ? "(Withdrawable)"
                : isCompleted(key)
                ? "(Activation required)"
                : "(Locked)"}
            </p>
          </div>

          <button
            className="outline-btn"
            onClick={() => handleWithdraw(key)}
          >
            Withdraw
          </button>
        </div>
      ))}

      {/* SURVEYS */}
      <h3 ref={surveySectionRef} className="section-title">
        Survey Plans
      </h3>

      {Object.entries(PLANS).map(([key, plan]) => (
        <div key={key} className="card plan-card">
          <div>
            <h4>{plan.icon} {plan.name}</h4>
            <p>Earn up to <b>KES {plan.total}</b></p>
            <p>Progress: {surveysDone(key)} / {TOTAL_SURVEYS}</p>
          </div>

          <button
            className="primary-btn"
            onClick={() => startSurvey(key)}
          >
            {isCompleted(key) ? "Completed" : "Start Survey"}
          </button>
        </div>
      ))}
    </div>
  );
}
