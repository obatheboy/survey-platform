import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import api from "../api/api";
import TrustBadges from "../components/TrustBadges";
import Testimonials from "../components/Testimonials";
import "./Activate.css";

const PHONE_NUMBER = "0140834185";
const BUSINESS_NAME = "OBADIAH OTOKI";

const PLAN_CONFIG = {
  REGULAR: { 
    label: "REGULAR SURVEYS", 
    total: 1500, 
    activationFee: 100, 
    color: "#10b981", 
    glow: "rgba(16, 185, 129, 0.2)" 
  },
  VIP: { 
    label: "VIP SURVEY", 
    total: 2000, 
    activationFee: 200, 
    color: "#6366f1", 
    glow: "rgba(99, 102, 241, 0.2)" 
  },
  VVIP: { 
    label: "VVIP SURVEYS", 
    total: 3000, 
    activationFee: 300, 
    color: "#f59e0b", 
    glow: "rgba(245, 158, 11, 0.2)" 
  },
};

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
    background: "#1e293b",
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
    background: "#0f172a",
    padding: "16px 14px",
    borderRadius: "16px",
    color: "#ffffff",
    border: "1px solid #334155",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
  },
  caption: {
    fontSize: "12px",
    color: "#e2e8f0",
    fontWeight: 700,
    marginBottom: "8px",
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
    background: "#fff7ed",
    border: "1px solid #fed7aa",
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
    background: "#ea580c",
    color: "white",
    borderRadius: "50%",
    fontWeight: 900,
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
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentNotification, setPaymentNotification] = useState(null);
  const [isWelcomeBonus, setIsWelcomeBonus] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState("");
  const [showPaynectaInline, setShowPaynectaInline] = useState(false);
  
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
        setIsWelcomeBonus(!!isWelcome);

        let planFromQuery;
        if (isWelcome) {
          planFromQuery = "WELCOME";
        } else if (planFromUrl && PLAN_CONFIG[planFromUrl.toUpperCase()]) {
          planFromQuery = planFromUrl.toUpperCase();
        } else if (statePlanKey && PLAN_CONFIG[statePlanKey.toUpperCase()]) {
          planFromQuery = statePlanKey.toUpperCase();
        } else {
          const userPlans = res.data.plans || {};
          let highestPlan = null;
          
          if (userPlans.VVIP && userPlans.VVIP.completed && !userPlans.VVIP.is_activated) {
            highestPlan = "VVIP";
          } else if (userPlans.VIP && userPlans.VIP.completed && !userPlans.VIP.is_activated) {
            highestPlan = "VIP";
          } else if (userPlans.REGULAR && userPlans.REGULAR.completed && !userPlans.REGULAR.is_activated) {
            highestPlan = "REGULAR";
          }
          
          planFromQuery = highestPlan || null;
        }

        let plan;
        if (planFromQuery === "WELCOME") {
          plan = { 
            is_activated: false, 
            completed: true, 
            total: res.data.welcome_bonus || 1200 
          };
        } else if (!planFromQuery) {
          plan = null;
        } else {
          plan = res.data.plans?.[planFromQuery];
        }

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

  // Check for payment return from Paynecta
  useEffect(() => {
    const paymentRef = searchParams.get("reference");
    const paymentStatus = searchParams.get("payment");
    
    if (paymentRef && paymentStatus === "success") {
      console.log("Payment successful, reference:", paymentRef);
      verifyAndActivate(paymentRef);
    }
  }, [searchParams]);

  const verifyAndActivate = async (reference) => {
    try {
      setPaymentLoading(true);
      const res = await api.post("/activation/verify-paynecta", {
        reference: reference,
        plan: planKey === "WELCOME" ? "REGULAR" : planKey,
        is_welcome_bonus: isWelcomeBonus
      });
      
      if (res.data.success && res.data.activated) {
        setShowSuccessPopup(true);
        localStorage.setItem("showWelcomeBonusOnDashboard", "true");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
    } finally {
      setPaymentLoading(false);
    }
  };

  /* =========================
     DIRECT STK PUSH - NO REDIRECT, CUSTOMER STAYS ON APP
     ========================= */
   const initiateDirectStk = async () => {
     let formattedPhone = paymentPhone.replace(/[^0-9]/g, '');
     
      if (!formattedPhone || formattedPhone.length < 9) {
        setPaymentNotification({
          type: "error",
          message: "Please enter a valid phone number (e.g., 0712345678, 0110123456, or 0100123456)"
        });
        return;
      }
      
      // Remove leading 0 if present, but keep 254 prefix if already present
      if (formattedPhone.startsWith('254')) {
        // Already in international format - keep as is
      } else if (formattedPhone.startsWith('0') && formattedPhone.length > 1) {
        formattedPhone = formattedPhone.substring(1);
      }
      
      // Validate Kenyan mobile prefixes after removing leading 0:
      // Standard: 7xxxxxxx (9 digits) — 070, 071, 072, 074, 075, 076, 078, 079
      // Safaricom 01: 11xxxxxxx (9 digits) — 011, 0110, 0111
      // Airtel 01: 10xxxxxxx (9 digits) — 0100, 0101, 0102
      // Or already in 254 format (12 digits)
      const firstDigit = formattedPhone.charAt(0);
      const firstTwo = formattedPhone.substring(0, 2);
      const firstThree = formattedPhone.substring(0, 3);
      
      const isAlreadyInternational = formattedPhone.startsWith('254') && formattedPhone.length === 12;
      const isValidPrefix = 
        isAlreadyInternational ||
        // Standard mobile: starts with 7, exactly 9 digits
        (firstDigit === '7' && formattedPhone.length === 9) ||
        // Safaricom 01: starts with 11 (011, 0110, 0111), exactly 9 digits
        (firstTwo === '11' && formattedPhone.length === 9) ||
        // Airtel 01: starts with 10 (0100, 0101, 0102), exactly 9 digits
        (firstTwo === '10' && formattedPhone.length === 9);
      
      if (!isValidPrefix) {
        setPaymentNotification({
          type: "error",
          message: "Phone must be a valid Kenyan mobile: 07XXXXXXXX, 011XXXXXXXX, 0100XXXXXX, or 2547XXXXXXXX"
        });
        return;
      }
      
      // Prepend Kenya country code if not already present
      if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + formattedPhone;
      }
      
      // Ensure final number is exactly 12 digits (254 + 9 digits)
      if (formattedPhone.length !== 12) {
        setPaymentNotification({
          type: "error",
          message: "Invalid phone number format"
        });
        return;
      }
    
    setPaymentNotification(null);
    setPaymentLoading(true);
    
    // ✅ FIX: Convert WELCOME to REGULAR for backend
    const actualPlan = planKey === "WELCOME" ? "REGULAR" : planKey;
    const activationFee = PLAN_CONFIG[actualPlan]?.activationFee || 100;
    
    try {
      console.log("📱 Initiating DIRECT STK Push:", { 
        plan: actualPlan, 
        originalPlan: planKey,
        amount: activationFee, 
        phone: formattedPhone 
      });
      
      const res = await api.post("/activation/initiate-direct-stk", {
        plan: actualPlan,
        phone_number: formattedPhone,
        is_welcome_bonus: isWelcomeBonus
      });
      
      console.log("Direct STK response:", res.data);
      
      if (res.data.success) {
        setPaymentNotification({
          type: "success",
          message: "📱 STK Push sent! Check your phone and enter your M-Pesa PIN to complete payment."
        });
        
        const paymentRef = res.data.reference;
        localStorage.setItem("pendingActivationRef", paymentRef);
        localStorage.setItem("pendingPlanKey", planKey);
        
        pollPaymentStatus(paymentRef);
      } else {
        setPaymentNotification({
          type: "error",
          message: res.data.message || "Payment failed. Please try manual payment below."
        });
      }
    } catch (error) {
      console.error("Direct STK error:", error.response?.data || error);
      setPaymentNotification({
        type: "error",
        message: error.response?.data?.message || "Failed to initiate payment. Please try manual payment below."
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  // Poll payment status for Direct STK
  const pollPaymentStatus = async (reference) => {
    let attempts = 0;
    const maxAttempts = 20;
    
    const poll = async () => {
      try {
        const res = await api.post("/activation/verify-paynecta", {
          reference: reference,
          plan: planKey === "WELCOME" ? "REGULAR" : planKey,
          is_welcome_bonus: isWelcomeBonus
        });
        
        if (res.data.success && res.data.activated) {
          setPaymentNotification({
            type: "success",
            message: "✅ Payment successful! Your account is now activated."
          });
          
          localStorage.setItem("showWelcomeBonusOnDashboard", "true");
          localStorage.removeItem("pendingActivationRef");
          localStorage.removeItem("pendingPlanKey");
          
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setPaymentNotification({
            type: "info",
            message: `Checking payment status... (${attempts}/${maxAttempts})`
          });
          setTimeout(poll, 3000);
        } else {
          setPaymentNotification({
            type: "info",
            message: "⏳ Payment may still be processing. You can check again or use manual payment."
          });
        }
      } catch (err) {
        console.error("Poll error:", err);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        }
      }
    };
    
    setTimeout(poll, 3000);
  };

  const copyPhoneNumber = async () => {
    try {
      await navigator.clipboard.writeText(PHONE_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setNotification("⚠️ Failed to copy. Please copy manually.");
    }
  };

  const submitActivation = async () => {
    if (!paymentText.trim()) {
      setNotification("❌ Paste the FULL M-Pesa confirmation message.");
      return;
    }

    setSubmitting(true);
    setNotification(null);

    try {
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
          <h2 style={{ textAlign: 'center', marginBottom: '8px', color: '#1e293b' }}>
            🚀 Start Your Plan
          </h2>
          <p style={{ textAlign: 'center', marginBottom: '24px', color: '#64748b' }}>
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
                        ? `linear-gradient(135deg, ${config.color}, ${config.color}dd)`
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
          
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: '#94a3b8' }}>
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

  const showPlanWarning = planKey === "VIP" && user?.plans?.VVIP?.completed && !user?.plans?.VVIP?.is_activated;

  return (
    <>
      {showSuccessPopup && (
        <div style={styles.overlay}>
          <div style={styles.overlayCard}>
            <div style={{ fontSize: "48px", marginBottom: "16px", animation: "bounce 1s infinite" }}>
              ✅
            </div>
            
            <h2 style={{ color: "#10b981", textAlign: "center", fontSize: "20px", fontWeight: 800, marginBottom: "12px" }}>
              PAYMENT SUBMITTED
            </h2>

            <p style={{ marginTop: "12px", lineHeight: "1.6", fontWeight: 500, fontSize: "14px", color: "#475569" }}>
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
                  3. Complete VVIP PLAN (250) to unlock withdrawals
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
              style={{ ...styles.button, marginTop: "20px", background: "#2563eb" }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      <div className="activate-page" style={styles.page}>
        <div style={{ ...styles.card, boxShadow: `0 0 20px ${plan.glow}` }}>
          <h2 style={{ textAlign: "center", color: plan.color, fontSize: "18px", marginBottom: "4px", fontWeight: 700 }}>
            🔓 Account Activation
          </h2>

          <div className="activate-top-caption" style={{
            marginTop: "4px",
            marginBottom: "16px",
            padding: "16px 12px",
            borderRadius: "14px",
            background: "#1e293b",
            border: "1px solid #334155",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", marginBottom: "8px", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
              🎉 CONGRATULATIONS! 🎉
            </div>
            
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#e2e8f0", marginBottom: "4px" }}>
              You have earned
            </div>
            
            <div style={{ fontSize: "38px", fontWeight: 900, color: "#10b981", lineHeight: "1.2", marginBottom: "10px", textShadow: "0 4px 12px rgba(16, 185, 129, 0.5)" }}>
              KES {plan.total}
            </div>
            
            <div style={{
              fontSize: "15px !important",
              fontWeight: "700 !important",
              color: "#1e293b !important",
              background: "#fef3c7 !important",
              padding: "12px 24px !important",
              borderRadius: "40px !important",
              border: "2px solid #f59e0b !important",
              display: "inline-block !important",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3) !important"
            }}>
              ⚡ <span style={{ 
                color: "#b91c1c !important", 
                fontWeight: "900 !important", 
                fontSize: "22px !important", 
                background: "#fee2e2 !important", 
                padding: "4px 10px !important", 
                borderRadius: "8px !important", 
                border: "2px solid #dc2626 !important" 
              }}>Pay KES {plan.activationFee}</span> activation fee to activate your account and withdraw your earnings!
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

          <div style={{ 
            background: "#fff7ed", 
            border: "3px solid #ea580c",
            borderRadius: "16px", 
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 8px 25px rgba(249, 115, 22, 0.4)"
          }}>
            <p style={{ fontWeight: 900, fontSize: "18px", color: "#9a3412", marginBottom: "16px", textAlign: "center" }}>
              ⚡ PAY AUTOMATIC NOW & WITHDRAW IMMEDIATELY
            </p>

            <p style={{ color: "#c2410c", fontSize: "14px", marginBottom: "12px", fontWeight: 900, textAlign: "center" }}>
              📋 STEP-BY-STEP GUIDE:
            </p>
               
            <div style={{ marginBottom: "16px", padding: "14px", background: "#fff7ed", borderRadius: "10px", border: "2px solid #fed7aa" }}>
              <div style={{ marginBottom: "12px" }}>
                <span style={{ color: "#ea580c", fontWeight: 900, fontSize: "14px" }}>Step 1:</span>
                <span style={{ color: "#1e293b", fontWeight: 700, fontSize: "13px", marginLeft: "6px" }}>Tap the "Pay KES {plan.activationFee} Now" button below</span>
              </div>
              <div style={{ marginBottom: "12px" }}>
                <span style={{ color: "#ea580c", fontWeight: 900, fontSize: "14px" }}>Step 2:</span>
                <span style={{ color: "#1e293b", fontWeight: 700, fontSize: "13px", marginLeft: "6px" }}>Enter the phone number you will use to pay </span>
              </div>
              <div>
                <span style={{ color: "#ea580c", fontWeight: 900, fontSize: "14px" }}>Step 3:</span>
                <span style={{ color: "#1e293b", fontWeight: 700, fontSize: "13px", marginLeft: "6px" }}>Wait for STK push and enter your mpesa PIN to complete payment</span>
              </div>
            </div>
               
            {showPaynectaInline ? (
              <div style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "20px",
                textAlign: "center",
                marginBottom: "10px",
                border: "2px solid #00A859"
              }}>
                <p style={{ color: "#166534", fontSize: "14px", fontWeight: "700", marginBottom: "12px" }}>
                  💳 Pay with M-Pesa (STK Push)
                </p>
                
                <div style={{ marginBottom: "16px", textAlign: "left" }}>
                  <label style={{ 
                    display: "block", 
                    fontSize: "13px", 
                    fontWeight: "600", 
                    color: "#166534",
                    marginBottom: "6px"
                  }}>
                    📱 Enter your M-Pesa phone number:
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g., 0712345678, 0110123456, or 0100123456"
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "10px",
                      border: "2px solid #d1d5db",
                      fontSize: "16px",
                      fontWeight: "500",
                      background: "#f9fafb"
                    }}
                   />
                   <p style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
                     Valid formats: 07XXXXXXXX (Safaricom/Airtel), 011XXXXXXXX, 0100XXXXXX (Airtel)
                   </p>
                 </div>
                
                <button
                  onClick={initiateDirectStk}
                  disabled={paymentLoading}
                  style={{
                    width: "100%",
                    padding: "16px",
                    background: paymentLoading ? "#86efac" : "#00A859",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "16px",
                    fontWeight: "800",
                    cursor: paymentLoading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(0, 168, 89, 0.4)"
                  }}
                >
                  {paymentLoading ? "Sending STK Push..." : `💳 Pay KES ${plan.activationFee}`}
                </button>
                
                {paymentNotification && (
                  <div style={{
                    marginTop: "12px",
                    padding: "10px",
                    borderRadius: "8px",
                    background: paymentNotification.type === "success" ? "#dcfce7" : 
                               paymentNotification.type === "error" ? "#fee2e2" : "#fef3c7"
                  }}>
                    <p style={{ 
                      color: paymentNotification.type === "success" ? "#166534" : 
                             paymentNotification.type === "error" ? "#dc2626" : "#92400e",
                      fontSize: "13px",
                      fontWeight: "600",
                      margin: 0
                    }}>
                      {paymentNotification.message}
                    </p>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setShowPaynectaInline(false);
                    setPaymentNotification(null);
                    setPaymentPhone("");
                  }}
                  style={{
                    marginTop: "8px",
                    padding: "8px",
                    background: "transparent",
                    color: "#64748b",
                    border: "none",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  ← Back
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowPaynectaInline(true);
                }}
                style={{
                  width: "100%",
                  padding: "18px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#00A859",
                  color: "#ffffff",
                  fontSize: "18px",
                  fontWeight: 900,
                  cursor: "pointer",
                  marginBottom: "10px",
                  boxShadow: "0 4px 15px rgba(0, 168, 89, 0.5)"
                }}
              >
                Pay KES {plan.activationFee} Now
              </button>
            )}
          </div>

          <div style={{ textAlign: "center", margin: "12px 0" }}>
            <span style={{ color: "#ea580c", fontSize: "12px", fontWeight: 700, background: "#fff7ed", padding: "6px 12px", borderRadius: "20px", border: "1px solid #fed7aa" }}>
              - Or Pay Manually if The Automatic Fails -
            </span>
          </div>

          <p style={{ ...styles.caption, color: "#9a3412" }}>
            ⚠ <strong style={{color: "#c2410c", fontWeight: 900}}>IMPORTANT:</strong> Use Send Money to <strong style={{color: "#ea580c", fontSize: "14px", fontWeight: 900}}>{PHONE_NUMBER} - {BUSINESS_NAME}</strong>
          </p>

          <div style={{ marginTop: "8px" }}>
            <div className="activate-step-box" style={styles.stepBox}>
              <span style={styles.stepNumber}>1</span>
              <strong style={{color: "#9a3412", fontWeight: 900}}>Open M-Pesa</strong>
              <span style={{ fontSize: "12px", marginLeft: "4px", color: "#c2410c", fontWeight: 700 }}>→ Send Money</span>
            </div>

            <div className="activate-step-box" style={styles.stepBox}>
              <span style={styles.stepNumber}>2</span>
              <strong style={{color: "#9a3412", fontWeight: 900}}>Send Money</strong>
              <span style={{ fontSize: "12px", marginLeft: "4px", color: "#c2410c", fontWeight: 700 }}>→ Enter <strong style={{color: "#9a3412", fontWeight: 900}}>{PHONE_NUMBER}</strong></span>
            </div>

            <div className="activate-step-box" style={styles.stepBox}>
              <span style={styles.stepNumber}>3</span>
              <strong style={{color: "#9a3412", fontWeight: 900}}>Confirm Name: <span style={{color: "#ea580c"}}>{BUSINESS_NAME}</span></strong>
            </div>

            <div className="activate-step-box" style={styles.stepBox}>
              <span style={styles.stepNumber}>4</span>
              <strong style={{color: "#9a3412", fontWeight: 900}}>Amount: </strong>
              <span style={{...styles.activationFee, color: "#ffffff", fontWeight: 900, background: "#ea580c", padding: "2px 8px", borderRadius: "4px"}}>KES {plan.activationFee}</span>
            </div>

            <div className="activate-step-box" style={styles.stepBox}>
              <span style={styles.stepNumber}>5</span>
              <strong style={{color: "#9a3412", fontWeight: 900}}>Enter PIN & Complete</strong>
            </div>

            <div className="activate-step-box activate-step-box-success" style={{
              ...styles.stepBox,
              background: "#ecfccb",
              border: "1px solid #84cc16"
            }}>
              <span style={{...styles.stepNumber, background: "#16a34a"}}>6</span>
              <strong style={{ color: "#166534", fontWeight: 900 }}>Enter Details</strong>
              <span style={{ fontSize: "11px", display: "block", marginTop: "4px", color: "#15803d", fontWeight: 700 }}>
                Get KES {plan.total} instantly!
              </span>
              
              <div style={{ marginTop: "10px" }}>
                <div style={{ fontSize: "12px", color: "#166534", fontWeight: 800, marginBottom: "6px" }}>
                  📌 Paste M-Pesa SMS (Include Transaction ID, Amount & Time)
                </div>
                <textarea
                  placeholder="Paste M-Pesa confirmation here..."
                  value={paymentText}
                  onChange={(e) => setPaymentText(e.target.value)}
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "2px solid #fed7aa",
                    background: "#ffffff",
                    color: "#333333",
                    fontSize: "12px",
                    fontFamily: "inherit",
                    resize: "vertical",
                    minHeight: "60px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              
              <button 
                onClick={copyPhoneNumber} 
                style={{...styles.copyBtn, marginTop: "8px"}}
              >
                📋 Copy Number
              </button>
              {copied && <p style={{...styles.copiedNote, color: "#16a34a", fontWeight: 700, marginTop: "6px"}}>✅ Phone number copied</p>}
            </div>
          </div>
        </div>

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

        <div style={{ marginTop: "24px", width: "100%" }}>
          <TrustBadges variant="compact" />
        </div>

        <div style={{ marginTop: "24px", width: "100%" }}>
          <Testimonials variant="carousel" />
        </div>
      </div>
    </>
  );
}