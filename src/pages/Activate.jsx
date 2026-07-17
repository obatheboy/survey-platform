import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import api from "../api/api";
import TrustBadges from "../components/TrustBadges";
import Testimonials from "../components/Testimonials";
import "./Activate.css";
import { planPaymentApi } from "../api/api";

const PHONE_NUMBER = "0140834185";
const BUSINESS_NAME = "OBADIAH OTOKI";

// TEMPORARY TOGGLE: set to true to re-enable the automatic MegaPay STK push
// payment option. Set to false to show manual M-Pesa Send Money only.
const AUTO_PAY_ENABLED = true;

const PLAN_CONFIG = {
  WELCOME_BONUS: {
    label: "Welcome Bonus",
    total: 1200,
    activationFee: 100,
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.2)"
  },
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

const ACTIVATION_PLANS = ["REGULAR", "VIP", "VVIP"];

const isPlanDone = (user, planKey) => {
   return user?.plans_paid?.[planKey] === true || user?.plans?.[planKey]?.is_activated === true || user?.[`${planKey.toLowerCase()}_paid`] === true;
 };

 const getRemainingActivationPlans = (user) => {
   return ACTIVATION_PLANS.filter(planKey => !isPlanDone(user, planKey));
 };

 const getNextActivationPlan = (user) => {
   return getRemainingActivationPlans(user)[0] || null;
 };

 const getDashboardFocusUrl = (planKey) => {
   return `/dashboard?focusPlan=${planKey}&highlightPlan=${planKey}`;
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
  const [paynectaPhone, setPaynectaPhone] = useState("");
  const [paynectaSubmitting, setPaynectaSubmitting] = useState(false);
  const [paynectaError, setPaynectaError] = useState("");
  const [paynectaWaiting, setPaynectaWaiting] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);
  const pollRef = useRef(null);

  const startPaymentPolling = (transactionRequestId, phone, targetPlanKey, userId) => {
    let attempts = 0;
    let pollTimer = null;
    let fallbackTimer = null;
    const maxAttempts = 40;
    const POLL_INTERVAL_MS = 3000;
    const INITIAL_DELAY_MS = 8000;
    const MAX_ATTEMPTS = 40;

    const stop = (errorMsg) => {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
      setPaynectaWaiting(false);
      if (errorMsg) setPaynectaError(errorMsg);
    };

    const schedulePoll = () => {
      pollTimer = setInterval(doPoll, POLL_INTERVAL_MS);
      fallbackTimer = setTimeout(() => {
        stop("Payment not confirmed yet. Please check your M-Pesa and try again.");
      }, 120000); // 2 minute total window
    };

    const doPoll = async () => {
      attempts++;
      try {
        const confirmBody = {
          transaction_request_id: transactionRequestId,
          phone: phone,
          plan: targetPlanKey
        };
        if (userId) confirmBody.user_id = userId;
        const confirmRes = await planPaymentApi.confirm(confirmBody);
        console.log(`Poll attempt ${attempts}`, confirmRes.data);

        if (confirmRes.data.success && (confirmRes.data.plan_paid || confirmRes.data.paid === true)) {
          stop();
          const remainingPlans = confirmRes.data.remaining_plans || [];
          setPaymentSuccessData({
            plan_paid: confirmRes.data.plan_paid || targetPlanKey,
            remaining_plans: remainingPlans,
            redirect_to: confirmRes.data.redirect_to || (remainingPlans.length > 0
              ? `/dashboard?focusPlan=${remainingPlans[0]}&highlightPlan=${remainingPlans[0]}`
              : "/dashboard"),
            all_plans_completed: confirmRes.data.all_plans_completed || false,
            success_message: confirmRes.data.success_message || confirmRes.data.message || `Payment successful for ${confirmRes.data.plan_paid || targetPlanKey}!`
          });
          setShowPaymentSuccess(true);
          if (confirmRes.data.user) setUser(prev => ({ ...prev, ...confirmRes.data.user }));
          return;
        }

        // If payment not yet confirmed but no hard error, keep polling
        if (!confirmRes.data.success && attempts < maxAttempts) {
          console.log(`⏳ Poll ${attempts}: not confirmed yet, continuing...`);
          return;
        }

        if (attempts >= maxAttempts) {
          stop("Payment verification timeout. Please check your M-Pesa and try again.");
        }
      } catch (err) {
        console.error(`Poll attempt ${attempts} error:`, err);
        if (attempts >= maxAttempts) {
          stop("Payment verification timeout. Please try again or use manual payment.");
        }
      }
    };

    setTimeout(schedulePoll, INITIAL_DELAY_MS);
  };

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

         let planFromQuery = null;
         if (isWelcome) {
           planFromQuery = "WELCOME_BONUS";
         } else if (planFromUrl && PLAN_CONFIG[planFromUrl.toUpperCase()]) {
           planFromQuery = planFromUrl.toUpperCase();
         } else if (statePlanKey && PLAN_CONFIG[statePlanKey.toUpperCase()]) {
           planFromQuery = statePlanKey.toUpperCase();
         }

         // Check if coming from withdraw form (handles both state and URL param)
         const isComingFromWithdraw = location.state?.from === "withdraw" || 
           location.state?.showPayment !== undefined ||
           location.state?.planKey !== undefined ||
           document.referrer.includes("withdraw-form");

         // If coming from withdraw, always show the activation page
         // Don't redirect based on plan status - user can decide to activate
         if (isComingFromWithdraw) {
           if (planFromQuery && PLAN_CONFIG[planFromQuery]) {
             let plan;
             if (planFromQuery === "WELCOME_BONUS") {
               plan = {
                 is_activated: false,
                 completed: true,
                 total: res.data.welcome_bonus || 1200
               };
             } else {
               plan = res.data.plans?.[planFromQuery] || { is_activated: false };
             }
             setPlanKey(planFromQuery);
             setPlanState(plan);
           } else {
             // No specific plan, show welcome bonus or first available
             setPlanKey("REGULAR");
             setPlanState({ is_activated: false, completed: false });
           }
           setLoading(false);
           return;
         }

         // Normal flow (not from withdraw)
         if (planFromQuery === "WELCOME_BONUS") {
           if (res.data.welcome_bonus_paid === true) {
             const nextPlan = getNextActivationPlan(res.data);
             if (nextPlan) {
               navigate(getDashboardFocusUrl(nextPlan), { replace: true });
             } else {
               navigate("/withdraw-form", { replace: true });
             }
             return;
           }
         }

         if (planFromQuery && ACTIVATION_PLANS.includes(planFromQuery)) {
           const nextPlan = getNextActivationPlan(res.data);

           if (isPlanDone(res.data, planFromQuery)) {
             if (nextPlan) {
               navigate(getDashboardFocusUrl(nextPlan), { replace: true });
             } else {
               navigate("/withdraw-form", { replace: true });
             }
             return;
           }

           if (nextPlan && nextPlan !== planFromQuery) {
             navigate(getDashboardFocusUrl(nextPlan), { replace: true });
             return;
           }

           const planData = res.data.plans?.[planFromQuery];
           if (!planData || (planData.surveys_completed || 0) < 10 || planData.completed !== true) {
             navigate(getDashboardFocusUrl(planFromQuery), { replace: true });
             return;
           }
         }

         if (!planFromQuery) {
           const nextPlan = getNextActivationPlan(res.data);
           if (!nextPlan) {
             navigate("/withdraw-form", { replace: true });
             return;
           }

           const planData = res.data.plans?.[nextPlan];
           if (planData?.completed === true || (planData?.surveys_completed || 0) >= 10) {
             navigate(`/activate?plan=${nextPlan.toLowerCase()}`, { replace: true });
           } else {
             navigate(getDashboardFocusUrl(nextPlan), { replace: true });
           }
           return;
         }

         let plan;
         if (planFromQuery === "WELCOME_BONUS") {
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

         if (!plan || (planFromQuery !== "WELCOME_BONUS" && plan.is_activated)) {
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

    // ========================================================
    //  BACK-BUTTON GUARD  (runs inside the compounded effect)
    //
    //  Handles two scenarios:
    //  A) Activate came from Surveys.jsx via submitBatchSurveys():
    //       History stack = [...prev] → /dashboard → /activate
    //       Back from /activate  →  /dashboard   ← submitBatchSurveys() already
    //                               handled this. This handler is a safety net.
    //  B) Activate was loaded directly / via a stale entry pointing
    //     to /surveys behind it:
    //       History stack = [...prev] → /surveys → /activate
    //       Back from /activate  →  /surveys  →  !popstate fires before React
    //                               unmounts Activate.jsx  →  handler call:
    //                               replaceState(null, "", "/dashboard")
    //                                   then browser processes:
    //                               [..prev] → /dashboard (instead of /surveys)
    //
    //  In B) the popstate event fires BEFORE Activate.jsx unmounts
    //  (React unmounts synchronously in the commit phase, which
    //  happens AFTER synchronous browser-level events), so the old
    //  DOM still owns the listener long enough for this handler to
    //  fire and call history.replaceState before page switches to
    //  /surveys.
    // ========================================================
    const preventBackToSurveys = () => {
      if (window.location.pathname.startsWith("/surveys")) {
        window.history.replaceState(null, "", "/dashboard");
      }
    };

    window.addEventListener("popstate", preventBackToSurveys);

    return () => {
      isMounted = false;
      window.removeEventListener("popstate", preventBackToSurveys);
    };
   }, [navigate, searchParams, location.state]);

    // Auto-set phone number from user's stored phone (once on mount)
   useEffect(() => {
     if (user?.phone && !paynectaPhone) {
       setPaynectaPhone(user.phone);
     }
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [user]);

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
        plan: planKey === "WELCOME_BONUS" ? "WELCOME_BONUS" : planKey,
      };
      
      const submitRes = await api.post("/activation/submit", requestData);
      
      const remainingPlans = submitRes.data?.remaining_plans || getRemainingActivationPlans(user);
      const hasRemainingPlans = remainingPlans && remainingPlans.length > 0;
      
      setPaymentSuccessData({
        plan_paid: planKey === "WELCOME_BONUS" ? "Welcome Bonus" : planKey,
        remaining_plans: remainingPlans,
        redirect_to: submitRes.data?.redirect_to || "/dashboard",
        redirect_focus: submitRes.data?.redirect_focus || null,
        all_plans_completed: false, // Manual submission always requires admin approval
        remaining_label: hasRemainingPlans
          ? `Remaining: ${remainingPlans.join(', ')}`
          : "Awaiting admin approval"
      });
      setShowSuccessPopup(true);
      return;
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

  useEffect(() => {
    if (showPaymentSuccess && paymentSuccessData) {
      const timer = setTimeout(() => {
        const target = paymentSuccessData.redirect_to || "/dashboard";
        navigate(target);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showPaymentSuccess, paymentSuccessData]);

  const handlePaynectaPayment = async () => {
    if (!paynectaPhone.trim()) {
      setPaynectaError("Please enter your phone number");
      return;
    }

    // Validate phone format
    const cleanedPhone = paynectaPhone.replace(/\s+/g, '');
    const phoneRegex = /^(0[17][0-9]{8}|254[17][0-9]{8}|[17][0-9]{9})$/;
    if (!phoneRegex.test(cleanedPhone)) {
      setPaynectaError("Invalid phone number. Use format: 07XXXXXXXX or 2547XXXXXXXX");
      return;
    }

    const targetPlanKey = planKey === "WELCOME_BONUS" ? "WELCOME_BONUS" : planKey;

setPaynectaSubmitting(true);
    setPaynectaError("");

    try {
      const response = await planPaymentApi.initiate(targetPlanKey, cleanedPhone);

      // Only treat as "STK sent" when the backend explicitly succeeded AND we have a real id to poll with.
      const apiMessage = response.data.message || "";
      const transactionRequestId = response.data.transaction_request_id || response.data.reference;

      if (response.data.success === true && transactionRequestId) {
        console.log("✅ STK push acknowledged by gateway. txId:", transactionRequestId);
        setPaynectaWaiting(true);
        startPaymentPolling(transactionRequestId, cleanedPhone, targetPlanKey, user._id);
      } else {
        console.error("❌ STK push NOT confirmed by gateway:", apiMessage, response.data);
        setPaynectaError(apiMessage || "Payment initiation failed. Please try again or use manual payment.");
        setPaynectaWaiting(false);
      }
    } catch (error) {
      console.error("Paynecta error:", error);

      if (error.code === 'ENOTFOUND') {
        setPaynectaError("Payment gateway temporarily unavailable. Please try again in a few minutes.");
      } else if (error.code === 'ECONNREFUSED') {
        setPaynectaError("Payment gateway connection refused. Please try again later.");
      } else if (error.code === 'ETIMEDOUT') {
        setPaynectaError("Payment gateway timed out. Please try again.");
      } else if (error.response?.data?.message) {
        setPaynectaError(error.response.data.message);
      } else {
        setPaynectaError("Network error. Please check your connection and try again.");
      }
      setPaynectaWaiting(false);
    } finally {
      setPaynectaSubmitting(false);
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
              {/* Welcome Bonus Button - for users who haven't received it yet */}
              {user?.welcome_bonus_received === false && (
                <button
                  key="WELCOME_BONUS"
                  onClick={() => {
                    navigate('/activate?welcome_bonus=true');
                  }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    border: 'none',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                    cursor: 'pointer',
                    opacity: 1,
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {PLAN_CONFIG.WELCOME_BONUS?.label}
                    </div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                      Earn up to KES {PLAN_CONFIG.WELCOME_BONUS?.total}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 'bold' }}>▶ Claim Now</span>
                  </div>
                </button>
              )}
              {['REGULAR', 'VIP', 'VVIP'].map((p) => {
                const planData = user?.plans?.[p];
                const isCompleted = planData?.completed || (planData?.surveys_completed || 0) >= 10;
                const isActivated = planData?.is_activated || user?.plans_paid?.[p] === true;
                const planPaid = user?.plans_paid?.[p];
                const config = PLAN_CONFIG[p];
               
               return (
                 <button
                   key={p}
                   onClick={() => {
                     if (!isCompleted) {
                       return; // Can't access - not completed surveys yet
                     }
                     if (isCompleted && !isActivated && !planPaid) {
                       // Need to pay activation fee
                       navigate('/activate?plan=' + p.toLowerCase());
                     } else if (isActivated || planPaid) {
                       localStorage.setItem('active_plan', p);
                       navigate('/surveys');
                     }
                   }}
                   disabled={!isCompleted}
                   style={{
                     display: 'flex',
                     justifyContent: 'space-between',
                     alignItems: 'center',
                     padding: '16px 20px',
                     border: 'none',
                     borderRadius: '12px',
                     background: isActivated || planPaid
                       ? 'rgba(16, 185, 129, 0.1)' 
                       : isCompleted 
                         ? `linear-gradient(135deg, ${config.color}, ${config.color}dd)`
                         : 'rgba(100, 116, 139, 0.1)',
                     color: isActivated || planPaid ? '#10b981' : isCompleted ? 'white' : '#64748b',
                     cursor: isCompleted ? 'pointer' : 'not-allowed',
                     opacity: isCompleted ? 1 : 0.6,
                     transition: 'all 0.2s',
                     boxShadow: isCompleted ? '0 4px 15px rgba(0,0,0,0.1)' : 'none'
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
                     {isActivated || planPaid ? (
                       <span style={{ fontWeight: 'bold' }}>✅ Activated</span>
                     ) : isCompleted ? (
                       <span style={{ fontWeight: 'bold' }}>▶ Pay Now</span>
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
    planKey === "WELCOME_BONUS"
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
              {planKey === "WELCOME_BONUS" ? (
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

{/* Payment Success Popup - Auto-verification (MegaPay STK) - ENHANCED STYLING */}
      {showPaymentSuccess && paymentSuccessData && (
        <div style={{
          ...styles.overlay,
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          animation: "fadeIn 0.3s ease-out"
        }}>
          <div style={{
            ...styles.overlayCard,
            maxWidth: "450px",
            padding: "32px 24px",
            background: "linear-gradient(145deg, #1e293b, #0f172a)",
            border: "2px solid #10b981",
            boxShadow: "0 0 40px rgba(16, 185, 129, 0.4), 0 0 80px rgba(16, 185, 129, 0.2)"
          }}>
            <div style={{ 
              fontSize: "64px", 
              marginBottom: "20px",
              animation: "pulse 2s infinite"
            }}>
              ✅
            </div>

            <h2 style={{ 
              color: "#10b981", 
              textAlign: "center", 
              fontSize: "26px", 
              fontWeight: 900, 
              marginBottom: "16px",
              textShadow: "0 0 10px rgba(16, 185, 129, 0.5)"
            }}>
              PAYMENT SUBMITTED!
            </h2>

            <div style={{
              background: "rgba(16, 185, 129, 0.15)",
              borderRadius: "16px",
              padding: "16px 20px",
              marginBottom: "20px",
              border: "1px solid rgba(16, 185, 129, 0.3)"
            }}>
              <p style={{ 
                fontWeight: 800, 
                fontSize: "18px", 
                color: "#ffffff", 
                marginBottom: "8px",
                textAlign: "center"
              }}>
                ✅ You've activated:
              </p>
              <p style={{ 
                fontWeight: 900, 
                fontSize: "22px", 
                color: "#fbbf24", 
                marginBottom: "12px",
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>
                {paymentSuccessData.plan_paid}
              </p>
            </div>

             {(!paymentSuccessData.remaining_plans || paymentSuccessData.remaining_plans.length === 0) ? (
              <div style={{
                background: "linear-gradient(135deg, #16a34a, #22c55e)",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px"
              }}>
                <p style={{ 
                  fontSize: "18px", 
                  color: "#ffffff",
                  fontWeight: 800,
                  textAlign: "center",
                  margin: 0
                }}>
                  🎉 ALL PLANS COMPLETE!
                </p>
                <p style={{ 
                  fontSize: "14px", 
                  color: "#dcfce7",
                  fontWeight: 600,
                  textAlign: "center",
                  margin: "8px 0 0 0"
                }}>
                  You can now withdraw your earnings!
                </p>
              </div>
            ) : (
              <div style={{
                background: "linear-gradient(135deg, #334155, #1e293b)",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
                border: "1px solid #475569"
              }}>
                <p style={{ 
                  fontSize: "15px", 
                  color: "#e2e8f0",
                  fontWeight: 700,
                  marginBottom: "8px",
                  textAlign: "center"
                }}>
                  ⏭️ Next Steps:
                </p>
                <p style={{ 
                  fontSize: "13px", 
                  color: "#cbd5e1",
                  marginBottom: "6px",
                  textAlign: "center"
                }}>
                  Complete {paymentSuccessData.remaining_plans.length > 1 ? "these plans" : "this plan"} to unlock withdrawals
                </p>
                <p style={{ 
                  fontSize: "16px", 
                  color: "#fbbf24", 
                  fontWeight: 800,
                  textAlign: "center",
                  margin: 0
                }}>
                  Remaining: {paymentSuccessData.remaining_plans.join(', ')}
                </p>
              </div>
            )}

            <p style={{ 
              fontSize: "13px", 
              color: "#94a3b8", 
              marginBottom: "20px",
              textAlign: "center"
            }}>
               🚀 Auto-redirecting in 6 seconds... Tap below to continue now
            </p>

            <button
              onClick={() => {
                setShowPaymentSuccess(false);
                const target = paymentSuccessData.redirect_to || "/dashboard";
                console.log("Continue button clicked, navigating to:", target);
                navigate(target);
              }}
              style={{ 
                ...styles.button, 
                marginTop: "8px", 
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                boxShadow: "0 8px 25px rgba(37, 99, 235, 0.4)",
                fontSize: "16px",
                fontWeight: 800,
                padding: "16px"
              }}
            >
              ✅ Continue Now
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

          {/* AUTO-PAY DISABLED TEMPORARILY - MANUAL PAYMENT ONLY */}
          {/* Set AUTO_PAY_ENABLED to true to bring back the MegaPay STK push block */}
          {AUTO_PAY_ENABLED && (
          <>
          {/* MEGAPAY STK PUSH - NEW PAYMENT OPTION */}
          <div style={{
            background: "linear-gradient(135deg, #0c4a6e 0%, #1d4ed8 50%, #7c3aed 100%)",
            border: "3px solid #60a5fa",
            borderRadius: "16px",
            padding: "16px",
            marginBottom: "20px",
            boxShadow: "0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            animation: "pulse-border 2s ease-in-out infinite"
          }}>
            {/* Shine effect overlay */}
            <div style={{
              position: "absolute",
              top: 0,
              left: "-100%",
              width: "100%",
              height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
              animation: "shimmer 3s ease-in-out infinite"
            }}></div>

            <div style={{ fontSize: "32px", marginBottom: "6px", animation: "bounce 2s infinite" }}>
              ⚡📱
            </div>

            <p style={{ fontWeight: 900, fontSize: "17px", color: "#ffffff", marginBottom: "6px", textShadow: "0 2px 8px rgba(0,0,0,0.3)", letterSpacing: "0.5px" }}>
              FAST & EASY ACTIVATION
            </p>

            <p style={{ color: "#e0f2fe", fontSize: "13px", marginBottom: "12px", fontWeight: 600, lineHeight: 1.4 }}>
              📲 Pay from your <strong>M-Pesa</strong> phone — enter your number and tap the button below then wait for STK and Enter your mpesa PIN to complete payment✅
            </p>

            <div style={{
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              padding: "10px 12px",
              marginBottom: "12px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(4px)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                <span style={{ color: "#e0f2fe", fontWeight: 600 }}>💰Amount to Pay is:</span>
                <span style={{ color: "#fbbf24", fontWeight: 900, fontSize: "18px", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                  KES {plan.activationFee}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", marginTop: "4px" }}>
                <span style={{ color: "#e0f2fe", fontWeight: 600 }}>💵After paying you will Receive:</span>
                <span style={{ color: "#4ade80", fontWeight: 900, fontSize: "17px" }}>
                  KES {plan.total}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: "10px", textAlign: "left" }}>
              <label style={{ ...styles.caption, color: "#93c5fd", fontWeight: "800", fontSize: "13px", marginBottom: "4px", display: "block" }}>
                📱 M-Pesa Number
              </label>
              <input
                type="tel"
                placeholder="2547XXXXXXXX or 07XXXXXXXX"
                value={paynectaPhone}
                onChange={(e) => setPaynectaPhone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "2px solid rgba(96, 165, 250, 0.4)",
                  background: "rgba(15, 23, 42, 0.8)",
                  color: "#ffffff",
                  fontSize: "16px",
                  fontWeight: "700",
                  boxSizing: "border-box",
                  outline: "none",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
                  letterSpacing: "1px"
                }}
                disabled={paynectaSubmitting}
              />
            </div>

            <button
              onClick={handlePaynectaPayment}
              disabled={paynectaSubmitting || !paynectaPhone.trim()}
              style={{
                width: "100%",
                marginTop: "6px",
                padding: "14px",
                borderRadius: "12px",
                fontWeight: 900,
                fontSize: "15px",
                cursor: "pointer",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                minHeight: "48px",
                background: paynectaSubmitting
                  ? "#4b5563"
                  : "linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ef4444 100%)",
                color: "#ffffff",
                boxShadow: paynectaSubmitting
                  ? "none"
                  : "0 8px 25px rgba(245, 158, 11, 0.5), 0 0 40px rgba(249, 115, 22, 0.3)",
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                letterSpacing: "0.5px",
                animation: paynectaSubmitting ? "none" : "pulse-btn 1.5s ease-in-out infinite"
              }}
            >
              {paynectaSubmitting ? (
                <>
                  <span style={{
                    display: "inline-block",
                    width: "16px",
                    height: "16px",
                    border: "3px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }}></span>
                  <span style={{ fontSize: "14px" }}>Sending…</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: "18px" }}>📱</span>
                  <span>TAP here to Pay KES {plan.activationFee} and ACTIVATE Account </span>
                  <span style={{ fontSize: "16px" }}>⚡</span>
                </>
              )}
            </button>

            {/* Error banner */}
            {paynectaError && (
              <div style={{
                marginTop: "10px",
                padding: "10px",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.2)",
                border: "2px solid rgba(239, 68, 68, 0.5)",
                color: "#fca5a5",
                fontWeight: 700,
                fontSize: "12px"
              }}>
                ❌ {paynectaError}
              </div>
            )}

              {/* Waiting for payment banner - shown after STK is sent */}
              {paynectaWaiting && (
                <div style={{
                  marginTop: "10px",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(22, 163, 74, 0.2), rgba(22, 163, 74, 0.3))",
                  border: "2px solid rgba(34, 197, 94, 0.5)",
                  color: "#bbf7d0",
                  fontWeight: 700,
                  fontSize: "14px",
                  textAlign: "center"
                }}>
                  <p style={{ margin: "0 0 8px 0", fontWeight: 800, color: "#ffffff" }}>
                    📲 STK Push Sent! Check your phone.
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#cbd5e1" }}>
                    Enter your M-Pesa PIN to complete payment. Verifying automatically...
                  </p>
                </div>
              )}
           </div>
          </>
          )}

          {/* MANUAL PAYMENT SECTION - ALWAYS VISIBLE */}
          <div style={{
            background: "#fff7ed",
            border: "3px solid #ea580c",
            borderRadius: "16px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0 8px 25px rgba(249, 115, 22, 0.4)",
            textAlign: "center"
          }}>
            <p style={{ fontWeight: 900, fontSize: "18px", color: "#9a3412", marginBottom: "12px" }}>
              Or Use Manual M-Pesa Send Money
            </p>
            <p style={{ color: "#c2410c", fontSize: "14px", marginBottom: "12px", fontWeight: 600 }}>
              Use Send Money if you prefer the manual method
            </p>
          </div>

          <div style={{ textAlign: "center", margin: "12px 0" }}>
            <span style={{ color: "#ea580c", fontSize: "14px", fontWeight: 800, background: "#fff7ed", padding: "8px 16px", borderRadius: "20px", border: "1px solid #fed7aa" }}>
              ✅ Manual Payment Only - Follow Steps Below
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

<button
             onClick={() => {
               // Check if plan is already activated (paid)
               if (user?.plans_paid?.[planKey] || user?.plans?.[planKey]?.is_activated) {
                 // Already activated - go back to withdraw form
                 if (location.state?.from === "withdraw") {
                   navigate("/withdraw-form");
                 }
                 return;
               }
               submitActivation();
             }}
             disabled={submitting}
             style={{
               ...styles.button,
               background: user?.plans_paid?.[planKey] || user?.plans?.[planKey]?.is_activated
                 ? "#10b981"
                 : submitting
                 ? "#4b5563"
                 : `linear-gradient(135deg, ${plan.color}, ${plan.color}dd)`,
               fontWeight: 800,
               fontSize: "15px"
             }}
           >
             {user?.plans_paid?.[planKey] || user?.plans?.[planKey]?.is_activated ? (
               "✅ Activated"
             ) : submitting ? (
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
               "SUBMIT MESSAGE FOR APPROVAL"
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
                const isCurrent = planKey === p || (planKey === 'WELCOME_BONUS' && p === 'REGULAR');
                const isPaid = planData?.is_activated || user?.plans_paid?.[p] === true;
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
                      {isCurrent && planKey === "WELCOME_BONUS" && p === "REGULAR" && " (Welcome)"}
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
                        background: isPaid ? "rgba(74, 222, 128, 0.15)" : "rgba(251, 191, 36, 0.15)",
                        padding: "2px 8px",
                        borderRadius: "20px"
                      }}>
                        {isPaid ? "Activated" : "Pending"}
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
      </div>
      </>
  );
}