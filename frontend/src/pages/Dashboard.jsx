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
  REGULAR: { name: "Regular", icon: "⭐", total: 1500, perSurvey: 150 },
  VIP: { name: "VIP", icon: "💎", total: 2000, perSurvey: 200 },
  VVIP: { name: "VVIP", icon: "👑", total: 3000, perSurvey: 300 },
};

const TOTAL_SURVEYS = 10;

export default function Dashboard() {
  const navigate = useNavigate();
  const surveySectionRef = useRef(null);

  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");

  /* =========================
     LOAD USER + PLAN STATES
  ========================= */
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await api.get("/auth/me");
        if (!alive) return;

        setUser(res.data);
        setPlans(res.data.plans || {});
      } catch {
        // do NOT redirect here
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => (alive = false);
  }, []);

  if (loading) return <p className="loading">Loading dashboard…</p>;
  if (!user) return null;

  /* =========================
     HELPERS
  ========================= */
  const surveysDone = (plan) => plans[plan]?.surveys_completed || 0;
  const isCompleted = (plan) => plans[plan]?.completed === true;
  const isActivated = (plan) => plans[plan]?.is_activated === true;

  /* =========================
     ACTIONS
  ========================= */
  const startSurvey = async (plan) => {
    try {
      localStorage.setItem("active_plan", plan);
      await api.post("/surveys/select-plan", { plan });
      navigate("/surveys");
    } catch {
      setToast("Failed to start survey. Try again.");
      setTimeout(() => setToast(""), 3000);
    }
  };

  const openActivationNotice = (plan) => {
    localStorage.setItem("active_plan", plan);
    navigate("/activation-notice"); // ✅ FIXED
  };

  const handleWithdraw = (plan) => {
    if (!isCompleted(plan)) {
      setToast("Complete surveys to unlock withdrawal");
      surveySectionRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => setToast(""), 3000);
      return;
    }

    if (!isActivated(plan)) {
      openActivationNotice(plan); // ✅ FIXED
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

      <section className="card greeting">
        <h3>Hello, {user.full_name} 👋</h3>
        <p>Your journey to real earnings continues.</p>
      </section>

      <section className="card earnings">
        <div>
          <span>Total Earnings</span>
          <strong>KES {Number(user.total_earned || 0).toLocaleString()}</strong>
        </div>
        <div>
          <span>Current Balance</span>
          <strong>KES {Number(user.total_earned || 0).toLocaleString()}</strong>
        </div>
      </section>

      <h3 className="section-title withdraw-title">💸 Withdraw Earnings</h3>

      {Object.entries(PLANS).map(([key, plan]) => (
        <div key={key} className="card withdraw-card">
          <div>
            <h4>{plan.icon} {plan.name}</h4>
            <strong>
              KES {isCompleted(key) ? plan.total.toLocaleString() : "0"}
            </strong>
          </div>

          <button className="outline-btn" onClick={() => handleWithdraw(key)}>
            Withdraw
          </button>
        </div>
      ))}

      <h3 ref={surveySectionRef} className="section-title">
        Survey Plans
      </h3>

      {Object.entries(PLANS).map(([key, plan]) => {
        const completed = isCompleted(key);

        return (
          <div key={key} className="card plan-card">
            <div>
              <h4>{plan.icon} {plan.name}</h4>
              <p><b>Total Earnings:</b> KES {plan.total}</p>
              <p><b>Per Survey:</b> KES {plan.perSurvey}</p>
              <p>
                <b>Progress:</b> {surveysDone(key)} / {TOTAL_SURVEYS}
              </p>
            </div>

            <button
              className="primary-btn"
              onClick={() =>
                completed
                  ? openActivationNotice(key) // ✅ FIXED
                  : startSurvey(key)
              }
            >
              {completed ? "View Completion" : "Start Survey"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
