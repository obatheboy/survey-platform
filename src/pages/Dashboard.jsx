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
  const surveySectionRef = useRef(null);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cached_user"));
    } catch {
      return null;
    }
  });
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(!user);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawMessage, setWithdrawMessage] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeWithdrawPlan, setActiveWithdrawPlan] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [welcomeBonus, setWelcomeBonus] = useState(null);

  /* =========================
     LOAD USER & NOTIFICATIONS
  ========================== */
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const resUser = await api.get("/auth/me");
        if (!alive) return;
        setUser(resUser.data);
        setPlans(resUser.data.plans || {});
        localStorage.setItem("cached_user", JSON.stringify(resUser.data));

        const resNotifs = await api.get("/notifications");
        if (!alive) return;

        setNotifications(resNotifs.data);
        const welcome = resNotifs.data.find(n => n.type === "welcome_bonus");
        setWelcomeBonus(welcome || null);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 30000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    return () => {
      alive = false;
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (loading) return <p className="loading">Loading dashboard…</p>;
  if (!user) return null;

  /* =========================
     PLAN HELPERS
  ========================== */
  const surveysDone = (plan) => plans[plan]?.surveys_completed || 0;
  const isCompleted = (plan) => plans[plan]?.completed === true;
  const isActivated = (plan) => plans[plan]?.is_activated === true;
  const activationSubmitted = (plan) => plans[plan]?.activation_status === "SUBMITTED";

  /* =========================
     SURVEY / ACTIVATION
  ========================== */
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
    navigate("/activation-notice");
  };

  const handleWithdrawClick = (type) => {
    setWithdrawMessage("");
    setWithdrawError("");

    if (type === "welcome_bonus") {
      if (!welcomeBonus || !welcomeBonus.is_read) {
        setToast("Activate your account to withdraw Welcome Bonus!");
        setTimeout(() => setToast(""), 3000);
        navigate("/activation?welcome_bonus=true");
        return;
      }
    }

    if (!isCompleted(type)) {
      setToast("Complete all survey plans to unlock withdrawal");
      surveySectionRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => setToast(""), 3000);
      return;
    }

    if (!isActivated(type)) {
      if (activationSubmitted(type)) {
        setToast("Activation submitted. Waiting for admin approval.");
      } else {
        openActivationNotice(type);
      }
      setTimeout(() => setToast(""), 3000);
      return;
    }

    setActiveWithdrawPlan(type);
  };

  /* =========================
     SUBMIT WITHDRAWAL
     ✔ Handles welcome bonus 403 without logging out
  ========================== */
  const submitWithdraw = async () => {
    setWithdrawMessage("");
    setWithdrawError("");

    if (!withdrawAmount || !withdrawPhone) {
      setWithdrawError("Enter both amount and phone number.");
      return;
    }

    const amt = Number(withdrawAmount);
    if (!Number.isFinite(amt)) {
      setWithdrawError("Invalid amount.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/withdraw/request", {
        phone_number: withdrawPhone,
        amount: amt,
        type: activeWithdrawPlan,
      });

      setWithdrawMessage("🎉 Congratulations! Your withdrawal is being processed.");

      // Refresh user & notifications
      const updatedUser = await api.get("/auth/me");
      setUser(updatedUser.data);
      setPlans(updatedUser.data.plans || {});
      localStorage.setItem("cached_user", JSON.stringify(updatedUser.data));

      const resNotifs = await api.get("/notifications");
      setNotifications(resNotifs.data);
      const welcome = resNotifs.data.find(n => n.type === "welcome_bonus");
      setWelcomeBonus(welcome || null);
    } catch (err) {
      // 🌟 Handle 403 for welcome bonus gracefully
      if (err.response?.status === 403 && activeWithdrawPlan === "welcome_bonus") {
        setWithdrawError(err.response.data.message);
      } else if (err.response?.data?.message) {
        setWithdrawError(err.response.data.message);
      } else {
        setWithdrawError("Withdraw failed.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     RENDER
  ========================== */
  return (
    <div className="dashboard">
      {toast && <Notifications message={toast} />}

      <header className="dashboard-header">
        <button className="menu-btn" onClick={() => setMenuOpen(true)}>☰</button>
        <h2>Dashboard</h2>
      </header>

      <MainMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} user={user} />
      <LiveWithdrawalFeed />

      {/* HERO */}
      <section className="dashboard-hero">
        <div className="card greeting">
          <h3>Hello, {user.full_name} 👋</h3>
          <p>Your journey to real earnings continues.</p>
        </div>
        <div className="earnings">
          <div><span>Total Earnings</span><strong>KES {Number(user.total_earned || 0).toLocaleString()}</strong></div>
          <div><span>Current Balance</span><strong>KES {Number(user.total_earned || 0).toLocaleString()}</strong></div>
        </div>
      </section>

      {/* WELCOME BONUS */}
      {welcomeBonus && (
        <>
          <h3 className="section-title">🎉 Welcome Bonus</h3>
          <div className="card welcome-bonus-card">
            <div>
              <strong>KES {welcomeBonus.amount?.toLocaleString() || 1200}</strong>
              <p>Withdraw your welcome bonus now!</p>
            </div>
            <button className="primary-btn" onClick={() => handleWithdrawClick("welcome_bonus")}>Withdraw</button>
          </div>
        </>
      )}

      {/* REGULAR PLAN WITHDRAWALS */}
      <h3 className="section-title withdraw-title">💸 Withdraw Earnings</h3>
      {Object.entries(PLANS).map(([key, plan]) => (
        <div key={key} className="card withdraw-card">
          <div>
            <h4>{plan.icon} {plan.name}</h4>
            <strong>KES {isCompleted(key) ? plan.total.toLocaleString() : "0"}</strong>
          </div>
          <button className="outline-btn" onClick={() => handleWithdrawClick(key)}>Withdraw</button>
        </div>
      ))}

      {/* ACTIVE WITHDRAW FORM */}
      {activeWithdrawPlan && (
        <div className="card withdraw-form">
          <h4>Withdraw: {PLANS[activeWithdrawPlan].name}</h4>
          {withdrawMessage && <p className="success-msg">{withdrawMessage}</p>}
          {withdrawError && <p className="error-msg">{withdrawError}</p>}

          <input type="number" placeholder="Enter amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="withdraw-input"/>
          <input type="tel" placeholder="Enter phone number" value={withdrawPhone} onChange={(e) => setWithdrawPhone(e.target.value)} className="withdraw-input"/>

          <button className="primary-btn" onClick={submitWithdraw} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Withdrawal"}
          </button>
          <button className="outline-btn" onClick={() => setActiveWithdrawPlan("")} style={{ marginTop: 8 }}>Cancel</button>
        </div>
      )}

      {/* SURVEYS */}
      <h3 ref={surveySectionRef} className="section-title">Survey Plans</h3>
      {Object.entries(PLANS).map(([key, plan]) => {
        const completed = isCompleted(key);
        const planClass = key === "REGULAR" ? "plan-regular" : key === "VIP" ? "plan-vip" : "plan-vvip";
        const titleClass = key === "REGULAR" ? "regular" : key === "VIP" ? "vip" : "vvip";

        return (
          <div key={key} className={`card plan-card ${planClass}`}>
            <div>
              <h4 className={`plan-title ${titleClass}`}>{plan.icon} {plan.name}</h4>
              <p><b>Total Earnings:</b> KES {plan.total}</p>
              <p><b>Per Survey:</b> KES {plan.perSurvey}</p>
              <p><b>Progress:</b> {surveysDone(key)} / {TOTAL_SURVEYS}</p>
            </div>
            <button className="primary-btn plan-btn" onClick={() => completed ? openActivationNotice(key) : startSurvey(key)}>
              {completed ? "View Completion" : "Start Survey"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
