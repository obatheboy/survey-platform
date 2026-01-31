// ========================= Activate.jsx (Mobile Optimized) =========================
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
   PLAN CONFIG
========================= */
const PLAN_CONFIG = {
  REGULAR: { 
    label: "Regular", 
    total: 1500, 
    activationFee: 100, 
    color: "#10b981"
  },
  VIP: { 
    label: "VIP", 
    total: 2000, 
    activationFee: 150, 
    color: "#6366f1"
  },
  VVIP: { 
    label: "VVIP", 
    total: 3000, 
    activationFee: 200, 
    color: "#f59e0b"
  },
};

/* =========================
   MOBILE-OPTIMIZED STYLES
========================= */
const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--bg-main)",
    padding: "16px",
    paddingTop: "80px",
    paddingBottom: "40px",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    maxWidth: "100%",
    background: "var(--bg-surface)",
    padding: "20px",
    borderRadius: "16px",
    color: "var(--text-main)",
    border: "1px solid var(--border-soft)",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.08)",
    marginBottom: "24px",
  },
  header: {
    textAlign: "center",
    marginBottom: "20px",
  },
  planBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "20px",
    background: "var(--primary-light)",
    color: "var(--primary)",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "8px",
  },
  amount: {
    fontSize: "28px",
    fontWeight: 800,
    margin: "8px 0",
  },
  section: {
    background: "var(--bg-main)",
    border: "1px solid var(--border-soft)",
    borderRadius: "12px",
    padding: "16px",
    marginTop: "16px",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: 800,
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  stepsList: {
    fontSize: "13px",
    lineHeight: "1.6",
    paddingLeft: "18px",
    margin: 0,
  },
  stepItem: {
    marginBottom: "8px",
  },
  paymentInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    fontSize: "14px",
  },
  copyRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "var(--bg-main)",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid var(--border-medium)",
    marginTop: "8px",
  },
  copyBtn: {
    padding: "8px 16px",
    background: "var(--primary)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  textarea: {
    width: "100%",
    padding: "14px",
    marginTop: "16px",
    borderRadius: "10px",
    border: "2px solid var(--border-medium)",
    background: "var(--bg-surface)",
    color: "var(--text-main)",
    fontSize: "14px",
    fontFamily: "inherit",
    minHeight: "100px",
    resize: "vertical",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "16px",
    borderRadius: "12px",
    fontWeight: 700,
    fontSize: "16px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginTop: "20px",
    transition: "all 0.2s",
  },
  backButton: {
    background: "transparent",
    border: "2px solid var(--primary)",
    color: "var(--primary)",
    marginTop: "12px",
  },
  notification: {
    padding: "12px",
    borderRadius: "8px",
    marginTop: "16px",
    fontSize: "13px",
    fontWeight: 600,
    textAlign: "center",
  },
  success: {
    background: "rgba(16, 185, 129, 0.1)",
    border: "1px solid #10b981",
    color: "#10b981",
  },
  error: {
    background: "rgba(220, 38, 38, 0.1)",
    border: "1px solid #dc2626",
    color: "#dc2626",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--text-muted)",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.95)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    padding: "20px",
  },
  overlayCard: {
    width: "100%",
    maxWidth: "400px",
    background: "var(--bg-surface)",
    padding: "24px",
    borderRadius: "16px",
    textAlign: "center",
  },
  overlayIcon: {
    fontSize: "48px",
    marginBottom: "16px",
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
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setNotification("⚠️ Failed to copy. Copy manually.");
    }
  };

  /* =========================
     SUBMIT ACTIVATION
  ========================== */
  const submitActivation = async () => {
    if (!paymentText.trim()) {
      setNotification("❌ Paste the M-Pesa confirmation message.");
      return;
    }

    setSubmitting(true);
    setNotification(null);

    try {
      const planParam = planKey === "WELCOME" ? "REGULAR" : planKey;
      
      await api.post("/activation/submit", {
        mpesa_code: paymentText.trim(),
        plan: planParam,
        is_welcome_bonus: planKey === "WELCOME",
      });
      
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Activation failed:", error);
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
      <div style={styles.loadingContainer}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "32px",
            height: "32px",
            border: "3px solid rgba(0, 0, 0, 0.1)",
            borderTopColor: "#2563eb",
            borderRadius: "50%",
            margin: "0 auto 12px",
            animation: "spin 1s linear infinite"
          }}></div>
          Loading...
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
          color: "#10b981"
        }
      : PLAN_CONFIG[planKey] || PLAN_CONFIG.REGULAR;

  /* =========================
     RENDER
  ========================== */
  return (
    <>
      {/* SUCCESS POPUP */}
      {showSuccessPopup && (
        <div style={styles.overlay}>
          <div style={styles.overlayCard}>
            <div style={{...styles.overlayIcon, color: "#10b981"}}>
              ✅
            </div>
            
            <h2 style={{ 
              color: "#10b981", 
              fontSize: "20px",
              fontWeight: 800,
              marginBottom: "12px"
            }}>
              PAYMENT SUBMITTED
            </h2>

            <p style={{ 
              fontSize: "14px",
              lineHeight: "1.6",
              color: "#64748b",
              marginBottom: "24px"
            }}>
              Your payment is being verified. Account will be activated shortly.
            </p>

            <button
              onClick={() => navigate("/dashboard", { replace: true })}
              style={{
                ...styles.button,
                background: "#2563eb",
                color: "white",
                marginTop: "0",
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <div style={styles.page}>
        {/* Activation Card */}
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.planBadge}>
              🔓 {plan.label} Activation
            </div>
            <div style={{...styles.amount, color: plan.color}}>
              KES {plan.total}
            </div>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Withdrawable after activation
            </div>
          </div>

          {/* Steps */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              📲 HOW TO PAY
            </div>
            <ol style={styles.stepsList}>
              <li style={styles.stepItem}>Open M-Pesa</li>
              <li style={styles.stepItem}>Select Send Money</li>
              <li style={styles.stepItem}>Number: <strong>{SEND_MONEY_NUMBER}</strong></li>
              <li style={styles.stepItem}>Name: <strong>{RECEIVER_NAME}</strong></li>
              <li style={styles.stepItem}>Amount: <strong style={{color: "#dc2626"}}>KES {plan.activationFee}</strong></li>
              <li style={styles.stepItem}>Enter PIN & confirm</li>
            </ol>
          </div>

          {/* Payment Info */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>
              📋 PAYMENT DETAILS
            </div>
            <div style={styles.paymentInfo}>
              <div>
                <strong>Receiver:</strong> {RECEIVER_NAME}
              </div>
              <div>
                <strong>Number:</strong> {SEND_MONEY_NUMBER}
              </div>
              <div style={styles.copyRow}>
                <span>Tap to copy:</span>
                <button 
                  onClick={copyNumber} 
                  style={styles.copyBtn}
                >
                  {copied ? "✅ Copied" : "📋 Copy"}
                </button>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
              Paste M-Pesa confirmation:
            </div>
            <textarea
              placeholder="Paste the full SMS here..."
              value={paymentText}
              onChange={(e) => setPaymentText(e.target.value)}
              style={styles.textarea}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={submitActivation}
            disabled={submitting}
            style={{
              ...styles.button,
              background: plan.color,
              color: "white",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Submitting..." : "Submit Payment"}
          </button>

          {/* Back Button */}
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              ...styles.button,
              ...styles.backButton,
            }}
          >
            ← Back to Dashboard
          </button>

          {/* Notification */}
          {notification && (
            <div style={{
              ...styles.notification,
              ...(notification.includes("❌") ? styles.error : styles.success)
            }}>
              {notification}
            </div>
          )}
        </div>

        {/* Trust Badges - Compact Mobile Version */}
        <div style={{ marginTop: "24px" }}>
          <TrustBadges variant="mobile" />
        </div>

        {/* Testimonials - Optional for mobile (can be removed if space is tight) */}
        <div style={{ marginTop: "32px" }}>
          <Testimonials variant="mobile" />
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}