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

  /* =========================
     STATE (WITH CACHE)
  ========================= */
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

  /* =========================
     WITHDRAW STATE
  ========================= */
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawMessage, setWithdrawMessage] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeWithdrawPlan, setActiveWithdrawPlan] = useState("");

  /* =========================
     LOAD + AUTO REFRESH
  ========================= */
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await api.get("/auth/me");
        if (!alive) return;

        setUser(res.data);
        setPlans(res.data.plans || {});
        localStorage.setItem("cached_user", JSON.stringify(res.data));
      } catch {
        // silent fail
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
     HELPERS
  ========================= */
  const surveysDone = (plan) => plans[plan]?.surveys_completed || 0;
  const isCompleted = (plan) => plans[plan]?.completed === true;
  const isActivated = (plan) => plans[plan]?.is_activated === true;
  const activationSubmitted = (plan) =>
    plans[plan]?.activation_status === "SUBMITTED";

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
    navigate("/activation-notice");
  };

  const handleWithdrawClick = (plan) => {
    if (!isCompleted(plan)) {
      setToast("Complete all surveys to unlock withdrawal");
      surveySectionRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => setToast(""), 3000);
      return;
    }

    if (!isActivated(plan)) {
      if (activationSubmitted(plan)) {
        setToast("Activation submitted. Waiting for admin approval.");
      } else {
        openActivationNotice(plan);
      }
      setTimeout(() => setToast(""), 3000);
      return;
    }

    setWithdrawAmount("");
    setWithdrawPhone("");
    setWithdrawMessage("");
    setWithdrawError("");
    setSubmitting(false);
    setActiveWithdrawPlan(plan);
  };

  const submitWithdraw = async () => {
    setWithdrawMessage("");
    setWithdrawError("");

    if (!withdrawAmount || !withdrawPhone) {
      setWithdrawError("Enter both amount and phone number.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/withdraw/request", {
        phone_number: withdrawPhone,
        amount: Number(withdrawAmount),
      });

      setWithdrawMessage("Withdrawal request submitted successfully.");

      const updatedUser = await api.get("/auth/me");
      setUser(updatedUser.data);
      setPlans(updatedUser.data.plans || {});
      localStorage.setItem("cached_user", JSON.stringify(updatedUser.data));
    } catch (err) {
      setWithdrawError(err.response?.data?.message || "Withdraw failed.");
    } finally {
      setSubmitting(false);
    }
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

      <MainMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} user={user} />
      <LiveWithdrawalFeed />

      {/* WITHDRAW */}
      <h3 className="section-title withdraw-title">💸 Withdraw Earnings</h3>

      {Object.entries(PLANS).map(([key, plan]) => (
        <div key={key} className="card withdraw-card">
          <div>
            <h4>{plan.icon} {plan.name}</h4>
            <strong>KES {isCompleted(key) ? plan.total.toLocaleString() : "0"}</strong>
          </div>

          <div className="withdraw-actions">
            <button
              className="outline-btn"
              onClick={() => handleWithdrawClick(key)}
            >
              Withdraw
            </button>

            {/* INLINE FORM – APPEARS NEXT TO BUTTON */}
            {activeWithdrawPlan === key && (
              <div className="withdraw-form inline">
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
                  placeholder="Phone"
                  value={withdrawPhone}
                  onChange={(e) => setWithdrawPhone(e.target.value)}
                />

                <button
                  className="primary-btn"
                  onClick={submitWithdraw}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit"}
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
        </div>
      ))}

      {/* SURVEYS */}
      <h3 ref={surveySectionRef} className="section-title">
        Survey Plans
      </h3>

      {Object.entries(PLANS).map(([key, plan]) => {
        const completed = isCompleted(key);
        const planClass =
          key === "REGULAR"
            ? "plan-regular"
            : key === "VIP"
            ? "plan-vip"
            : "plan-vvip";

        const titleClass =
          key === "REGULAR"
            ? "regular"
            : key === "VIP"
            ? "vip"
            : "vvip";

        return (
          <div key={key} className={`card plan-card ${planClass}`}>
            <div>
              <h4 className={`plan-title ${titleClass}`}>
                {plan.icon} {plan.name}
              </h4>
              <p><b>Total Earnings:</b> KES {plan.total}</p>
              <p><b>Per Survey:</b> KES {plan.perSurvey}</p>
              <p>
                <b>Progress:</b> {surveysDone(key)} / {TOTAL_SURVEYS}
              </p>
            </div>

            <button
              className="primary-btn plan-btn"
              onClick={() =>
                completed ? openActivationNotice(key) : startSurvey(key)
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
