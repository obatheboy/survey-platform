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
  
  // Check if we're in development mode (simpler approach)
  const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.hostname.includes('local');

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
     LOAD USER AND PLAN DATA - FIXED VERSION
  ========================= */
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user data
        const res = await api.get(`/auth/me?_t=${Date.now()}`);
        setUserName(res.data.full_name || "User");

        // COMPREHENSIVE DEBUG
        console.log("🔍 ===== ACTIVATION NOTICE LOAD DEBUG =====");
        console.log("🔍 Full location.state:", location.state);
        console.log("🔍 location.state?.planKey:", location.state?.planKey);
        console.log("🔍 location.state?.planType:", location.state?.planType);
        console.log("🔍 location.state?.plan:", location.state?.plan);
        console.log("🔍 location.state?.plan?.planKey:", location.state?.plan?.planKey);
        console.log("🔍 location.state?.plan?.type:", location.state?.plan?.type);
        
        // FIXED LOGIC: Handle both plan object and planKey
        let statePlanKey = null;
        let stateAmount = null;
        
        // Check if planKey was passed directly
        if (location.state?.planKey) {
          statePlanKey = location.state.planKey;
          stateAmount = location.state.amount;
          console.log("✅ Using planKey from state:", statePlanKey);
        }
        // Check if a plan object was passed
        else if (location.state?.plan) {
          // The plan object might have planKey or type property
          statePlanKey = location.state.plan.planKey || location.state.plan.type;
          stateAmount = location.state.plan.amount || location.state.plan.total;
          console.log("✅ Using planKey from plan object:", statePlanKey);
        }
        // Legacy support for planType
        else if (location.state?.planType) {
          statePlanKey = location.state.planType;
          stateAmount = location.state.amount;
          console.log("✅ Using planType from state:", statePlanKey);
        }
        
        console.log("🔍 Determined statePlanKey:", statePlanKey);
        
        if (statePlanKey) {
          // Ensure planKey is uppercase
          statePlanKey = statePlanKey.toUpperCase();
          setPlanKey(statePlanKey);
          setTotalEarned(stateAmount || PLAN_CONFIG[statePlanKey]?.total || 0);
          setLoading(false);
          return;
        }

        console.log("⚠️ No plan found in location.state, checking user data...");
        
        // If no state, check backend for active plan
        const activePlan = res.data.active_plan;
        const userPlans = res.data.plans || {};
        
        console.log("🔍 User active_plan:", activePlan);
        console.log("🔍 User plans:", userPlans);

        // Find which plan is completed but not activated
        let planToActivate = null;
        
        // Check in order: VVIP -> VIP -> REGULAR
        if (userPlans.VVIP?.completed && !userPlans.VVIP?.is_activated) {
          planToActivate = "VVIP";
        } else if (userPlans.VIP?.completed && !userPlans.VIP?.is_activated) {
          planToActivate = "VIP";
        } else if (userPlans.REGULAR?.completed && !userPlans.REGULAR?.is_activated) {
          planToActivate = "REGULAR";
        } else {
          planToActivate = activePlan;
        }
        
        console.log("🔍 Plan to activate determined:", planToActivate);
        
        if (!planToActivate) {
          console.log("❌ No plan to activate, redirecting to dashboard");
          navigate("/dashboard");
          return;
        }

        const plan = userPlans[planToActivate];

        if (!plan) {
          console.log("❌ Plan data not found, redirecting to dashboard");
          navigate("/dashboard");
          return;
        }

        // Check if plan needs activation
        if (plan.is_activated) {
          console.log("⚠️ Plan already activated, redirecting to dashboard");
          navigate("/dashboard?activated=true");
          return;
        }

        // Check if surveys are completed
        if (!plan.completed) {
          console.log("⚠️ Surveys not completed, redirecting to dashboard");
          navigate("/dashboard");
          return;
        }

        setPlanKey(planToActivate);
        setTotalEarned(PLAN_CONFIG[planToActivate]?.total || 0);
        console.log("✅ Plan loaded successfully:", planToActivate);
        console.log("🔍 ===== END LOAD DEBUG =====");
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
    console.log("🟢 ===== ACTIVATION NOTICE DEBUG =====");
    console.log("🟢 Current planKey:", planKey);
    console.log("🟢 Plan config for this key:", PLAN_CONFIG[planKey]);
    console.log("🟢 User name:", userName);
    
    // FIX: Make sure we're passing planKey (string), not plan object
    navigate("/activate", { 
      state: { 
        planKey: planKey,  // This MUST be a string like "VVIP"
        activationFee: PLAN_CONFIG[planKey]?.activationFee,
        amount: totalEarned,
        userName: userName
      }
    });
    
    console.log("🟢 Navigating to /activate with state:", { 
      planKey: planKey,
      activationFee: PLAN_CONFIG[planKey]?.activationFee,
      amount: totalEarned 
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
          <p className="action-description"></p>
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

        {/* DEBUG INFO - Shows in local development */}
        {isDevelopment && (
          <div style={{
            marginTop: '15px',
            padding: '10px',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#3b82f6'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>🔍 DEBUG INFO:</div>
            <div>Plan Key: <strong>{planKey}</strong></div>
            <div>Plan Label: <strong>{plan.label}</strong></div>
            <div>Activation Fee: <strong>KES {plan.activationFee}</strong></div>
            <div>Total Earned: <strong>KES {totalEarned}</strong></div>
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
              This debug info only shows on localhost
            </div>
          </div>
        )}

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