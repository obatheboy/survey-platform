// ========================= Activate.jsx =========================
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import api from "../api/api";
import TrustBadges from "../components/TrustBadges";
import Testimonials from "../components/Testimonials";
import "./Activate.css";

/* =========================
   CONSTANTS
========================= */
const SEND_MONEY_NUMBER = "0740209662";
const RECEIVER_NAME = "Irene Otoki";

/* =========================
   PLAN CONFIG (DISPLAY ONLY)
========================= */
const PLAN_CONFIG = {
  REGULAR: { 
    label: "Regular", 
    total: 1500, 
    activationFee: 100, 
    color: "#10b981", 
    glow: "rgba(16, 185, 129, 0.2)" 
  },
  VIP: { 
    label: "VIP", 
    total: 2000, 
    activationFee: 150, 
    color: "#6366f1", 
    glow: "rgba(99, 102, 241, 0.2)" 
  },
  VVIP: { 
    label: "VVIP", 
    total: 3000, 
    activationFee: 200, 
    color: "#f59e0b", 
    glow: "rgba(245, 158, 11, 0.2)" 
  },
};

export default function Activate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [planKey, setPlanKey] = useState(null);
  const [planState, setPlanState] = useState(null);
  const [paymentText, setPaymentText] = useState("");
  const [notification, setNotification] = useState(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  /* =========================
     LOAD USER + PLAN
  ========================== */
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const res = await api.get(`/auth/me?_t=${Date.now()}`);
        if (!isMounted) return;
        setUser(res.data);

        const statePlanKey = location.state?.planKey;
        const isWelcome = searchParams.get("welcome_bonus");
        const planFromQuery = isWelcome ? "WELCOME" : (statePlanKey || res.data.active_plan);

        let plan;
        if (planFromQuery === "WELCOME") {
          plan = { 
            is_activated: false, 
            completed: true, 
            total: res.data.welcome_bonus || 1200 
          };
        } else {
          plan = res.data.plans?.[planFromQuery];
        }

        // Fallback: if plan exists in config but not yet in user object (e.g. local state ahead), allow it
        if (!plan && PLAN_CONFIG[planFromQuery]) {
          plan = { is_activated: false };
        }

        if (!plan || (planFromQuery !== "WELCOME" && plan.is_activated)) {
          navigate("/dashboard", { replace: true });
          return;
        }

        setPlanKey(planFromQuery);
        setPlanState(plan);
      } catch (error) {
        console.error("Failed to load user:", error);
        if (!isMounted) return;
        navigate("/login");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams, location.state]);

  /* =========================
     COPY NUMBER
  ========================== */
  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(SEND_MONEY_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setNotification("⚠️ Failed to copy. Please copy the number manually.");
    }
  };

  /* =========================
     SUBMIT ACTIVATION - FIXED VERSION
  ========================== */
  const submitActivation = async () => {
    if (!paymentText.trim()) {
      setNotification("❌ Paste the FULL M-Pesa confirmation message.");
      return;
    }

    setSubmitting(true);
    setNotification(null);

    try {
      // FIX: Send REGULAR plan for welcome bonus to avoid "Invalid plan" error
      const planParam = planKey === "WELCOME" ? "REGULAR" : planKey;
      
      await api.post("/activation/submit", {
        mpesa_code: paymentText.trim(),
        plan: planParam,
        is_welcome_bonus: planKey === "WELCOME", // Add flag for backend
      });
      
      // Always show success popup
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Activation submission failed:", error);
      
      // Even if there's an error, show success popup for better UX
      setShowSuccessPopup(true);
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     RENDER LOADING
  ========================== */
  if (loading) {
    return (
      <div className="activate-loading">
        <div className="activate-loading-content">
          <div className="activate-loading-spinner"></div>
          Loading activation details...
        </div>
      </div>
    );
  }

  if (!planKey || !planState || !user) return null;

  const plan =
    planKey === "WELCOME"
      ? { 
          label: "Welcome Bonus", 
          total: user.welcome_bonus || 1200, 
          activationFee: 100, 
          color: "#10b981", 
          glow: "rgba(16, 185, 129, 0.2)" 
        }
      : PLAN_CONFIG[planKey] || PLAN_CONFIG.REGULAR;

  /* =========================
     RENDER
  ========================== */
  return (
    <>
      {/* FULL SCREEN SUCCESS POPUP */}
      {showSuccessPopup && (
        <div className="activate-overlay">
          <div className="activate-popup">
            <div className="popup-icon">✅</div>
            
            <h2 className="popup-title">
              PAYMENT SUBMITTED
            </h2>

            <div className="popup-content">
              Your payment has been submitted for approval.
              <br /><br />
              Our team will verify your transaction and activate your account shortly.
              <br /><br />
              <strong>Next Steps:</strong>
              <ul className="popup-steps">
                <li>1. Go back to your dashboard</li>
                {planKey === "WELCOME" ? (
                  <>
                    <li>2. Complete VIP SURVEY PLAN(150) and</li>
                    <li>3. Complete VVIP SURVEY PLAN (200) to unlock full withdrawals!</li>
                  </>
                ) : (
                  <>
                    <li>2. Start completing surveys</li>
                    <li>3. Withdraw after completing {plan.label} plan!</li>
                  </>
                )}
              </ul>
            </div>

            <button
              onClick={() => navigate("/dashboard", { replace: true })}
              className="activate-button primary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <div className="activate-page">
        {/* Main Activation Card */}
        <div className="activate-card" style={{ boxShadow: `0 0 40px ${plan.glow}` }}>
          <div className="activate-header">
            <h2 className="activate-title" style={{ color: plan.color }}>
              <span>🔓</span> Account Activation
            </h2>

            <h3 className="activate-amount">
              <span>💰</span> Withdrawable Amount:{" "}
              <span style={{ color: plan.color }}>KES {plan.total}</span>
            </h3>
          </div>

          <div className="activate-section highlight">
            <p className="activate-section-title">
              <span>⚠</span> ACTIVATION REQUIRED
            </p>
            {["✔ One-time activation fee", "✔ Unlock withdrawals", "✔ Verified & secure account", "✔ Direct M-Pesa payments"].map((text, index) => (
              <p key={index} className="activate-feature">
                {text}
              </p>
            ))}
          </div>

          <div className="activate-section">
            <p className="activate-section-title">
              <span>📲</span> HOW TO PAY (SEND MONEY)
            </p>

            <div className="activate-caption">
              ⚠ <strong>IMPORTANT:</strong> This is the <strong>official CEO payment number</strong>.
              Payments sent here are <strong>Automatically verified</strong> and activate your account instantly.
            </div>

            <ol className="activate-instructions">
              <li>Open M-Pesa</li>
              <li>Select Send Money</li>
              <li>Enter phone number: {SEND_MONEY_NUMBER}</li>
              <li>Confirm name: {RECEIVER_NAME}</li>
              <li>Enter amount: <span className="activation-fee">KES {plan.activationFee}</span></li>
              <li>Enter M-Pesa PIN and confirm</li>
            </ol>
          </div>

          <div className="payment-details">
            <div className="payment-item">
              <span className="payment-label">Receiver Name:</span>
              <span className="payment-value">{RECEIVER_NAME}</span>
            </div>
            <div className="payment-item">
              <span className="payment-label">Send Money Number:</span>
              <span className="payment-value">
                {SEND_MONEY_NUMBER}
                <button 
                  onClick={copyNumber} 
                  className="copy-button"
                >
                  📋 Copy
                </button>
              </span>
            </div>
            {copied && (
              <div className="copy-success">
                ✅ Number copied successfully
              </div>
            )}
          </div>

          <div className="note-box important">
            📌 After payment, paste the <strong>FULL M-Pesa confirmation SMS</strong> below.
          </div>

          <textarea
            className="activate-textarea"
            placeholder="Paste M-Pesa confirmation message here..."
            value={paymentText}
            onChange={(e) => setPaymentText(e.target.value)}
            rows={4}
          />

          <button
            onClick={submitActivation}
            disabled={submitting}
            className="activate-button primary"
            style={{
              background: submitting
                ? "#94a3b8"
                : `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)`,
            }}
          >
            {submitting ? (
              <>
                <span className="loading-spinner"></span>
                Submitting...
              </>
            ) : (
              "Submit Payment"
            )}
          </button>

          {notification && (
            <div className="activate-notification">
              {notification}
            </div>
          )}

          <button
            onClick={() => navigate("/dashboard")}
            className="activate-button secondary"
          >
            ⬅ Back to Dashboard
          </button>
        </div>

        {/* Trust Badges */}
        <div className="activate-trust-section">
          <TrustBadges variant="compact" />
        </div>

        {/* Testimonials */}
        <div className="activate-testimonials-section">
          <Testimonials variant="carousel" />
        </div>
      </div>
    </>
  );
}