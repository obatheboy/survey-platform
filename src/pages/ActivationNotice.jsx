// ========================= ActivationNotice.jsx =========================
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/api";
import "./ActivationNotice.css";

/* =========================
   PLAN CONFIG
========================= */
const PLAN_CONFIG = {
  REGULAR: {
    label: "Regular Plan",
    activationFee: 100,
    color: "#10b981",
    icon: "⭐",
    total: 1500,
  },
  VIP: {
    label: "VIP Plan",
    activationFee: 150,
    color: "#6366f1",
    icon: "💎",
    total: 2000,
  },
  VVIP: {
    label: "VVIP Plan",
    activationFee: 200,
    color: "#f59e0b",
    icon: "👑",
    total: 3000,
  },
};

export default function ActivationNotice() {
  const navigate = useNavigate();
  const location = useLocation();

  const [planKey, setPlanKey] = useState(null);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");

  /* =========================
     SCROLL TO TOP ON MOUNT
  ========================= */
  useEffect(() => {
    // Scroll to top immediately when component mounts
    window.scrollTo(0, 0);
    
    // Also scroll smoothly after a tiny delay for better UX
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
    
    return () => clearTimeout(timer);
  }, []); // Empty dependency array = runs only on mount

  /* =========================
     LOAD USER AND PLAN DATA
  ========================= */
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user data
        const res = await api.get(`/auth/me?_t=${Date.now()}`);
        setUserName(res.data.full_name || "User");

        // Check for passed state from navigation
        const statePlanKey = location.state?.planType || location.state?.plan?.type;
        const stateAmount = location.state?.amount || location.state?.plan?.amount;

        if (statePlanKey) {
          setPlanKey(statePlanKey);
          setTotalEarned(stateAmount || PLAN_CONFIG[statePlanKey]?.total || 0);
          setLoading(false);
          return;
        }

        // If no state, check backend
        const activePlan = res.data.active_plan;
        const plan = res.data.plans?.[activePlan];

        if (!activePlan || !plan) {
          navigate("/dashboard");
          return;
        }

        // Check if plan needs activation
        if (plan.is_activated) {
          navigate("/dashboard?activated=true");
          return;
        }

        // Check if surveys are completed
        if (plan.surveys_completed < 10) {
          navigate("/dashboard");
          return;
        }

        setPlanKey(activePlan);
        setTotalEarned(PLAN_CONFIG[activePlan]?.total || 0);
      } catch (err) {
        console.error("Error loading activation details:", err);
        setError("Unable to load activation details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate, location.state]);

  const handleActivate = () => {
    navigate("/activate", { 
      state: { 
        plan: planKey,
        activationFee: PLAN_CONFIG[planKey]?.activationFee,
        amount: totalEarned 
      }
    });
  };

  /* =========================
     LOADING STATE
  ========================= */
  if (loading) {
    return (
      <div className="activation-notice-page loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your activation details...</p>
        </div>
      </div>
    );
  }

  /* =========================
     ERROR STATE
  ========================= */
  if (error) {
    return (
      <div className="activation-notice-page">
        <div className="notice-card error">
          <div className="error-icon">⚠️</div>
          <h2>Something Went Wrong</h2>
          <p className="error-message">{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="primary-button"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* =========================
     NO PLAN STATE
  ========================= */
  if (!planKey) {
    return (
      <div className="activation-notice-page">
        <div className="notice-card">
          <div className="no-plan-icon">📋</div>
          <h2>Select a Plan First</h2>
          <p>Please complete surveys for a plan before activation.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="primary-button"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const plan = PLAN_CONFIG[planKey];
  if (!plan) return null;

  /* =========================
     MAIN CONTENT - SIMPLIFIED
  ========================= */
  return (
    <div className="activation-notice-page simple">
      {/* SIMPLE NOTICE CARD */}
      <div className="simple-notice-card">
        {/* SUCCESS ICON */}
        <div className="simple-success-icon">
          <div className="success-check">✓</div>
          <div className="success-glow"></div>
        </div>

        {/* HEADING */}
        <h1 className="simple-title">
    
         🎉🎉 CONGRATULATIONS🎉🎉
          
        </h1>

        {/* USER GREETING */}
        <p className="simple-greeting">
          Great work, <strong>{userName.split(' ')[0]}</strong>! 👏
        </p>
{/* SUCCESS MESSAGE */}
<div className="simple-message">
  <h2>Surveys Completed! ✅</h2>
  <p>
    You have successfully completed all surveys for the{" "}
    <strong style={{ color: plan.color }}>{plan.label} SURVEY</strong> and earned{" "}
    <strong style={{ color: plan.color }}>KES {plan.total}</strong>.
  </p>
  <p>
    Now activate your account by paying activation fee of{" "}
    <strong style={{ color: "#dc2626" }}>KES {plan.activationFee}</strong> and immediately withdraw your earnings.
  </p>
  <p style={{ fontWeight: 600, fontSize: "14px", color: "#6366f1", marginTop: "8px" }}>
    💡 Remember: Account will be activated automatically after paying activation fee!
  </p>
</div>
        {/* EARNINGS SUMMARY */}
        <div className="simple-earnings">
          <div className="earnings-badge" style={{ background: plan.color }}>
            <span className="earnings-icon">💰</span>
            <span className="earnings-text">
              KES {totalEarned.toLocaleString()}
            </span>
          </div>
          <p className="earnings-note">Now Activate your Account and Withdraw Immediately</p>
        </div>

        {/* CALL TO ACTION */}
        <div className="simple-action">
          <h3>Tap the button below,Follow all steps and withdraw your money. 🚀</h3>
          <p className="action-description">
          </p>
        </div>

        {/* ACTIVATE BUTTON */}
        <button
          onClick={handleActivate}
          className="simple-activate-button"
          style={{ background: plan.color }}
        >
          <span className="button-icon">🔓</span>
          Activate & Withdraw Now
          <span className="button-arrow">→</span>
        </button>

     
       
        
          <div className="info-item">
            <span className="info-icon">👑</span>
            <span className="info-text">One-time activation fee</span>
          </div>
        

        {/* BACK BUTTON */}
        <button
          onClick={() => navigate("/dashboard")}
          className="simple-back-button"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}