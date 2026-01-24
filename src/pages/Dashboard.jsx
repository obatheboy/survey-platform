// ========================= Dashboard.jsx =========================
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import MainMenuDrawer from "./components/MainMenuDrawer.jsx";
import LiveWithdrawalFeed from "./components/LiveWithdrawalFeed.jsx";
import Notifications from "./components/Notifications.jsx";
import "./Dashboard.css";
import "./Dashboard-Enhanced.css";

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
  const withdrawRef = useRef(null);

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
        localStorage.setItem("cachedUser", JSON.stringify(resUser.data));
        setShowWelcomeBonus(true);
      } catch (err) {
        console.error("Dashboard load failed:", err);
        if (!navigator.onLine) {
          const cachedUser = localStorage.getItem("cachedUser");
          if (cachedUser) {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
            setPlans(parsedUser.plans || {});
            setShowWelcomeBonus(true);
          }
        }
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
  const isCompleted = (plan) => surveysDone(plan) >= TOTAL_SURVEYS;
  const isActivated = (plan) => plans[plan]?.is_activated === true;
  const activationSubmitted = (plan) => plans[plan]?.activation_status === "SUBMITTED";

  const earnedSoFar = (plan) =>
    surveysDone(plan) * PLANS[plan].perSurvey;

  /* =========================
     TAB + SCROLL
  ========================= */
  const goToSurveys = () => {
    setActiveTab("SURVEYS");
    setTimeout(() => {
      surveyRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const goToWithdraw = () => {
    setActiveTab("WITHDRAW");
    setTimeout(() => {
      withdrawRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

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
      goToSurveys();
      setTimeout(() => setToast(""), 3000);
      return;
    }

    if (!isActivated(plan)) {
      setFullScreenNotification({
        message: activationSubmitted(plan)
          ? "Activation submitted. Awaiting approval."
          : "❌ Account not activated.",
        redirect: activationSubmitted(plan) ? null : "/activation-notice",
      });
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
  {/* Greeting */}
  <div className="card greeting">
    <h3>
      Welcome back, <span className="user-name">{user.full_name}</span> 👋
    </h3>
    <p className="subtitle">
      Complete surveys, earn rewards, and withdraw instantly.
    </p>
  </div>

  {/* Earnings Summary */}
  <div className="earnings">
    <div className="earnings-card total">
      <span>Total Earnings</span>
      <strong>
        KES {Number(user.total_earned || 0).toLocaleString()}
      </strong>
    </div>

    <div className="earnings-card balance">
      <span>Available Balance</span>
      <strong>
        KES {Number(user.total_earned || 0).toLocaleString()}
      </strong>
    </div>
  </div>
</section>

      {/* ================= WELCOME BONUS ================= */}
      {showWelcomeBonus && (
        <div className="card welcome-bonus-card-enhanced">
          <div className="bonus-header">
            <span className="bonus-icon">🎁</span>
            <h2>Welcome Bonus Unlocked!</h2>
          </div>
          
          <div className="bonus-amount">
            <span className="currency">KES</span>
            <span className="amount">1,200</span>
          </div>
          
          <div className="bonus-message">
            <p className="main-text">
              🎉 Congratulations! You've received a <strong>KES 1,200</strong> welcome bonus!
            </p>
            <p className="sub-text">
              To withdraw this bonus, simply activate your account with just <strong>KES 100</strong>
            </p>
          </div>

          <div className="roi-highlight">
            <div className="roi-item">
              <span className="label">You Pay:</span>
              <span className="value">KES 100</span>
            </div>
            <div className="roi-arrow">→</div>
            <div className="roi-item">
              <span className="label">You Get:</span>
              <span className="value green">KES 1,200</span>
            </div>
          </div>

          <p className="roi-text">
            That's <strong>12x</strong> return on your investment!
          </p>

          <button className="activate-cta-btn" onClick={handleWelcomeBonusWithdraw}>
            <span className="btn-icon">🔓</span>
            Activate Now & Withdraw KES 1,200
          </button>

          <div className="trust-indicators">
            <span>✓ Instant Activation</span>
            <span>✓ Secure Payment</span>
            <span>✓ 15,000+ Users</span>
          </div>
        </div>
      )}

      {/* ================= TABS ================= */}
      <div className="dashboard-tabs">
        <button className={activeTab === "SURVEYS" ? "active" : ""} onClick={goToSurveys}>
          Surveys
        </button>
        <button className={activeTab === "WITHDRAW" ? "active" : ""} onClick={goToWithdraw}>
          Withdraw
        </button>
      </div>
{/* ================= SURVEYS ================= */}
{activeTab === "SURVEYS" && (
  <section ref={surveyRef} id="surveys-section" className="tab-section">
    {Object.entries(PLANS).map(([key, plan]) => {
      const planClass =
        key === "REGULAR"
          ? "regular"
          : key === "VIP"
          ? "vip"
          : "vvip";

      return (
        <div key={key} className={`card plan-card ${planClass}`}>
          <h4>{plan.icon} {plan.name}</h4>

          <p>
            Per Survey: <strong>KES {plan.perSurvey.toLocaleString()}</strong>
          </p>

          <p>
            Surveys Done: {surveysDone(key)} / {TOTAL_SURVEYS}
          </p>

          <p>
            Earned So Far:{" "}
            <strong>KES {earnedSoFar(key).toLocaleString()}</strong>
          </p>

          <p>
            Total Plan Earnings:{" "}
            <strong>KES {plan.total.toLocaleString()}</strong>
          </p>

          <button
            className="primary-btn"
            onClick={() => startSurvey(key)}
          >
            Start Survey
          </button>
        </div>
      );
    })}
  </section>
)}

      {/* ================= WITHDRAW ================= */}
      {activeTab === "WITHDRAW" && (
        <section ref={withdrawRef} id="withdraw-section" className="tab-section">
          {Object.entries(PLANS).map(([key, plan]) => (
            <div key={key} className="card withdraw-card">
              <div>
                <h4>{plan.icon} {plan.name}</h4>
                <p>Earned: KES {earnedSoFar(key)}</p>
              </div>
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
