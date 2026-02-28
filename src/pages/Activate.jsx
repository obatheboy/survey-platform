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
    padding: "12px",
    paddingTop: "12px",
    paddingBottom: "40px",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    maxWidth: "100%",
    width: "100%",
    background: "var(--bg-surface)",
    padding: "16px 14px",
    borderRadius: "16px",
    color: "var(--text-main)",
    border: "1px solid var(--border-soft)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
  },
  section: {
    marginTop: "16px",
    padding: "14px",
    borderRadius: "12px",
    background: "var(--bg-main)",
    border: "1px solid var(--border-soft)",
    fontSize: "13px",
  },
  sectionHighlight: {
    marginTop: "16px",
    padding: "14px",
    borderRadius: "12px",
    background: "rgba(37, 99, 235, 0.05)",
    border: "1px solid rgba(37, 99, 235, 0.1)",
    fontSize: "13px",
  },
  caption: {
    fontSize: "12px",
    color: "#e2e8f0",
    fontWeight: 700,
    marginBottom: "8px",
    lineHeight: "1.4",
  },
  noteBox: {
    marginTop: "16px",
    padding: "12px",
    borderRadius: "10px",
    background: "var(--bg-surface)",
    fontSize: "12px",
    fontWeight: 600,
    border: "1px solid var(--border-medium)",
    color: "var(--text-muted)",
    lineHeight: "1.4",
  },
  notificationBox: {
    marginTop: "12px",
    padding: "12px",
    borderRadius: "10px",
    background: "rgba(16, 185, 129, 0.1)",
    color: "var(--regular-color)",
    fontWeight: 700,
    border: "1px solid var(--regular-color)",
    fontSize: "12px",
  },
  activationFee: {
    color: "#dc2626",
    fontWeight: 800,
    fontSize: "14px",
  },
  copiedNote: {
    color: "var(--regular-color)",
    fontWeight: 700,
    fontSize: "11px",
    marginTop: "6px",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginTop: "12px",
    borderRadius: "10px",
    border: "2px solid var(--border-medium)",
    background: "var(--bg-surface)",
    color: "var(--text-main)",
    fontSize: "13px",
    fontFamily: "inherit",
    resize: "vertical",
    minHeight: "100px",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    marginTop: "12px",
    padding: "14px",
    borderRadius: "12px",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    minHeight: "48px",
    background: "var(--primary)",
    color: "#ffffff",
    boxShadow: "0 6px 12px -3px rgba(37, 99, 235, 0.3)",
  },
  copyBtn: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "none",
    background: "var(--primary)",
    color: "white",
    fontWeight: 700,
    fontSize: "11px",
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
    borderRadius: "8px",
    padding: "10px",
    margin: "6px 0",
  },
  stepNumber: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "22px",
    height: "22px",
    background: "#3b82f6",
    color: "white",
    borderRadius: "50%",
    fontWeight: 700,
    fontSize: "11px",
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
            fontSize: "18px",
            marginBottom: "4px",
            fontWeight: 700
          }}>
            🔓 Account Activation
          </h2>

          {/* COMPACT TOP CAPTION - BOLDED FOR BOTH THEMES */}
          <div className="activate-top-caption" style={{
            marginTop: "4px",
            marginBottom: "16px",
            padding: "16px 12px",
            borderRadius: "14px",
            background: "#1e293b",
            border: "1px solid #334155",
            textAlign: "center"
          }}>
            <div style={{
              fontSize: "18px",
              fontWeight: 800,
              color: "#ffffff",
              marginBottom: "8px",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)"
            }}>
              🎉 CONGRATULATIONS! 🎉
            </div>
            
            <div style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#e2e8f0",
              marginBottom: "4px"
            }}>
              You have earned
            </div>
            
            <div style={{
              fontSize: "38px",
              fontWeight: 900,
              color: "#10b981",
              lineHeight: "1.2",
              marginBottom: "10px",
              textShadow: "0 4px 12px rgba(16, 185, 129, 0.5)"
            }}>
              KES {plan.total}
            </div>
            
            <div style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "#2563eb",
              background: "rgba(255,255,255,0.95)",
              padding: "10px 20px",
              borderRadius: "40px",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "inline-block",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}>
              Pay <span style={{ color: "#dc2626", fontWeight: 900, fontSize: "16px" }}>KES {plan.activationFee}</span> to withdraw
            </div>
          </div>

          {showPlanWarning && (
            <div style={{
              marginTop: "12px",
              padding: "10px",
              borderRadius: "8px",
              background: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              color: "#fbbf24",
              fontSize: "12px",
              fontWeight: 700
            }}>
              ⚠️ <strong>Note:</strong> You have completed VVIP surveys. 
              Make sure you're activating the correct plan. Current: <strong style={{color: "#ffffff"}}>{plan.label}</strong>
            </div>
          )}

          {/* HOW TO PAY & ACTIVATE SECTION */}
          <div className="activate-section-dark" style={styles.section}>
            <p style={{ fontWeight: 800, fontSize: "14px", marginBottom: "8px", color: "#ffffff" }}>
              📲 HOW TO PAY & ACTIVATE
            </p>

            <p style={{ ...styles.caption, color: "#e2e8f0" }}>
              ⚠ <strong style={{color: "#ffffff", fontWeight: 800}}>IMPORTANT:</strong> Pay to this number of the CEO 🚀-0794 101 450- and payments are verified instantly ater payment
            </p>

            {/* STEP-BY-STEP GUIDE - COMPACT */}
            <div style={{ marginTop: "8px" }}>
              <div className="activate-step-box" style={styles.stepBox}>
                <span style={styles.stepNumber}>1</span>
                <strong style={{color: "#ffffff", fontWeight: 800}}>Open M-Pesa</strong>
                <span style={{ fontSize: "12px", marginLeft: "4px", color: "#cbd5e1", fontWeight: 600 }}>→ Lipa na M-PESA</span>
              </div>

              <div className="activate-step-box" style={styles.stepBox}>
                <span style={styles.stepNumber}>2</span>
                <strong style={{color: "#ffffff", fontWeight: 800}}>Send Money</strong>
                <span style={{ fontSize: "12px", marginLeft: "4px", color: "#cbd5e1", fontWeight: 600 }}>→ Enter <strong style={{color: "#ffffff", fontWeight: 800}}>{PHONE_NUMBER}</strong></span>
              </div>

              <div className="activate-step-box" style={styles.stepBox}>
                <span style={styles.stepNumber}>3</span>
                <strong style={{color: "#ffffff", fontWeight: 800}}>Confirm: {BUSINESS_NAME}</strong>
              </div>

              <div className="activate-step-box" style={styles.stepBox}>
                <span style={styles.stepNumber}>4</span>
                <strong style={{color: "#ffffff", fontWeight: 800}}>Amount: </strong>
                <span style={{...styles.activationFee, color: "#fca5a5", fontWeight: 900}}>KES {plan.activationFee}</span>
              </div>

              <div className="activate-step-box" style={styles.stepBox}>
                <span style={styles.stepNumber}>5</span>
                <strong style={{color: "#ffffff", fontWeight: 800}}>Enter PIN & Complete</strong>
              </div>

              <div className="activate-step-box activate-step-box-success" style={{
                ...styles.stepBox,
                background: "rgba(16, 185, 129, 0.25)",
                border: "1px solid rgba(16, 185, 129, 0.5)"
              }}>
                <span style={{...styles.stepNumber, background: "#10b981"}}>6</span>
                <strong style={{ color: "#6ee7b7", fontWeight: 800 }}>Paste confirmation below</strong>
                <span style={{ fontSize: "11px", display: "block", marginTop: "2px", color: "#a7f3d0", fontWeight: 600 }}>
                  Get KES {plan.total} instantly!
                </span>
              </div>
            </div>
          </div>

          {/* PHONE NUMBER SECTION */}
          {/* PHONE NUMBER SECTION */}
          <div className="activate-section-dark" style={styles.section}>
            <div style={{ 
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "6px"
            }}>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff" }}>📞 <strong>{PHONE_NUMBER}</strong></span>
              <button 
                onClick={copyPhoneNumber} 
                style={styles.copyBtn}
              >
                📋 Copy Number
              </button>
            </div>
            {copied && <p style={{...styles.copiedNote, color: "#6ee7b7", fontWeight: 700}}>✅ Phone number copied</p>}
          </div>

          {/* M-Pesa SMS Input Note */}
          <div className="activate-note-box" style={{...styles.noteBox, background: "#1e293b", borderColor: "#334155"}}>
            📌 Paste the <strong style={{color: "#ffffff", fontWeight: 800}}>FULL M-Pesa SMS</strong> below
            <br />
            <span style={{ fontSize: "11px", color: "#f87171", fontWeight: 700 }}>
              ⚠ Include Transaction ID, Amount & Time
            </span>
          </div>

          <textarea
            placeholder="Paste M-Pesa confirmation here..."
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
                ? "#4b5563"
                : `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)`,
              fontWeight: 800,
              fontSize: "15px"
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
              `🚀 ACTIVATE & GET KES ${plan.total}`
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
              border: "2px solid #3b82f6",
              color: "#3b82f6",
              marginTop: "8px",
              fontWeight: 700
            }}
          >
            ⬅ Back to Dashboard
          </button>

          {/* PLAN STATUS SECTION - AT BOTTOM */}
          <div className="activate-plan-status" style={{
            marginTop: "20px",
            padding: "14px",
            borderRadius: "12px",
            background: "rgba(30, 41, 59, 0.95)",
            border: "1px solid #334155",
            fontSize: "12px"
          }}>
            <div style={{ 
              fontWeight: 800, 
              color: "#60a5fa",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px"
            }}>
              📊 Plan Status
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {['REGULAR', 'VIP', 'VVIP'].map((p) => {
                const planData = user?.plans?.[p];
                const isCurrent = planKey === p || (planKey === 'WELCOME' && p === 'REGULAR');
                return (
                  <div key={p} style={{ 
                    display: "flex", 
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 10px",
                    background: isCurrent ? "rgba(59, 130, 246, 0.15)" : "transparent",
                    borderRadius: "6px",
                    border: isCurrent ? "1px solid rgba(59, 130, 246, 0.3)" : "none"
                  }}>
                    <span style={{ 
                      fontWeight: 800, 
                      fontSize: "13px",
                      color: isCurrent ? "#60a5fa" : "#e2e8f0"
                    }}>
                      {p}
                      {isCurrent && planKey === "WELCOME" && p === "REGULAR" && " (Welcome)"}
                    </span>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ 
                        color: planData?.completed ? "#4ade80" : "#94a3b8",
                        fontSize: "11px",
                        fontWeight: 600
                      }}>
                        {planData?.completed ? "✓" : "✗"}
                      </span>
                      <span style={{ 
                        color: planData?.is_activated ? "#4ade80" : "#fbbf24",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: planData?.is_activated ? "rgba(74, 222, 128, 0.15)" : "rgba(251, 191, 36, 0.15)",
                        padding: "2px 8px",
                        borderRadius: "20px"
                      }}>
                        {planData?.is_activated ? "Activated" : "Pending"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div style={{ marginTop: "24px", width: "100%" }}>
          <TrustBadges variant="compact" />
        </div>

        {/* Testimonials */}
        <div style={{ marginTop: "24px", width: "100%" }}>
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