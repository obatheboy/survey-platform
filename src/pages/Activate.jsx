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
   INLINE STYLES (OPTIMIZED FOR MOBILE)
========================= */
const styles = {
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
    padding: "16px",
    backdropFilter: "blur(4px)",
  },
  overlayCard: {
    maxWidth: "100%",
    width: "100%",
    background: "var(--bg-surface)",
    padding: "24px 20px",
    borderRadius: "16px",
    color: "var(--text-main)",
    textAlign: "center",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
    border: "1px solid var(--border-soft)",
    margin: "0 16px",
  },
  page: {
    minHeight: "100vh",
    background: "var(--bg-main)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px",
    paddingTop: "20px",
    paddingBottom: "40px",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    maxWidth: "100%",
    width: "100%",
    background: "var(--bg-surface)",
    padding: "20px 16px",
    borderRadius: "16px",
    color: "var(--text-main)",
    border: "1px solid var(--border-soft)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  },
  section: {
    marginTop: "20px",
    padding: "16px",
    borderRadius: "12px",
    background: "var(--bg-main)",
    border: "1px solid var(--border-soft)",
    fontSize: "14px",
  },
  sectionHighlight: {
    marginTop: "20px",
    padding: "16px",
    borderRadius: "12px",
    background: "rgba(37, 99, 235, 0.05)",
    border: "1px solid rgba(37, 99, 235, 0.1)",
    fontSize: "14px",
  },
  caption: {
    fontSize: "13px",
    color: "var(--primary)",
    fontWeight: 700,
    marginBottom: "10px",
    lineHeight: "1.4",
  },
  noteBox: {
    marginTop: "20px",
    padding: "14px",
    borderRadius: "10px",
    background: "var(--bg-surface)",
    fontSize: "13px",
    fontWeight: 600,
    border: "1px solid var(--border-medium)",
    color: "var(--text-muted)",
    lineHeight: "1.4",
  },
  notificationBox: {
    marginTop: "16px",
    padding: "14px",
    borderRadius: "10px",
    background: "rgba(16, 185, 129, 0.1)",
    color: "var(--regular-color)",
    fontWeight: 700,
    border: "1px solid var(--regular-color)",
    fontSize: "13px",
  },
  activationFee: {
    color: "#dc2626",
    fontWeight: 800,
    fontSize: "15px",
  },
  copiedNote: {
    color: "var(--regular-color)",
    fontWeight: 700,
    fontSize: "12px",
    marginTop: "8px",
  },
  input: {
    width: "100%",
    padding: "14px",
    marginTop: "16px",
    borderRadius: "10px",
    border: "2px solid var(--border-medium)",
    background: "var(--bg-surface)",
    color: "var(--text-main)",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: "120px",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    marginTop: "16px",
    padding: "16px",
    borderRadius: "12px",
    fontWeight: 700,
    fontSize: "15px",
    cursor: "pointer",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    minHeight: "50px",
    background: "var(--primary)",
    color: "#ffffff",
    boxShadow: "0 6px 12px -3px rgba(37, 99, 235, 0.3)",
  },
  copyBtn: {
    padding: "8px 14px",
    borderRadius: "8px",
    border: "none",
    background: "var(--primary)",
    color: "white",
    fontWeight: 700,
    fontSize: "12px",
    cursor: "pointer",
    boxShadow: "0 3px 6px -1px rgba(37, 99, 235, 0.2)",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--text-muted)",
    background: "var(--bg-main)",
    padding: "20px",
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
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setNotification("⚠️ Failed to copy. Please copy manually.");
    }
  };

  /* =========================
     SUBMIT ACTIVATION
  ========================== */
  const submitActivation = async () => {
    if (!paymentText.trim()) {
      setNotification("❌ Paste the FULL M-Pesa confirmation message.");
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
      console.error("Activation submission failed:", error);
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
            width: "36px",
            height: "36px",
            border: "3px solid rgba(255, 255, 255, 0.1)",
            borderTopColor: "#00ff99",
            borderRadius: "50%",
            margin: "0 auto 12px",
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
              fontSize: "48px",
              marginBottom: "16px",
              animation: "bounce 1s infinite"
            }}>
              ✅
            </div>
            
            <h2 style={{ 
              color: "#10b981", 
              textAlign: "center",
              fontSize: "20px",
              fontWeight: 800,
              marginBottom: "12px"
            }}>
              PAYMENT SUBMITTED
            </h2>

            <p style={{ 
              marginTop: "12px", 
              lineHeight: "1.6", 
              fontWeight: 500,
              fontSize: "14px",
              color: "#475569"
            }}>
              Your payment has been submitted for approval.
              <br /><br />
              Our team will verify your transaction and activate your account shortly.
              <br /><br />
              <strong>Next Steps:</strong>
              <br />
              1. Go back to dashboard
              <br />
              {planKey === "WELCOME" ? (
                <>
                  2. Complete VIP SURVEY PLAN(150)
                  <br />
                  3. Complete VVIP PLAN (200) to unlock withdrawals
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
                ...styles.button,
                marginTop: "20px",
                background: "#2563eb",
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
          boxShadow: `0 0 20px ${plan.glow}` 
        }}>
          <h2 style={{ 
            textAlign: "center", 
            color: plan.color,
            fontSize: "20px",
            marginBottom: "6px"
          }}>
            🔓 Account Activation
          </h2>

          <h3 style={{ 
            textAlign: "center", 
            marginTop: "10px",
            fontSize: "18px",
            fontWeight: 700
          }}>
            💰 Withdrawable:{" "}
            <span style={{ color: plan.color }}>KES {plan.total}</span>
          </h3>

          <div style={styles.sectionHighlight}>
            <p style={{ 
              fontWeight: 900, 
              color: "#ef4444",
              fontSize: "14px",
              marginBottom: "10px"
            }}>
              ⚠ ACTIVATION REQUIRED
            </p>
            {["✔ One-time activation fee", "✔ Unlock withdrawals", "✔ Verified & secure account", "✔ Direct M-Pesa payments"].map((text, index) => (
              <p key={index} style={{ 
                margin: "4px 0",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                {text}
              </p>
            ))}
          </div>

          <div style={styles.section}>
            <p style={{ fontWeight: 900, fontSize: "14px", marginBottom: "10px" }}>
              📲 HOW TO PAY (SEND MONEY)
            </p>

            <p style={styles.caption}>
              ⚠ <strong>IMPORTANT:</strong> This is the official CEO payment number.
              Payments are <strong>Automatically verified</strong>.
            </p>

            <ol style={{ 
              fontSize: "13px", 
              lineHeight: "1.6",
              paddingLeft: "18px",
              marginTop: "10px"
            }}>
              {[
                "Open M-Pesa",
                "Select Send Money",
                `Enter number: ${SEND_MONEY_NUMBER}`,
                `Confirm name: ${RECEIVER_NAME}`,
                <span key={4}>Amount: <span style={styles.activationFee}>KES {plan.activationFee}</span></span>,
                "Enter PIN and confirm"
              ].map((item, index) => (
                <li key={index} style={{ marginBottom: "6px" }}>
                  {item}
                </li>
              ))}
            </ol>
          </div>

          <div style={styles.section}>
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <strong>Receiver:</strong> {RECEIVER_NAME}
            </p>
            <div style={{ 
              margin: "10px 0",
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px"
            }}>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>Number:</span>
              <span style={{ fontSize: "14px" }}>{SEND_MONEY_NUMBER}</span>
              <button 
                onClick={copyNumber} 
                style={styles.copyBtn}
              >
                📋 Copy
              </button>
            </div>
            {copied && <p style={styles.copiedNote}>✅ Number copied</p>}
          </div>

          <div style={styles.noteBox}>
            📌 After payment, paste the <strong>FULL M-Pesa SMS</strong> below.
          </div>

          <textarea
            placeholder="Paste M-Pesa confirmation message here..."
            value={paymentText}
            onChange={(e) => setPaymentText(e.target.value)}
            rows={3}
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
          >
            {submitting ? (
              <>
                <span style={{
                  display: "inline-block",
                  width: "14px",
                  height: "14px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  marginRight: "6px",
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
          >
            ⬅ Back to Dashboard
          </button>
        </div>

        {/* Trust Badges */}
        <div style={{ marginTop: "30px", width: "100%" }}>
          <TrustBadges variant="compact" />
        </div>

        {/* Testimonials */}
        <div style={{ marginTop: "30px", width: "100%" }}>
          <Testimonials variant="carousel" />
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </>
  );
}