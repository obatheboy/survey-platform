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
   INLINE STYLES WITH !important FOR VISIBILITY
========================= */
const styles = {
  overlay: {
    position: "fixed !important",
    top: "0 !important",
    left: "0 !important",
    right: "0 !important",
    bottom: "0 !important",
    background: "rgba(15, 23, 42, 0.95) !important",
    display: "flex !important",
    alignItems: "center !important",
    justifyContent: "center !important",
    zIndex: "99999 !important",
    padding: "16px !important",
    backdropFilter: "blur(4px) !important",
  },
  overlayCard: {
    maxWidth: "100% !important",
    width: "100% !important",
    background: "var(--bg-surface) !important",
    padding: "24px 20px !important",
    borderRadius: "16px !important",
    color: "var(--text-main) !important",
    textAlign: "center !important",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3) !important",
    border: "1px solid var(--border-soft) !important",
    margin: "0 16px !important",
  },
  page: {
    minHeight: "100vh !important",
    background: "var(--bg-main) !important",
    display: "flex !important",
    flexDirection: "column !important",
    alignItems: "center !important",
    padding: "12px !important",
    paddingTop: "12px !important",
    paddingBottom: "40px !important",
    fontFamily: "'Inter', sans-serif !important",
  },
  card: {
    maxWidth: "100% !important",
    width: "100% !important",
    background: "var(--bg-surface) !important",
    padding: "16px 14px !important",
    borderRadius: "16px !important",
    color: "var(--text-main) !important",
    border: "1px solid var(--border-soft) !important",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08) !important",
  },
  section: {
    marginTop: "16px !important",
    padding: "14px !important",
    borderRadius: "12px !important",
    background: "var(--bg-main) !important",
    border: "1px solid var(--border-soft) !important",
    fontSize: "13px !important",
    color: "var(--text-primary) !important",
  },
  sectionHighlight: {
    marginTop: "16px !important",
    padding: "14px !important",
    borderRadius: "12px !important",
    background: "rgba(37, 99, 235, 0.05) !important",
    border: "1px solid rgba(37, 99, 235, 0.1) !important",
    fontSize: "13px !important",
    color: "var(--text-primary) !important",
  },
  caption: {
    fontSize: "12px !important",
    color: "var(--primary) !important",
    fontWeight: "700 !important",
    marginBottom: "8px !important",
    lineHeight: "1.4 !important",
  },
  noteBox: {
    marginTop: "16px !important",
    padding: "12px !important",
    borderRadius: "10px !important",
    background: "var(--bg-surface) !important",
    fontSize: "12px !important",
    fontWeight: "600 !important",
    border: "1px solid var(--border-medium) !important",
    color: "var(--text-muted) !important",
    lineHeight: "1.4 !important",
  },
  notificationBox: {
    marginTop: "12px !important",
    padding: "12px !important",
    borderRadius: "10px !important",
    background: "rgba(16, 185, 129, 0.1) !important",
    color: "var(--regular-color) !important",
    fontWeight: "700 !important",
    border: "1px solid var(--regular-color) !important",
    fontSize: "12px !important",
  },
  activationFee: {
    color: "#dc2626 !important",
    fontWeight: "800 !important",
    fontSize: "14px !important",
  },
  copiedNote: {
    color: "var(--regular-color) !important",
    fontWeight: "700 !important",
    fontSize: "11px !important",
    marginTop: "6px !important",
  },
  input: {
    width: "100% !important",
    padding: "12px !important",
    marginTop: "12px !important",
    borderRadius: "10px !important",
    border: "2px solid var(--border-medium) !important",
    background: "var(--bg-surface) !important",
    color: "var(--text-main) !important",
    fontSize: "13px !important",
    fontFamily: "inherit !important",
    resize: "vertical !important",
    minHeight: "100px !important",
    boxSizing: "border-box !important",
  },
  button: {
    width: "100% !important",
    marginTop: "12px !important",
    padding: "14px !important",
    borderRadius: "12px !important",
    fontWeight: "700 !important",
    fontSize: "14px !important",
    cursor: "pointer !important",
    border: "none !important",
    display: "flex !important",
    alignItems: "center !important",
    justifyContent: "center !important",
    gap: "6px !important",
    minHeight: "48px !important",
    background: "var(--primary) !important",
    color: "#ffffff !important",
    boxShadow: "0 6px 12px -3px rgba(37, 99, 235, 0.3) !important",
  },
  copyBtn: {
    padding: "6px 12px !important",
    borderRadius: "8px !important",
    border: "none !important",
    background: "var(--primary) !important",
    color: "white !important",
    fontWeight: "700 !important",
    fontSize: "11px !important",
    cursor: "pointer !important",
    boxShadow: "0 3px 6px -1px rgba(37, 99, 235, 0.2) !important",
  },
  loadingContainer: {
    display: "flex !important",
    justifyContent: "center !important",
    alignItems: "center !important",
    minHeight: "100vh !important",
    fontSize: "14px !important",
    fontWeight: "600 !important",
    color: "var(--text-muted) !important",
    background: "var(--bg-main) !important",
    padding: "20px !important",
  },
  stepBox: {
    background: "rgba(59, 130, 246, 0.1) !important",
    border: "1px solid rgba(59, 130, 246, 0.2) !important",
    borderRadius: "8px !important",
    padding: "10px !important",
    margin: "6px 0 !important",
    color: "var(--text-primary) !important",
  },
  stepNumber: {
    display: "inline-flex !important",
    alignItems: "center !important",
    justifyContent: "center !important",
    width: "22px !important",
    height: "22px !important",
    background: "#3b82f6 !important",
    color: "white !important",
    borderRadius: "50% !important",
    fontWeight: "700 !important",
    fontSize: "11px !important",
    marginRight: "8px !important",
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
        <div style={{ textAlign: "center !important" }}>
          <div style={{
            width: "36px !important",
            height: "36px !important",
            border: "3px solid rgba(255, 255, 255, 0.1) !important",
            borderTopColor: "#00ff99 !important",
            borderRadius: "50% !important",
            margin: "0 auto 12px !important",
            animation: "spin 1s linear infinite !important"
          }}></div>
          <span style={{ color: "var(--text-primary) !important", fontWeight: "600 !important" }}>
            Loading activation details...
          </span>
        </div>
      </div>
    );
  }

  // Show plan selection when no plan is selected
  if (!planKey && user) {
    return (
      <div style={{ 
        minHeight: '100vh !important', 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%) !important',
        padding: '20px !important'
      }}>
        <div style={{
          maxWidth: '600px !important',
          margin: '0 auto !important',
          background: 'white !important',
          borderRadius: '16px !important',
          padding: '24px !important',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1) !important'
        }}>
          <h2 style={{ 
            textAlign: 'center !important', 
            marginBottom: '8px !important',
            color: '#1e293b !important',
            fontWeight: '700 !important'
          }}>
            🚀 Start Your Plan
          </h2>
          <p style={{ 
            textAlign: 'center !important', 
            marginBottom: '24px !important',
            color: '#64748b !important',
            fontWeight: '500 !important'
          }}>
            Select a plan to start completing surveys and earn money!
          </p>
          
          <div style={{ display: 'flex !important', flexDirection: 'column !important', gap: '12px !important' }}>
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
                    display: 'flex !important',
                    justifyContent: 'space-between !important',
                    alignItems: 'center !important',
                    padding: '16px 20px !important',
                    border: 'none !important',
                    borderRadius: '12px !important',
                    background: isActivated 
                      ? 'rgba(16, 185, 129, 0.1) !important' 
                      : isCompleted 
                        ? `linear-gradient(135deg, ${config.color}, ${config.color}dd) !important`
                        : 'rgba(100, 116, 139, 0.1) !important',
                    color: isActivated ? '#10b981 !important' : isCompleted ? 'white !important' : '#64748b !important',
                    cursor: isCompleted && !isActivated ? 'pointer !important' : 'not-allowed !important',
                    opacity: isCompleted && !isActivated ? '1 !important' : '0.6 !important',
                    transition: 'all 0.2s !important',
                    boxShadow: isCompleted && !isActivated ? '0 4px 15px rgba(0,0,0,0.1) !important' : 'none !important',
                    fontWeight: '600 !important'
                  }}
                >
                  <div style={{ textAlign: 'left !important' }}>
                    <div style={{ fontWeight: 'bold !important', fontSize: '1.1rem !important' }}>
                      {config?.label || p}
                    </div>
                    <div style={{ fontSize: '0.85rem !important', opacity: '0.9 !important' }}>
                      Earn up to KES {config?.total || 0}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right !important' }}>
                    {isActivated ? (
                      <span style={{ fontWeight: 'bold !important' }}>✅ Activated</span>
                    ) : isCompleted ? (
                      <span style={{ fontWeight: 'bold !important' }}>▶ Start Surveys</span>
                    ) : (
                      <span style={{ fontWeight: '500 !important' }}>{planData?.surveys_completed || 0}/10 surveys</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          
          <p style={{ 
            textAlign: 'center !important', 
            marginTop: '20px !important',
            fontSize: '0.85rem !important',
            color: '#94a3b8 !important',
            fontWeight: '500 !important'
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
              fontSize: "48px !important",
              marginBottom: "16px !important",
              animation: "bounce 1s infinite !important"
            }}>
              ✅
            </div>
            
            <h2 style={{ 
              color: "#10b981 !important", 
              textAlign: "center !important",
              fontSize: "20px !important",
              fontWeight: "800 !important",
              marginBottom: "12px !important"
            }}>
              PAYMENT SUBMITTED
            </h2>

            <p style={{ 
              marginTop: "12px !important", 
              lineHeight: "1.6 !important", 
              fontWeight: "500 !important",
              fontSize: "14px !important",
              color: "#475569 !important"
            }}>
              Your payment has been submitted for approval.
              <br /><br />
              Our team will verify your transaction and activate your account shortly.
              <br /><br />
              <strong style={{ fontWeight: "700 !important", color: "#1e293b !important" }}>Next Steps:</strong>
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
                marginTop: "20px !important",
                background: "#2563eb !important",
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
          boxShadow: `0 0 20px ${plan.glow} !important` 
        }}>
          <h2 style={{ 
            textAlign: "center !important", 
            color: `${plan.color} !important`,
            fontSize: "18px !important",
            marginBottom: "4px !important",
            fontWeight: "700 !important"
          }}>
            🔓 Account Activation
          </h2>

          {/* COMPACT TOP CAPTION - BOLDED FOR DARK THEME */}
          <div style={{
            marginTop: "4px !important",
            marginBottom: "16px !important",
            padding: "16px 12px !important",
            borderRadius: "14px !important",
            background: `linear-gradient(135deg, ${plan.color}15, ${plan.color}05) !important`,
            border: `1px solid ${plan.color}30 !important`,
            textAlign: "center !important"
          }}>
            <div style={{
              fontSize: "18px !important",
              fontWeight: "800 !important",
              color: "#ffffff !important",
              marginBottom: "8px !important",
              textShadow: "0 2px 4px rgba(0,0,0,0.3) !important"
            }}>
              🎉 CONGRATULATIONS! 🎉
            </div>
            
            <div style={{
              fontSize: "16px !important",
              fontWeight: "700 !important",
              color: "#e2e8f0 !important",
              marginBottom: "4px !important"
            }}>
              You have earned
            </div>
            
            <div style={{
              fontSize: "38px !important",
              fontWeight: "900 !important",
              color: `${plan.color} !important`,
              lineHeight: "1.2 !important",
              marginBottom: "10px !important",
              textShadow: `0 4px 12px ${plan.color}50 !important`
            }}>
              KES {plan.total}
            </div>
            
            <div style={{
              fontSize: "15px !important",
              fontWeight: "700 !important",
              color: "#2563eb !important",
              background: "rgba(255,255,255,0.95) !important",
              padding: "10px 20px !important",
              borderRadius: "40px !important",
              border: "1px solid rgba(255,255,255,0.2) !important",
              display: "inline-block !important",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15) !important"
            }}>
              Pay <span style={{ color: "#dc2626 !important", fontWeight: "900 !important", fontSize: "16px !important" }}>KES {plan.activationFee}</span> to withdraw
            </div>
          </div>

          {showPlanWarning && (
            <div style={{
              marginTop: "12px !important",
              padding: "10px !important",
              borderRadius: "8px !important",
              background: "rgba(245, 158, 11, 0.15) !important",
              border: "1px solid rgba(245, 158, 11, 0.4) !important",
              color: "#fbbf24 !important",
              fontSize: "12px !important",
              fontWeight: "700 !important"
            }}>
              ⚠️ <strong style={{ fontWeight: "800 !important", color: "#ffffff !important" }}>Note:</strong> You have completed VVIP surveys. 
              Make sure you're activating the correct plan. Current: <strong style={{color: "#ffffff !important", fontWeight: "800 !important"}}>{plan.label}</strong>
            </div>
          )}

          <div style={styles.section}>
            <p style={{ fontWeight: "800 !important", fontSize: "14px !important", marginBottom: "8px !important", color: "#ffffff !important" }}>
              📲 HOW TO PAY & ACTIVATE
            </p>

            <p style={styles.caption}>
              ⚠ <strong style={{color: "#ffffff !important", fontWeight: "800 !important"}}>IMPORTANT:</strong> Official CEO number - payments verified instantly
            </p>

            {/* STEP-BY-STEP GUIDE - COMPACT */}
            <div style={{ marginTop: "8px !important" }}>
              <div style={styles.stepBox}>
                <span style={styles.stepNumber}>1</span>
                <strong style={{color: "#ffffff !important", fontWeight: "800 !important"}}>Open M-Pesa</strong>
                <span style={{ fontSize: "12px !important", marginLeft: "4px !important", color: "#94a3b8 !important", fontWeight: "600 !important" }}>→ Lipa na M-PESA</span>
              </div>

              <div style={styles.stepBox}>
                <span style={styles.stepNumber}>2</span>
                <strong style={{color: "#ffffff !important", fontWeight: "800 !important"}}>Send Money</strong>
                <span style={{ fontSize: "12px !important", marginLeft: "4px !important", color: "#94a3b8 !important", fontWeight: "600 !important" }}>→ Enter <strong style={{color: "#ffffff !important", fontWeight: "800 !important"}}>{PHONE_NUMBER}</strong></span>
              </div>

              <div style={styles.stepBox}>
                <span style={styles.stepNumber}>3</span>
                <strong style={{color: "#ffffff !important", fontWeight: "800 !important"}}>Confirm: {BUSINESS_NAME}</strong>
              </div>

              <div style={styles.stepBox}>
                <span style={styles.stepNumber}>4</span>
                <strong style={{color: "#ffffff !important", fontWeight: "800 !important"}}>Amount: </strong>
                <span style={{...styles.activationFee, color: "#ef4444 !important", fontWeight: "900 !important"}}>KES {plan.activationFee}</span>
              </div>

              <div style={styles.stepBox}>
                <span style={styles.stepNumber}>5</span>
                <strong style={{color: "#ffffff !important", fontWeight: "800 !important"}}>Enter PIN & Complete</strong>
              </div>

              <div style={{
                ...styles.stepBox,
                background: "rgba(16, 185, 129, 0.2) !important",
                border: "1px solid rgba(16, 185, 129, 0.4) !important"
              }}>
                <span style={{...styles.stepNumber, background: "#10b981 !important"}}>6</span>
                <strong style={{ color: "#10b981 !important", fontWeight: "800 !important" }}>Paste confirmation below</strong>
                <span style={{ fontSize: "11px !important", display: "block !important", marginTop: "2px !important", color: "#6ee7b7 !important", fontWeight: "600 !important" }}>
                  Get KES {plan.total} instantly!
                </span>
              </div>
            </div>
          </div>

          <div style={styles.section}>
            <div style={{ 
              display: "flex !important",
              alignItems: "center !important",
              justifyContent: "space-between !important",
              flexWrap: "wrap !important",
              gap: "6px !important"
            }}>
              <span style={{ fontSize: "14px !important", fontWeight: "700 !important", color: "#ffffff !important" }}>📞 <strong style={{ fontWeight: "800 !important", color: "#ffffff !important" }}>{PHONE_NUMBER}</strong></span>
              <button 
                onClick={copyPhoneNumber} 
                style={styles.copyBtn}
              >
                📋 Copy Number
              </button>
            </div>
            {copied && <p style={styles.copiedNote}>✅ Phone number copied</p>}
          </div>

          <div style={styles.noteBox}>
            📌 Paste the <strong style={{color: "#ffffff !important", fontWeight: "800 !important"}}>FULL M-Pesa SMS</strong> below
            <br />
            <span style={{ fontSize: "11px !important", color: "#f87171 !important", fontWeight: "600 !important" }}>
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
                ? "#4b5563 !important"
                : `linear-gradient(135deg, ${plan.color}, ${plan.color}dd) !important`,
              fontWeight: "800 !important",
              fontSize: "15px !important"
            }}
          >
            {submitting ? (
              <>
                <span style={{
                  display: "inline-block !important",
                  width: "14px !important",
                  height: "14px !important",
                  border: "2px solid rgba(255,255,255,0.3) !important",
                  borderTopColor: "white !important",
                  borderRadius: "50% !important",
                  marginRight: "6px !important",
                  animation: "spin 1s linear infinite !important"
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
              background: "transparent !important",
              border: "2px solid #3b82f6 !important",
              color: "#3b82f6 !important",
              marginTop: "8px !important",
              fontWeight: "700 !important"
            }}
          >
            ⬅ Back to Dashboard
          </button>

          {/* PLAN STATUS SECTION - AT BOTTOM */}
          <div style={{
            marginTop: "20px !important",
            padding: "14px !important",
            borderRadius: "12px !important",
            background: "rgba(30, 41, 59, 0.8) !important",
            border: "1px solid #334155 !important",
            fontSize: "12px !important"
          }}>
            <div style={{ 
              fontWeight: "800 !important", 
              color: "#60a5fa !important",
              marginBottom: "10px !important",
              display: "flex !important",
              alignItems: "center !important",
              gap: "6px !important",
              fontSize: "14px !important"
            }}>
              📊 Plan Status
            </div>
            
            <div style={{ display: "flex !important", flexDirection: "column !important", gap: "6px !important" }}>
              {['REGULAR', 'VIP', 'VVIP'].map((p) => {
                const planData = user?.plans?.[p];
                const isCurrent = planKey === p || (planKey === 'WELCOME' && p === 'REGULAR');
                return (
                  <div key={p} style={{ 
                    display: "flex !important", 
                    justifyContent: "space-between !important",
                    alignItems: "center !important",
                    padding: "8px 10px !important",
                    background: isCurrent ? "rgba(59, 130, 246, 0.15) !important" : "transparent !important",
                    borderRadius: "6px !important",
                    border: isCurrent ? "1px solid rgba(59, 130, 246, 0.3) !important" : "none !important"
                  }}>
                    <span style={{ 
                      fontWeight: "700 !important", 
                      fontSize: "12px !important",
                      color: isCurrent ? "#93c5fd !important" : "#cbd5e1 !important"
                    }}>
                      {p}
                      {isCurrent && planKey === "WELCOME" && p === "REGULAR" && " (Welcome)"}
                    </span>
                    <div style={{ display: "flex !important", gap: "8px !important", alignItems: "center !important" }}>
                      <span style={{ 
                        color: planData?.completed ? "#4ade80 !important" : "#94a3b8 !important",
                        fontSize: "11px !important",
                        fontWeight: "600 !important"
                      }}>
                        {planData?.completed ? "✓" : "✗"}
                      </span>
                      <span style={{ 
                        color: planData?.is_activated ? "#4ade80 !important" : "#fbbf24 !important",
                        fontSize: "11px !important",
                        fontWeight: "700 !important",
                        background: planData?.is_activated ? "rgba(74, 222, 128, 0.15) !important" : "rgba(251, 191, 36, 0.15) !important",
                        padding: "2px 8px !important",
                        borderRadius: "20px !important"
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
        <div style={{ marginTop: "24px !important", width: "100% !important" }}>
          <TrustBadges variant="compact" />
        </div>

        {/* Testimonials */}
        <div style={{ marginTop: "24px !important", width: "100% !important" }}>
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