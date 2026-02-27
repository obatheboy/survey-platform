import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import api from "../api/api";
import TrustBadges from "../components/TrustBadges";
import Testimonials from "../components/Testimonials";
import "./Activate.css";

/* =========================
   CONSTANTS
========================= */
const PHONE_NUMBER = "0794101450";
const BUSINESS_NAME = "Obadiah Otoki";

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
  stepBox: {
    background: "rgba(59, 130, 246, 0.1)",
    border: "1px solid rgba(59, 130, 246, 0.2)",
    borderRadius: "10px",
    padding: "12px",
    margin: "8px 0",
  },
  stepNumber: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    background: "#3b82f6",
    color: "white",
    borderRadius: "50%",
    fontWeight: 700,
    fontSize: "12px",
    marginRight: "8px",
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
        const planFromUrl = searchParams.get("plan");

        // FIXED LOGIC: Prioritize URL param, then state, then active_plan
        let planFromQuery;
        if (isWelcome) {
          planFromQuery = "WELCOME";
        } else if (planFromUrl && PLAN_CONFIG[planFromUrl.toUpperCase()]) {
          planFromQuery = planFromUrl.toUpperCase();
        } else if (statePlanKey && PLAN_CONFIG[statePlanKey.toUpperCase()]) {
          planFromQuery = statePlanKey.toUpperCase();
        } else {
          // Find the highest plan that's completed but not activated
          const userPlans = res.data.plans || {};
          let highestPlan = null;
          
          // Check plans in order: VVIP -> VIP -> REGULAR
          if (userPlans.VVIP && userPlans.VVIP.completed && !userPlans.VVIP.is_activated) {
            highestPlan = "VVIP";
          } else if (userPlans.VIP && userPlans.VIP.completed && !userPlans.VIP.is_activated) {
            highestPlan = "VIP";
          } else if (userPlans.REGULAR && userPlans.REGULAR.completed && !userPlans.REGULAR.is_activated) {
            highestPlan = "REGULAR";
          }
          
          planFromQuery = highestPlan || null; // Don't auto-select, show plan selection
        }

        let plan;
        if (planFromQuery === "WELCOME") {
          plan = { 
            is_activated: false, 
            completed: true, 
            total: res.data.welcome_bonus || 1200 
          };
        } else if (!planFromQuery) {
          // No specific plan selected - will show plan selection
          plan = null;
        } else {
          plan = res.data.plans?.[planFromQuery];
        }

        // If no plan is selected, skip auto-navigation and show selection
        if (!planFromQuery) {
          setPlanKey(null);
          setPlanState(null);
          setLoading(false);
          return;
        }

        if (!plan && PLAN_CONFIG[planFromQuery]) {
          plan = { is_activated: false };
        }

        if (!plan || (planFromQuery !== "WELCOME" && plan.is_activated)) {
          // Navigate to plan selection instead of dashboard
          setPlanKey(null);
          setPlanState(null);
          setLoading(false);
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
     COPY PHONE NUMBER
  ========================== */
  const copyPhoneNumber = async () => {
    try {
      await navigator.clipboard.writeText(PHONE_NUMBER);
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
      // Send to backend
      const requestData = {
        mpesa_code: paymentText.trim(),
        plan: planKey === "WELCOME" ? "REGULAR" : planKey,
        is_welcome_bonus: planKey === "WELCOME",
      };
      
      await api.post("/activation/submit", requestData);
      
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("❌ Activation submission failed:", error);
      if (error.response) {
        setNotification(`❌ ${error.response.data?.message || "Submission failed. Please try again."}`);
      } else {
        setNotification("❌ Network error. Please check your connection.");
      }
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

  // Show plan selection when no plan is selected
  if (!planKey && user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            textAlign: 'center', 
            marginBottom: '8px',
            color: '#1e293b'
          }}>
            🚀 Start Your Plan
          </h2>
          <p style={{ 
            textAlign: 'center', 
            marginBottom: '24px',
            color: '#64748b'
          }}>
            Select a plan to start completing surveys and earn money!
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['REGULAR', 'VIP', 'VVIP'].map((p) => {
              const planData = user?.plans?.[p];
              const isCompleted = planData?.completed;
              const isActivated = planData?.is_activated;
              const config = PLAN_CONFIG[p];
              
              return (
                <button
                  key={p}
                  onClick={() => {
                    if (isCompleted && !isActivated) {
                      // Navigate to Surveys page with this plan selected
                      localStorage.setItem('active_plan', p);
                      navigate('/surveys');
                    }
                  }}
                  disabled={!isCompleted || isActivated}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    border: 'none',
                    borderRadius: '12px',
                    background: isActivated 
                      ? 'rgba(16, 185, 129, 0.1)' 
                      : isCompleted 
                        ? config.gradient 
                        : 'rgba(100, 116, 139, 0.1)',
                    color: isActivated ? '#10b981' : isCompleted ? 'white' : '#64748b',
                    cursor: isCompleted && !isActivated ? 'pointer' : 'not-allowed',
                    opacity: isCompleted && !isActivated ? 1 : 0.6,
                    transition: 'all 0.2s',
                    boxShadow: isCompleted && !isActivated ? '0 4px 15px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {config?.label || p}
                    </div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                      Earn up to KES {config?.total || 0}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {isActivated ? (
                      <span style={{ fontWeight: 'bold' }}>✅ Activated</span>
                    ) : isCompleted ? (
                      <span style={{ fontWeight: 'bold' }}>▶ Start Surveys</span>
                    ) : (
                      <span>{planData?.surveys_completed || 0}/10 surveys</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          
          <p style={{ 
            textAlign: 'center', 
            marginTop: '20px',
            fontSize: '0.85rem',
            color: '#94a3b8'
          }}>
            Complete 10 surveys to unlock each plan, then start earning!
          </p>
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

  // Add plan verification warning
  const showPlanWarning = planKey === "VIP" && user?.plans?.VVIP?.completed && !user?.plans?.VVIP?.is_activated;

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
                  2. Complete VIP SURVEY PLAN (150)
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

          {/* COMPELLING CAPTION AT THE TOP */}
          <div style={{
            marginTop: "8px",
            marginBottom: "20px",
            padding: "18px 16px",
            borderRadius: "16px",
            background: `linear-gradient(135deg, ${plan.color}15, ${plan.color}05)`,
            border: `2px solid ${plan.color}30`,
            textAlign: "center"
          }}>
            <div style={{
              fontSize: "28px",
              fontWeight: 800,
              color: plan.color,
              lineHeight: "1.2",
              marginBottom: "4px"
            }}>
              KES {plan.total}
            </div>
            <div style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#334155",
              marginBottom: "12px"
            }}>
              Ready to withdraw!
            </div>
            <div style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#2563eb",
              background: "white",
              padding: "12px 14px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 8px rgba(0,0,0,0.02)"
            }}>
              💡 Pay <span style={{ 
                color: "#dc2626", 
                fontWeight: 800,
                fontSize: "18px"
              }}>KES {plan.activationFee}</span> activation fee 
              <br />
              <span style={{ fontSize: "14px", color: "#4b5563" }}>
                to unlock your <strong style={{ color: plan.color }}>{plan.label}</strong> earnings
              </span>
            </div>
            <div style={{
              marginTop: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#059669"
            }}>
              <span>⚡ Instant verification</span>
              <span>🔒 Secure payment</span>
              <span>✅ Lifetime access</span>
            </div>
          </div>

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

          {showPlanWarning && (
            <div style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "10px",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              color: "#f59e0b",
              fontSize: "13px",
              fontWeight: 600
            }}>
              ⚠️ <strong>Note:</strong> You have completed VVIP surveys. 
              Make sure you're activating the correct plan. Current: <strong>{plan.label}</strong>
            </div>
          )}

          <div style={styles.section}>
            <p style={{ fontWeight: 900, fontSize: "14px", marginBottom: "10px" }}>
              📲 HOW TO PAY (LIPA NA M-PESA)
            </p>

            <p style={styles.caption}>
              ⚠ <strong>IMPORTANT:</strong> This is the Official CEO number and
              Payments are <strong>Automatically verified after payment</strong>.
            </p>

            {/* STEP-BY-STEP GUIDE */}
            <div style={{ marginTop: "16px" }}>
              <div style={styles.stepBox}>
                <span style={styles.stepNumber}>1</span>
                <strong>Open M-Pesa Menu</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
                  Go to your phone's M-Pesa menu
                </p>
              </div>

              <div style={styles.stepBox}>
                <span style={styles.stepNumber}>2</span>
                <strong>Select "Lipa na M-PESA"</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
                  Choose the "Lipa na M-PESA" option
                </p>
              </div>

              <div style={styles.stepBox}>
                <span style={styles.stepNumber}>3</span>
                <strong>Select "Send Money"</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
                  Choose "Send Money" option
                </p>
              </div>

              <div style={styles.stepBox}>
                <span style={styles.stepNumber}>4</span>
                <strong>Enter Phone Number</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
                  Enter: <strong>{PHONE_NUMBER}</strong>
                </p>
              </div>

              <div style={styles.stepBox}>
                <span style={styles.stepNumber}>5</span>
                <strong>Verify Recipient Name</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
                  Confirm name: <strong>{BUSINESS_NAME}</strong>
                </p>
              </div>

              <div style={styles.stepBox}>
                <span style={styles.stepNumber}>6</span>
                <strong>Enter Amount</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
                  Amount: <span style={styles.activationFee}>KES {plan.activationFee}</span>
                </p>
              </div>

              <div style={styles.stepBox}>
                <span style={styles.stepNumber}>7</span>
                <strong>Complete Payment</strong>
                <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>
                  Enter your M-PESA PIN and confirm
                </p>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <p style={{ margin: "6px 0", fontSize: "14px" }}>
              <strong>Recipient Name:</strong> {BUSINESS_NAME}
            </p>
            <div style={{ 
              margin: "10px 0",
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px"
            }}>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>Phone Number:</span>
              <span style={{ fontSize: "14px" }}>{PHONE_NUMBER}</span>
              <button 
                onClick={copyPhoneNumber} 
                style={styles.copyBtn}
              >
                📋 Copy
              </button>
            </div>
            {copied && <p style={styles.copiedNote}>✅ Phone number copied</p>}
          </div>

          <div style={styles.noteBox}>
            📌 After payment, paste the <strong>FULL M-Pesa SMS</strong> below.
            <br />
            <span style={{ fontSize: "12px", color: "#dc2626", fontWeight: 700 }}>
              ⚠ Must include: Transaction ID, Amount, Time, and Reference
            </span>
            <br />
            <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 700, marginTop: "4px", display: "block" }}>
              ℹ️ Activating: <strong>{plan.label} Plan</strong> (KES {plan.activationFee})
            </span>
          </div>

          <textarea
            placeholder="Paste M-Pesa confirmation message here...
Example:
Confirmed. Ksh100.00 sent to Obadiah Otoki for account activation"
            value={paymentText}
            onChange={(e) => setPaymentText(e.target.value)}
            rows={5}
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
              `Submit ${plan.label} Activation (KES ${plan.activationFee})`
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

          {/* PLAN STATUS SECTION - MOVED TO BOTTOM */}
          <div style={{
            marginTop: "24px",
            padding: "16px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
            border: "1px solid #e2e8f0",
            fontSize: "13px"
          }}>
            <div style={{ 
              fontWeight: 700, 
              color: "#2563eb",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px"
            }}>
              📊 Plan Status
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {['REGULAR', 'VIP', 'VVIP'].map((p) => {
                const planData = user?.plans?.[p];
                const isCurrent = planKey === p || (planKey === 'WELCOME' && p === 'REGULAR');
                return (
                  <div key={p} style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                    background: isCurrent ? "rgba(37, 99, 235, 0.08)" : "transparent",
                    borderRadius: "8px",
                    border: isCurrent ? "1px solid rgba(37, 99, 235, 0.2)" : "1px solid transparent",
                    transition: "all 0.2s ease"
                  }}>
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: "13px",
                      color: isCurrent ? "#2563eb" : "#334155"
                    }}>
                      {p}
                      {isCurrent && planKey === "WELCOME" && p === "REGULAR" && " (Welcome)"}
                      {isCurrent && planKey !== "WELCOME" && " (Current)"}
                    </span>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span style={{ 
                        color: planData?.completed ? "#10b981" : "#94a3b8",
                        fontWeight: 600,
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        {planData?.completed ? "✓" : "✗"} Complete
                      </span>
                      <span style={{ 
                        color: planData?.is_activated ? "#10b981" : "#f59e0b",
                        fontWeight: 600,
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        background: planData?.is_activated ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                        padding: "4px 10px",
                        borderRadius: "20px"
                      }}>
                        {planData?.is_activated ? "✅ Activated" : "⏳ Pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ 
              marginTop: "16px", 
              paddingTop: "12px", 
              borderTop: "1px solid #e2e8f0",
              fontWeight: 700,
              fontSize: "13px",
              color: plan.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <span>🎯 Activating:</span>
              <span style={{ 
                background: plan.color,
                color: "white",
                padding: "4px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700
              }}>
                {plan.label} Plan
              </span>
            </div>
          </div>
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