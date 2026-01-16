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

  /* =========================
     STATE
  ========================== */
  const [activeTab, setActiveTab] = useState("surveys");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cached_user"));
    } catch {
      return null;
    }
  });

  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(!user);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawMessage, setWithdrawMessage] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeWithdrawPlan, setActiveWithdrawPlan] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);
  const [fullScreenNotification, setFullScreenNotification] = useState(null);

  /* =========================
     LOAD DATA
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
  ========================== */
  const surveysDone = (plan) => plans[plan]?.surveys_completed || 0;
  const isCompleted = (plan) => plans[plan]?.completed === true;
  const isActivated = (plan) => plans[plan]?.is_activated === true;
  const activationSubmitted = (plan) =>
    plans[plan]?.activation_status === "SUBMITTED";

  /* =========================
     SURVEYS
  ========================== */
  const startSurvey = async (plan) => {
    try {
      localStorage.setItem("active_plan", plan);
      await api.post("/surveys/select-plan", { plan });
      navigate("/surveys");
    } catch {
      setToast("Failed to start survey.");
      setTimeout(() => setToast(""), 3000);
    }
  };

  const openActivationNotice = (plan) => {
    localStorage.setItem("active_plan", plan);
    navigate("/activation-notice");
  };

  /* =========================
     WITHDRAW
  ========================== */
  const handleWithdrawClick = (type) => {
    setWithdrawMessage("");
    setWithdrawError("");

    if (!isCompleted(type)) {
      setToast("Complete all surveys to unlock withdrawal.");
      surveySectionRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => setToast(""), 3000);
      return;
    }

    if (!isActivated(type)) {
      setFullScreenNotification({
        message: activationSubmitted(type)
          ? "Activation submitted. Awaiting approval."
          : "❌ Activate your account to withdraw.",
        redirect: activationSubmitted(type) ? null : "/activation-notice",
      });
      return;
    }

    setActiveWithdrawPlan(type);
  };

  const submitWithdraw = async () => {
    setWithdrawMessage("");
    setWithdrawError("");

    if (!withdrawAmount || !withdrawPhone) {
      setWithdrawError("Enter amount and phone number.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/withdraw/request", {
        phone_number: withdrawPhone,
        amount: Number(withdrawAmount),
        type: activeWithdrawPlan,
      });

      setWithdrawMessage("🎉 Withdrawal request submitted.");
      setActiveWithdrawPlan("");
    } catch (err) {
      setWithdrawError(err.response?.data?.message || "Withdraw failed.");
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

      {/* HERO */}
      <section className="dashboard-hero">
        <div className="card greeting">
          <h3>Hello, {user.full_name} 👋</h3>
          <p>Your journey to real earnings continues.</p>
        </div>

        <div className="earnings">
          <div>
            <span>Total Earnings</span>
            <strong>KES {user.total_earned?.toLocaleString()}</strong>
          </div>
          <div>
            <span>Current Balance</span>
            <strong>KES {user.total_earned?.toLocaleString()}</strong>
          </div>
        </div>
      </section>

      {/* TABS */}
      <div className="dashboard-tabs">
        <button
          className={activeTab === "surveys" ? "active" : ""}
          onClick={() => setActiveTab("surveys")}
        >
          Surveys
        </button>
        <button
          className={activeTab === "withdraw" ? "active" : ""}
          onClick={() => setActiveTab("withdraw")}
        >
          Withdraw
        </button>
        <button
          className={activeTab === "bonuses" ? "active" : ""}
          onClick={() => setActiveTab("bonuses")}
        >
          Bonuses
        </button>
      </div>

      {/* SURVEYS TAB */}
      {activeTab === "surveys" && (
        <section ref={surveySectionRef}>
          {Object.entries(PLANS).map(([key, plan]) => (
            <div key={key} className="card plan-card">
              <div>
                <h4>{plan.icon} {plan.name}</h4>
                <p>Total: KES {plan.total}</p>
                <p>Per Survey: KES {plan.perSurvey}</p>
                <p>Progress: {surveysDone(key)} / {TOTAL_SURVEYS}</p>
              </div>
              <button
                className="primary-btn"
                onClick={() =>
                  isCompleted(key)
                    ? openActivationNotice(key)
                    : startSurvey(key)
                }
              >
                {isCompleted(key) ? "View Completion" : "Start Survey"}
              </button>
            </div>
          ))}
        </section>
      )}

      {/* WITHDRAW TAB */}
      {activeTab === "withdraw" && (
        <section>
          {Object.entries(PLANS).map(([key, plan]) => (
            <div key={key} className="card withdraw-card">
              <div>
                <h4>{plan.icon} {plan.name}</h4>
                <strong>KES {isCompleted(key) ? plan.total : 0}</strong>
              </div>
              <button onClick={() => handleWithdrawClick(key)}>Withdraw</button>
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

              <button onClick={submitWithdraw} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          )}
        </section>
      )}

      {/* BONUSES TAB */}
      {activeTab === "bonuses" && (
        <section className="card">
          <h3>🎁 Bonuses</h3>
          <p>No bonuses available yet.</p>
        </section>
      )}
    </div>
  );
}
