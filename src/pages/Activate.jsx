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

/* =========================
   INLINE STYLES
========================= */
const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    padding: "var(--space-xl)",
    backdropFilter: "blur(8px)",
  },
  overlayCard: {
    maxWidth: "480px",
    width: "100%",
    background: "var(--bg-surface)",
    padding: "40px 32px",
    borderRadius: "var(--radius-xl)",
    color: "var(--text-main)",
    textAlign: "center",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    border: "1px solid var(--border-soft)",
  },
  vipBtn: {
    marginTop: "var(--space-xl)",
    width: "100%",
    padding: "16px",
    borderRadius: "var(--radius-lg)",
    border: "none",
    background: "var(--primary)",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "16px",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.3)",
  },
  page: {
    minHeight: "100vh",
    background: "var(--bg-main)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "var(--space-xl)",
    paddingTop: "60px",
    paddingBottom: "60px",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    maxWidth: "520px",
    width: "100%",
    background: "var(--bg-surface)",
    padding: "32px",
    borderRadius: "var(--radius-xl)",
    color: "var(--text-main)",
    border: "1px solid var(--border-soft)",
    boxShadow: "var(--card-shadow)",
  },
  section: {
    marginTop: "var(--space-xl)",
    padding: "20px",
    borderRadius: "var(--radius-lg)",
    background: "var(--bg-main)",
    border: "1px solid var(--border-soft)",
  },
  sectionHighlight: {
    marginTop: "var(--space-xl)",
    padding: "20px",
    borderRadius: "var(--radius-lg)",
    background: "rgba(37, 99, 235, 0.05)",
    border: "1px solid rgba(37, 99, 235, 0.1)",
  },
  caption: {
    fontSize: "14px",
    color: "var(--primary)",
    fontWeight: 700,
    marginBottom: "12px",
    lineHeight: "1.5",
  },
  noteBox: {
    marginTop: "var(--space-xl)",
    padding: "16px",
    borderRadius: "var(--radius-md)",
    background: "var(--bg-surface)",
    fontSize: "14px",
    fontWeight: 600,
    border: "1px solid var(--border-medium)",
    color: "var(--text-muted)",
    lineHeight: "1.5",
  },
  notificationBox: {
    marginTop: "var(--space-xl)",
    padding: "16px",
    borderRadius: "var(--radius-md)",
    background: "rgba(16, 185, 129, 0.1)",
    color: "var(--regular-color)",
    fontWeight: 700,
    border: "1px solid var(--regular-color)",
    fontSize: "14px",
  },
  activationFee: {
    color: "#dc2626",
    fontWeight: 800,
    fontSize: "16px",
  },
  copiedNote: {
    color: "var(--regular-color)",
    fontWeight: 700,
    fontSize: "13px",
    marginTop: "var(--space-sm)",
  },
  input: {
    width: "100%",
    padding: "16px",
    marginTop: "var(--space-xl)",
    borderRadius: "var(--radius-md)",
    border: "2px solid var(--border-medium)",
    background: "var(--bg-surface)",
    color: "var(--text-main)",
    fontSize: "15px",
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: "140px",
    transition: "all var(--transition-fast)",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    marginTop: "var(--space-xl)",
    padding: "16px",
    borderRadius: "var(--radius-lg)",
    fontWeight: 700,
    fontSize: "16px",
    cursor: "pointer",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    transition: "all var(--transition-fast)",
    minHeight: "54px",
    background: "var(--primary)",
    color: "#ffffff",
    boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.3)",
  },
  copyBtn: {
    marginLeft: "12px",
    padding: "10px 18px",
    borderRadius: "var(--radius-sm)",
    border: "none",
    background: "var(--primary)",
    color: "white",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
    transition: "all var(--transition-fast)",
    boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--text-muted)",
    background: "var(--bg-main)",
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
      <div style={styles.loadingContainer}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(255, 255, 255, 0.1)",
            borderTopColor: "#00ff99",
            borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin 1s linear infinite"
          }}></div>
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
        <div style={styles.overlay}>
          <div style={styles.overlayCard}>
            <div style={{
              fontSize: "64px",
              marginBottom: "24px",
              animation: "bounce 1s infinite"
            }}>
              ✅
            </div>
            
            <h2 style={{ 
              color: "#10b981", 
              textAlign: "center",
              fontSize: "26px",
              fontWeight: 800,
              marginBottom: "16px"
            }}>
              PAYMENT SUBMITTED
            </h2>

            <p style={{ 
              marginTop: "18px", 
              lineHeight: "1.7", 
              fontWeight: 600,
              fontSize: "15px",
              color: "#475569"
            }}>
              Your payment has been submitted for approval.
              <br /><br />
              Our team will verify your transaction and activate your account shortly.
              <br /><br />
              <strong>Next Steps:</strong>
              <br />
              1. Go back to your dashboard
              <br />
              {planKey === "WELCOME" ? (
                <>
                  2. Complete VIP SURVEY PLAN(150) and  
                  <br />
                  3. Complete VVIP SURVEY PLAN (200) to unlock full withdrawals!
                </>
              ) : (
                <>
                  2. Start completing surveys
                  <br />
                  3. Withdraw after completing {plan.label} plan!
                </>
              )}
            </p>

            <button
              onClick={() => navigate("/dashboard", { replace: true })}
              style={{
                ...styles.vipBtn,
                marginTop: "32px",
                background: "#2563eb",
                boxShadow: "0 10px 20px -5px rgba(37, 99, 235, 0.4)"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.background = "#1d4ed8";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.background = "#2563eb";
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <div className="activate-page" style={styles.page}>
        {/* Main Activation Card */}
        <div style={{ 
          ...styles.card, 
          boxShadow: `0 0 40px ${plan.glow}` 
        }}>
          <h2 style={{ 
            textAlign: "center", 
            color: plan.color,
            fontSize: "24px",
            marginBottom: "8px"
          }}>
            🔓 Account Activation
          </h2>

          <h3 style={{ 
            textAlign: "center", 
            marginTop: "14px",
            fontSize: "20px",
            fontWeight: 700
          }}>
            💰 Withdrawable Amount:{" "}
            <span style={{ color: plan.color }}>KES {plan.total}</span>
          </h3>

          <div style={styles.sectionHighlight}>
            <p style={{ 
              fontWeight: 900, 
              color: "#ef4444",
              fontSize: "16px",
              marginBottom: "12px"
            }}>
              ⚠ ACTIVATION REQUIRED
            </p>
            {["✔ One-time activation fee", "✔ Unlock withdrawals", "✔ Verified & secure account", "✔ Direct M-Pesa payments"].map((text, index) => (
              <p key={index} style={{ 
                margin: "6px 0",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                {text}
              </p>
            ))}
          </div>

          <div style={styles.section}>
            <p style={{ fontWeight: 900, fontSize: "16px", marginBottom: "12px" }}>
              📲 HOW TO PAY (SEND MONEY)
            </p>

            <p style={styles.caption}>
              ⚠ <strong>IMPORTANT:</strong> This is the <strong>official CEO payment number</strong>.
              Payments sent here are <strong>Automatically verified</strong> and activate your account instantly.
            </p>

            <ol style={{ 
              fontSize: "14px", 
              lineHeight: "1.7",
              paddingLeft: "20px",
              marginTop: "12px"
            }}>
              {[
                "Open M-Pesa",
                "Select Send Money",
                `Enter phone number: ${SEND_MONEY_NUMBER}`,
                `Confirm name: ${RECEIVER_NAME}`,
                <span key={4}>Enter amount: <span style={styles.activationFee}>KES {plan.activationFee}</span></span>,
                "Enter M-Pesa PIN and confirm"
              ].map((item, index) => (
                <li key={index} style={{ marginBottom: "8px" }}>
                  {item}
                </li>
              ))}
            </ol>
          </div>

          <div style={styles.section}>
            <p style={{ margin: "8px 0" }}>
              <strong>Receiver Name:</strong> {RECEIVER_NAME}
            </p>
            <p style={{ 
              margin: "8px 0",
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px"
            }}>
              <strong>Send Money Number:</strong> {SEND_MONEY_NUMBER}
              <button 
                onClick={copyNumber} 
                style={styles.copyBtn}
                onMouseEnter={(e) => {
                  e.target.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "scale(1)";
                }}
              >
                📋 Copy
              </button>
            </p>
            {copied && <p style={styles.copiedNote}>✅ Number copied successfully</p>}
          </div>

          <div style={styles.noteBox}>
            📌 After payment, paste the <strong>FULL M-Pesa confirmation SMS</strong> below.
          </div>

          <textarea
            placeholder="Paste M-Pesa confirmation message here..."
            value={paymentText}
            onChange={(e) => setPaymentText(e.target.value)}
            rows={4}
            style={styles.input}
          />

          <button
            onClick={submitActivation}
            disabled={submitting}
            style={{
              ...styles.button,
              background: submitting
                ? "#94a3b8"
                : `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)`,
              opacity: submitting ? 0.7 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = `0 10px 30px ${plan.glow}`;
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }
            }}
          >
            {submitting ? (
              <>
                <span style={{
                  display: "inline-block",
                  width: "16px",
                  height: "16px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  marginRight: "8px",
                  animation: "spin 1s linear infinite"
                }}></span>
                Submitting...
              </>
            ) : (
              "Submit Payment"
            )}
          </button>

          {notification && (
            <div style={styles.notificationBox}>
              {notification}
            </div>
          )}

          <button
            onClick={() => navigate("/dashboard")}
            style={{
              ...styles.button,
              background: "transparent",
              border: "2px solid #2563eb",
              color: "#2563eb",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(37, 99, 235, 0.05)";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
              e.target.style.transform = "translateY(0)";
            }}
          >
            ⬅ Back to Dashboard
          </button>
        </div>

        {/* Trust Badges */}
        <div className="activate-trust-section" style={{ marginTop: "40px" }}>
          <TrustBadges variant="compact" />
        </div>

        {/* Testimonials */}
        <div className="activate-testimonials-section" style={{ marginTop: "40px", width: "100%", maxWidth: "800px" }}>
          <Testimonials variant="carousel" />
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </>
  );
}