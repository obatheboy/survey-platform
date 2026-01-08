import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import MainMenuDrawer from "./components/MainMenuDrawer.jsx";
import LiveWithdrawalFeed from "./components/LiveWithdrawalFeed.jsx";
import "./Dashboard.css";

/* =========================
   PLAN CONFIG (DISPLAY ONLY)
========================= */
const PLANS = {
  REGULAR: { name: "Regular", icon: "⭐" },
  VIP: { name: "VIP", icon: "💎" },
  VVIP: { name: "VVIP", icon: "👑" },
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
     LOAD USER (DB = LAW)
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
     STRICT HELPERS
  ========================= */
  const isUserPlan = (planKey) => user.plan === planKey;
  const isCompleted = user.surveys_completed >= TOTAL_SURVEYS;
  const requiresActivation = isCompleted && !user.is_activated;

  /* =========================
     ACTIONS
  ========================= */
  const startSurvey = (planKey) => {
    if (!isUserPlan(planKey)) {
      setToast("You can only continue your selected plan");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    if (isCompleted) {
      navigate("/activation-notice", { replace: true });
      return;
    }

    localStorage.setItem("selectedPlan", planKey);
    navigate("/surveys");
  };

  const handleWithdraw = (planKey) => {
    if (!isUserPlan(planKey)) return;

    if (!isCompleted) {
      setToast("Complete surveys to unlock withdrawal");
      surveySectionRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => setToast(""), 3000);
      return;
    }

    if (requiresActivation) {
      navigate("/activation-notice", { replace: true });
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

      <LiveWithdrawalFeed />

      {/* GREETING */}
      <section className="card greeting">
        <h3>Hello, {user.full_name} 👋</h3>
        <p>Your journey to real earnings continues.</p>
      </section>

      {/* TOTALS */}
      <section className="card earnings">
        <div>
          <span>Total Earnings</span>
          <strong>KES {Number(user.total_earned).toLocaleString()}</strong>
        </div>
        <div>
          <span>Current Balance</span>
          <strong>KES {Number(user.total_earned).toLocaleString()}</strong>
        </div>
      </section>

      {/* WITHDRAW */}
      <h3 className="section-title withdraw-title">💸 Withdraw Earnings</h3>

      {Object.entries(PLANS).map(([key, plan]) => {
        const show = isUserPlan(key);

        return (
          <div key={key} className={`card withdraw-card ${!show ? "locked" : ""}`}>
            <div>
              <h4>{plan.icon} {plan.name}</h4>
              <strong>
                KES {show && isCompleted ? Number(user.total_earned).toLocaleString() : "0"}
              </strong>
            </div>

            <button
              className="outline-btn"
              disabled={!show}
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
            <h4>{plan.icon} {plan.name}</h4>
            <p>Progress: {isUserPlan(key) ? user.surveys_completed : 0} / {TOTAL_SURVEYS}</p>
          </div>

          <button
            className="primary-btn"
            disabled={!isUserPlan(key)}
            onClick={() => startSurvey(key)}
          >
            {isUserPlan(key) && isCompleted ? "Completed" : "Start Survey"}
          </button>
        </div>
      ))}
    </div>
  );
}
