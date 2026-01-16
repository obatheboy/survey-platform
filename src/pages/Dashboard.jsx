// ========================= Dashboard.jsx =========================
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
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
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cached_user"));
    } catch {
      return null;
    }
  });

  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(!user);
  const [toast, setToast] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawMessage, setWithdrawMessage] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeWithdrawPlan, setActiveWithdrawPlan] = useState("");

  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);
  const [fullScreenNotification, setFullScreenNotification] = useState(null);

  /* =========================
     LOAD USER & DATA
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
     ACTIONS
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

  const showFSN = ({ message, redirect }) =>
    setFullScreenNotification({ message, redirect });

  const handleWelcomeBonusWithdraw = () => {
    showFSN({
      message:
        "❌ Your account is not activated. Activate your account with KES 100 to withdraw your welcome bonus.",
      redirect: "/activate?welcome_bonus=1",
    });
  };

  const handleWithdrawClick = (type) => {
    setWithdrawError("");
    setWithdrawMessage("");

    if (!isCompleted(type)) {
      setToast("Complete all survey plans to unlock withdrawal");
      surveySectionRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => setToast(""), 3000);
      return;
    }

    if (!isActivated(type)) {
      if (activationSubmitted(type)) {
        showFSN({
          message: "Activation submitted. Waiting for admin approval.",
          redirect: null,
        });
      } else {
        showFSN({
          message:
            "❌ Your account is not activated. Activate now to withdraw earnings.",
          redirect: "/activation-notice",
        });
      }
      return;
    }

    setActiveWithdrawPlan(type);
  };

  const submitWithdraw = async () => {
    setWithdrawError("");
    setWithdrawMessage("");

    if (!withdrawAmount || !withdrawPhone) {
      setWithdrawError("Enter amount and phone number.");
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

      setWithdrawMessage("🎉 Withdrawal request submitted.");

      const updated = await api.get("/auth/me");
      setUser(updated.data);
      setPlans(updated.data.plans || {});
      localStorage.setItem("cached_user", JSON.stringify(updated.data));
    } catch (err) {
      setWithdrawError(err.response?.data?.message || "Withdraw failed.");
    } finally {
      setSubmitting(false);
      setActiveWithdrawPlan("");
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
                onClick={() => {
                  setFullScreenNotification(null);
                  navigate(fullScreenNotification.redirect);
                }}
              >
                Activate
              </button>
            )}
          </div>
        </div>
      )}

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
            <strong>KES {Number(user.total_earned || 0).toLocaleString()}</strong>
          </div>
          <div>
            <span>Current Balance</span>
            <strong>KES {Number(user.total_earned || 0).toLocaleString()}</strong>
          </div>
        </div>
      </section>

      {/* WELCOME BONUS */}
      {showWelcomeBonus && !fullScreenNotification && (
        <div className="card welcome-bonus-card">
          <h3>🎉 Welcome Bonus</h3>
          <p>You’ve received KES 1,200 as a welcome bonus!</p>
          <button className="primary-btn" onClick={handleWelcomeBonusWithdraw}>
            Withdraw
          </button>
        </div>
      )}

      {/* PRIMARY ACTION → SURVEYS */}
      <h3 ref={surveySectionRef} className="section-title">
        Survey Plans
      </h3>

      {Object.entries(PLANS).map(([key, plan]) => (
        <div key={key} className={`card plan-card plan-${key.toLowerCase()}`}>
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

      {/* SECONDARY → WITHDRAW */}
      <h3 className="section-title">💸 Withdraw Earnings</h3>

      {Object.entries(PLANS).map(([key, plan]) => (
        <div key={key} className="card withdraw-card">
          <div>
            <h4>{plan.icon} {plan.name}</h4>
            <strong>
              KES {isCompleted(key) ? plan.total.toLocaleString() : "0"}
            </strong>
          </div>
          <button
            className="withdraw-btn"
            onClick={() => handleWithdrawClick(key)}
          >
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

          <button
            className="primary-btn"
            disabled={submitting}
            onClick={submitWithdraw}
          >
            {submitting ? "Submitting..." : "Submit Withdrawal"}
          </button>

          <button
            className="outline-btn"
            onClick={() => setActiveWithdrawPlan("")}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
