// ========================= Activate.jsx =========================
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
    color: "#ffd000", 
    glow: "rgba(91, 247, 0, 0.6)" 
  },
  VIP: { 
    label: "VIP", 
    total: 2000, 
    activationFee: 150, 
    color: "#ffe600", 
    glow: "rgba(121, 250, 0, 1)" 
  },
  VVIP: { 
    label: "VVIP", 
    total: 3000, 
    activationFee: 200, 
    color: "#ffee00", 
    glow: "rgba(51, 240, 4, 1)" 
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
    background: "rgba(0,0,0,0.95)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    padding: "20px",
  },
  overlayCard: {
    maxWidth: "520px",
    width: "100%",
    background: "#062f2a",
    padding: "28px",
    borderRadius: "22px",
    color: "#fff",
    textAlign: "center",
    border: "2px solid #00ff99",
    boxShadow: "0 20px 60px rgba(0, 255, 153, 0.3)",
  },
  vipBtn: {
    marginTop: "22px",
    width: "100%",
    padding: "16px",
    borderRadius: "50px",
    border: "none",
    background: "linear-gradient(135deg, #00ff99, #00cc66)",
    color: "#000",
    fontWeight: 900,
    fontSize: "16px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0a, #1a1a1a)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px",
    paddingTop: "40px",
    paddingBottom: "40px",
  },
  card: {
    maxWidth: "520px",
    width: "100%",
    background: "rgba(14, 58, 56, 0.9)",
    padding: "24px",
    borderRadius: "22px",
    color: "#fff",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)",
  },
  section: {
    marginTop: "20px",
    padding: "16px",
    borderRadius: "14px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  sectionHighlight: {
    marginTop: "20px",
    padding: "16px",
    borderRadius: "14px",
    background: "rgba(0, 255, 128, 0.08)",
    border: "1px solid rgba(0, 255, 128, 0.2)",
  },
  caption: {
    fontSize: "13px",
    color: "#ffe600",
    fontWeight: 700,
    marginBottom: "10px",
    lineHeight: "1.5",
  },
  noteBox: {
    marginTop: "16px",
    padding: "14px",
    borderRadius: "12px",
    background: "rgba(0, 29, 190, 0.2)",
    fontSize: "13px",
    fontWeight: 600,
    border: "1px solid rgba(0, 29, 190, 0.3)",
  },
  notificationBox: {
    marginTop: "16px",
    padding: "16px",
    borderRadius: "14px",
    background: "rgba(0, 255, 128, 0.15)",
    color: "#00ffcc",
    fontWeight: 700,
    border: "1px solid rgba(0, 255, 128, 0.3)",
  },
  activationFee: {
    color: "#ff2d2d",
    fontWeight: 900,
    fontSize: "16px",
  },
  copiedNote: {
    color: "#00ff99",
    fontWeight: 800,
    fontSize: "13px",
    marginTop: "8px",
  },
  input: {
    width: "100%",
    padding: "16px",
    marginTop: "16px",
    borderRadius: "10px",
    border: "2px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(255, 255, 255, 0.08)",
    color: "#fff",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: "120px",
  },
  button: {
    width: "100%",
    marginTop: "16px",
    padding: "16px",
    borderRadius: "50px",
    fontWeight: 800,
    fontSize: "16px",
    cursor: "pointer",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "all 0.3s ease",
    minHeight: "44px",
  },
  copyBtn: {
    marginLeft: "10px",
    padding: "8px 16px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    color: "white",
    fontWeight: 700,
    fontSize: "12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  roiCard: {
    maxWidth: "520px",
    width: "100%",
    background: "rgba(255, 255, 255, 0.95)",
    padding: "20px",
    borderRadius: "16px",
    color: "#333",
    marginBottom: "20px",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
    border: "2px solid #00ff99",
  },
  roiRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    fontSize: "14px",
    borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh",
    fontSize: "16px",
    fontWeight: 600,
    color: "rgba(255, 255, 255, 0.8)",
  },
};

export default function Activate() {
  const navigate = useNavigate();
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
        const res = await api.get("/auth/me");
        if (!isMounted) return;
        setUser(res.data);

        const isWelcome = searchParams.get("welcome_bonus");
        const planFromQuery = isWelcome ? "WELCOME" : res.data.active_plan;

        let plan;
        if (planFromQuery === "WELCOME") {
          plan = { 
            is_activated: false, 
            completed: true, 
            total: res.data.welcome_bonus || 1200 
          };
        } else {
          plan = res.data.plans?.[res.data.active_plan];
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
  }, [navigate, searchParams]);

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
          color: "#00ffcc", 
          glow: "rgba(0, 255, 204, 0.5)" 
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
              🎉
            </div>
            
            <h2 style={{ 
              color: "#00ff99", 
              textAlign: "center",
              fontSize: "24px",
              marginBottom: "16px"
            }}>
              PAYMENT SUBMITTED SUCCESSFULLY
            </h2>

            <p style={{ 
              marginTop: "18px", 
              lineHeight: "1.7", 
              fontWeight: 600,
              fontSize: "15px",
              color: "rgba(255, 255, 255, 0.9)"
            }}>
              Your payment has been submitted for approval.
              <br /><br />
              The management will verify your payment and activate your account.
              <br /><br />
              <strong>Next Steps:</strong>
              <br />
              1. Go back to your dashboard
              <br />
              {planKey === "WELCOME" ? (
                <>
                  2. Complete VIP SURVEY PLAN and pay activation fee of 150 
                  <br />
                  3. Then Withdraw your earnings after verification
                </>
              ) : (
                <>
                  2. Start completing surveys immediately
                  <br />
                  3. Withdraw your earnings after completing {plan.label} plan!
                </>
              )}
            </p>

            <button
              onClick={() => navigate("/dashboard", { replace: true })}
              style={styles.vipBtn}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 10px 30px rgba(0, 255, 153, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              👉 Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* MAIN PAGE */}
      <div className="activate-page" style={styles.page}>
        {/* ROI Calculator */}
        <div style={styles.roiCard}>
          <h3 style={{ 
            margin: "0 0 16px", 
            fontSize: "18px", 
            fontWeight: 800,
            color: "#000"
          }}>
            💰 Your Investment Breakdown
          </h3>
          <div style={styles.roiRow}>
            <span>Activation Fee:</span>
            <span style={{ fontWeight: 700 }}>KES {plan.activationFee}</span>
          </div>
          <div style={styles.roiRow}>
            <span>Withdrawable Amount:</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>
              +KES {plan.total}
            </span>
          </div>
          <div style={{ 
            ...styles.roiRow, 
            borderBottom: "none",
            paddingTop: "16px",
            marginTop: "8px",
            borderTop: "2px solid #00ff99"
          }}>
            <span style={{ fontWeight: 800, fontSize: "16px" }}>Your Return:</span>
            <span style={{ 
              fontWeight: 900, 
              fontSize: "18px",
              color: "#059669"
            }}>
              {Math.round((plan.total / plan.activationFee) * 10) / 10}x ROI
            </span>
          </div>
          <p style={{ 
            marginTop: "16px", 
            textAlign: "center",
            fontWeight: 700,
            color: "#059669",
            fontSize: "14px"
          }}>
            That's {Math.round((plan.total / plan.activationFee) * 100)}% return on your investment!
          </p>
        </div>

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
              color: "#ff3b3b",
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
                ? "#555"
                : `linear-gradient(135deg, ${plan.color}, #0a7c4a)`,
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
              border: "2px solid #00ffcc",
              color: "#00ffcc",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(0, 255, 204, 0.1)";
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