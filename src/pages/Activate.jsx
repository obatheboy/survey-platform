import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import api from "../api/api";
import { useCurrency, COUNTRIES, UGANDA_RECIPIENT } from "../contexts/CurrencyContext.jsx";
import TrustBadges from "../components/TrustBadges";
import Testimonials from "../components/Testimonials";
import "./Activate.css";
import { planPaymentApi } from "../api/api";
import { ACTIVATION_FEE, SURVEY_EARNINGS } from "../constants/fees";

const PHONE_NUMBER = "0140834185";

// TEMPORARY TOGGLE: set to true to re-enable the automatic MegaPay STK push
// payment option. Set to false to show manual M-Pesa Send Money only.
const AUTO_PAY_ENABLED = true;

// Single KES 100 activation fee, imported from constants/fees.js so it always
// matches the backend. Paying it only UNLOCKS the account - it pays out
// nothing. The only money a user ever receives is the KES 1200 welcome
// bonus (credited at signup) and KES 75 per completed survey.
const PLAN_CONFIG = {
  WELCOME_BONUS: {
    label: "Welcome Bonus",
    total: 1200,
    activationFee: ACTIVATION_FEE,
    color: "#06b6d4",
    glow: "rgba(6, 182, 212, 0.2)"
  },
  REGULAR: {
    label: "Activate Account",
    total: 0,
    activationFee: ACTIVATION_FEE,
    color: "#06b6d4",
    glow: "rgba(6, 182, 212, 0.2)"
  },
  VIP: {
    label: "Activate Account",
    total: 0,
    activationFee: ACTIVATION_FEE,
    color: "#7c3aed",
    glow: "rgba(124, 58, 237, 0.2)"
  },
  VVIP: {
    label: "Activate Account",
    total: 0,
    activationFee: ACTIVATION_FEE,
    color: "#ff6b6b",
    glow: "rgba(255, 107, 107, 0.2)"
  },
};

const ACTIVATION_PLANS = ["REGULAR", "VIP", "VVIP"];

const isPlanDone = (user, planKey) => {
   return user?.plans_paid?.[planKey] === true || user?.plans?.[planKey]?.is_activated === true || user?.[`${planKey.toLowerCase()}_paid`] === true;
 };

const getRemainingActivationPlans = (user) => {
    return ACTIVATION_PLANS.filter(planKey => !isPlanDone(user, planKey));
  };

/* =====================================================
   ACTIVATION LOADING SCREEN
   Bails out to the dashboard after a few seconds rather than spinning
   forever. The dashboard's own guard is the authority on activation, so
   if the user already paid, landing there is the correct outcome; if they
   did not, they get redirected straight back to a working payment page.
   ===================================================== */
const LOADING_BAILOUT_MS = 6000;

function ActivationLoadingScreen({ onTimeout }) {
  useEffect(() => {
    const timer = setTimeout(onTimeout, LOADING_BAILOUT_MS);
    return () => clearTimeout(timer);
  }, [onTimeout]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      background: "#0f0a1a",
      color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        border: "3px solid rgba(255,255,255,0.15)",
        borderTopColor: "#06b6d4",
        animation: "lb-spin 0.8s linear infinite",
      }} />
      <p style={{ fontSize: "14px", fontWeight: 600, margin: 0, color: "rgba(255,255,255,0.8)" }}>
        Loading activation fee…
      </p>
      <button
        onClick={onTimeout}
        style={{
          marginTop: "8px",
          padding: "10px 20px",
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.25)",
          background: "transparent",
          color: "rgba(255,255,255,0.85)",
          fontSize: "13px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Continue to hub
      </button>
      <style>{"@keyframes lb-spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}


const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 10, 26, 0.95)",
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
    background: "#1a1128",
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
    background: "#0f0a1a",
    padding: "16px 14px",
    borderRadius: "16px",
    color: "#ffffff",
    border: "1px solid #251a3a",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
  },
  caption: {
    fontSize: "12px",
    color: "#e2e8f0",
    fontWeight: 700,
    marginBottom: "8px",
    lineHeight: "1.4",
  },
  activationFee: {
    color: "#ef4444",
    fontWeight: 800,
    fontSize: "14px",
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
    boxShadow: "0 6px 12px -3px rgba(124, 58, 237, 0.3)",
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
    boxShadow: "0 3px 6px -1px rgba(124, 58, 237, 0.2)",
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
    background: "#ef4444",
    color: "white",
    borderRadius: "50%",
    fontWeight: 900,
    fontSize: "12px",
    marginRight: "8px",
  },
};

export default function Activate() {
  const { country, format, config: currencyConfig, isUganda } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

const [planKey, setPlanKey] = useState(null);
  const [planState, setPlanState] = useState(null);
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

  const startPaymentPolling = (transactionRequestId, phone, targetPlanKey) => {
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
        // user_id is intentionally NOT sent: the server resolves the account
        // from the verified JWT only, so a body-supplied id cannot be used to
        // confirm a payment against somebody else's account.
        const confirmRes = await planPaymentApi.confirm(confirmBody);
        console.log(`Poll attempt ${attempts}`, confirmRes.data);

        // Treat any affirmative confirmation as paid. The backend reports this
        // three different ways depending on the branch it took:
        //   - plan_paid (fresh verification)
        //   - paid === true (some flows)
        //   - already_paid === true (the payment was confirmed on an
        //     earlier poll; the endpoint short-circuits and never sets
        //     plan_paid, which previously left the user polling until
        //     timeout instead of entering the app).
        const confirmed =
          confirmRes.data.plan_paid ||
          confirmRes.data.paid === true ||
          confirmRes.data.already_paid === true;

        if (confirmRes.data.success && confirmed) {
          stop();
          const remainingPlans = confirmRes.data.remaining_plans || [];
          setPaymentSuccessData({
            plan_paid: confirmRes.data.plan_paid || targetPlanKey,
            remaining_plans: remainingPlans,
            redirect_to: confirmRes.data.redirect_to || (remainingPlans.length > 0
              ? `/dashboard?focusPlan=${remainingPlans[0]}&highlightPlan=${remainingPlans[0]}`
              : "/hub"),
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
          stop("Payment verification timeout. Please try again.");
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

// If coming from withdraw, check if already activated
          if (isComingFromWithdraw) {
            if (planFromQuery && PLAN_CONFIG[planFromQuery]) {
              // Check if this plan is already activated (paid)
              const isAlreadyActivated = planFromQuery === "WELCOME_BONUS"
                ? res.data.welcome_bonus_paid === true
                : res.data.plans?.[planFromQuery]?.is_activated === true;

              if (isAlreadyActivated) {
                // Already paid - redirect to dashboard
                navigate("/dashboard", { replace: true });
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

         // The activation fee is a one-time gate. Anyone who has already paid
         // has no business on this page, so send them into the app regardless
         // of which plan they arrived with. Mirrors hasPaidActivationFee() in
         // src/App.jsx.
         const alreadyPaid =
           res.data.is_activated === true ||
           res.data.account_activated === true ||
           res.data.all_plans_completed === true ||
           res.data.welcome_bonus_paid === true ||
           Object.values(res.data.plans_paid || {}).some((v) => v === true);

         if (alreadyPaid) {
           navigate("/dashboard", { replace: true });
           return;
         }

         if (planFromQuery === "WELCOME_BONUS") {
           if (res.data.welcome_bonus_paid === true) {
             // Single-fee model: the account is active — go straight to surveys.
             navigate("/dashboard", { replace: true });
             return;
           }
         }

if (planFromQuery && ACTIVATION_PLANS.includes(planFromQuery)) {
            // Always show activation page when plan is specified in URL
            // (user came from withdraw button or dashboard activation prompt)
            const planData = res.data.plans?.[planFromQuery];
            setPlanKey(planFromQuery);
            setPlanState(planData || { is_activated: false, completed: false, surveys_completed: 0 });
            setLoading(false);
            return;
          }

if (!planFromQuery) {
            // The activation fee is a plain one-time gate to the dashboard, so
            // there is nothing to decide here: show the payment page. Previously
            // this resolved a "next plan" and redirected to the dashboard or
            // withdraw form, which are both gated - that bounced the user in a
            // loop and left the page stuck on "Loading activation fee".
            //
            // Already-paid users are redirected out (handled above), so anyone
            // still on this page has an outstanding fee.
            setPlanKey("REGULAR");
            setPlanState(res.data.plans?.REGULAR || { is_activated: false, completed: false, surveys_completed: 0 });
            setLoading(false);
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

/* Anything already activated must not render a payment form. The
           alreadyPaid check above handles the common case; this covers an
           activated plan reached with an explicit ?plan= param.

           It used to setPlanKey(null)/setPlanState(null) and return, which
           discarded all state while the component stayed mounted - that is
           what rendered "Loading activation fee" indefinitely. Navigate away
           instead of parking on a null plan. */
          if (!plan || (planFromQuery !== "WELCOME_BONUS" && plan.is_activated)) {
            setLoading(false);
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
        startPaymentPolling(transactionRequestId, cleanedPhone, targetPlanKey);
      } else {
        console.error("❌ STK push NOT confirmed by gateway:", apiMessage, response.data);
        setPaynectaError(apiMessage || "Payment initiation failed. Please try again.");
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
<h2 style={{ textAlign: 'center', marginBottom: '8px', color: '#1a1128' }}>
             🚀 Start Your Plan
           </h2>
           <p style={{ textAlign: 'center', marginBottom: '24px', color: '#7a7599' }}>
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
                    background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
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
                      Earn up to {format(PLAN_CONFIG.WELCOME_BONUS?.total)}
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
                       ? 'rgba(6, 182, 212, 0.1)' 
                       : isCompleted 
                         ? `linear-gradient(135deg, ${config.color}, ${config.color}dd)`
                         : 'rgba(122, 117, 153, 0.1)',
                     color: isActivated || planPaid ? '#06b6d4' : isCompleted ? 'white' : '#7a7599',
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
                        {config?.total > 0
                          ? `Welcome bonus worth ${format(config.total)}`
                          : 'Unlocks all 60 surveys'}
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
          
          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: '#a5a0c0' }}>
            Complete 10 surveys to unlock each plan, then start earning!
          </p>
        </div>
      </div>
    );
  }

  /* Don't render a blank screen while state resolves. Previously this returned
     null, which left users staring at nothing.

     The timeout is the important part: several code paths set planKey/planState
     to null (an already-activated plan, a redirect that is still in flight),
     and without a bail-out the spinner rendered forever. The user saw
     "Loading activation fee" permanently even though the payment had already
     been confirmed and accepted. */
  if (loading || !planKey || !planState || !user) {
    return <ActivationLoadingScreen onTimeout={() => navigate("/hub", { replace: true })} />;
  }

  const plan =
    planKey === "WELCOME_BONUS"
      ? { 
          label: "Welcome Bonus", 
          total: user.welcome_bonus || 1200, 
          activationFee: ACTIVATION_FEE, 
          color: "#06b6d4", 
          glow: "rgba(6, 182, 212, 0.2)" 
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

            <h2 style={{ color: "#06b6d4", textAlign: "center", fontSize: "20px", fontWeight: 800, marginBottom: "12px" }}>
              PAYMENT SUBMITTED
            </h2>

            <p style={{ marginTop: "12px", lineHeight: "1.6", fontWeight: 500, fontSize: "14px", color: "#5c5775" }}>
              Your payment has been submitted for approval.
              <br /><br />
              Our team will verify your transaction and activate your account shortly.
              <br /><br />
              <strong>Next Steps:</strong>
              <br />
              1. Go back to dashboard
              <br />
              2. Start completing surveys to earn
              <br />
              3. Withdraw after completing 60 surveys!
            </p>

            <button
              onClick={() => navigate("/hub", { replace: true })}
              style={{ ...styles.button, marginTop: "20px", background: "#7c3aed" }}
            >
              Go to Hub
            </button>
          </div>
        </div>
      )}

{/* Payment Success Popup - Auto-verification (MegaPay STK) - ENHANCED STYLING */}
      {showPaymentSuccess && paymentSuccessData && (
        <div style={{
          ...styles.overlay,
          background: "linear-gradient(135deg, #0f0a1a 0%, #1a1128 100%)",
          animation: "fadeIn 0.3s ease-out"
        }}>
          <div style={{
            ...styles.overlayCard,
            maxWidth: "450px",
            padding: "32px 24px",
            background: "linear-gradient(145deg, #1a1128, #0f0a1a)",
            border: "2px solid #06b6d4",
            boxShadow: "0 0 40px rgba(6, 182, 212, 0.4), 0 0 80px rgba(6, 182, 212, 0.2)"
          }}>
            <div style={{ 
              fontSize: "64px", 
              marginBottom: "20px",
              animation: "pulse 2s infinite"
            }}>
              ✅
            </div>

            <h2 style={{ 
              color: "#06b6d4", 
              textAlign: "center", 
              fontSize: "26px", 
              fontWeight: 900, 
              marginBottom: "16px",
              textShadow: "0 0 10px rgba(6, 182, 212, 0.5)"
            }}>
              PAYMENT SUBMITTED!
            </h2>

            <div style={{
              background: "rgba(6, 182, 212, 0.15)",
              borderRadius: "16px",
              padding: "16px 20px",
              marginBottom: "20px",
              border: "1px solid rgba(6, 182, 212, 0.3)"
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
                color: "#ff7a7a", 
                marginBottom: "12px",
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}>
                {paymentSuccessData.plan_paid}
              </p>
            </div>

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
                🎉 ACCOUNT ACTIVATED!
              </p>
              <p style={{ 
                fontSize: "14px", 
                color: "#dcfce7",
                fontWeight: 600,
                textAlign: "center",
                margin: "8px 0 0 0"
              }}>
                You can now complete surveys and withdraw your earnings!
              </p>
            </div>

            <p style={{ 
              fontSize: "13px", 
              color: "#a5a0c0", 
              marginBottom: "20px",
              textAlign: "center"
            }}>
               🚀 Taking you to your dashboard... Tap below to continue now
            </p>

            <button
              onClick={() => {
                sessionStorage.setItem("justActivated", "1");
                setShowPaymentSuccess(false);
                navigate("/hub", { replace: true });
              }}
              style={{
                ...styles.button,
                marginTop: "8px",
                background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                boxShadow: "0 8px 25px rgba(124, 58, 237, 0.4)",
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
          <h2 style={{ textAlign: "center", color: plan.color, fontSize: "16px", marginBottom: "2px", fontWeight: 700 }}>
            🔓 Account Activation
          </h2>

          <div className="activate-top-caption" style={{
            marginTop: "2px",
            marginBottom: "10px",
            padding: "12px 10px",
            borderRadius: "10px",
            background: "#1a1128",
            border: "1px solid #251a3a",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "18px", fontWeight: 900, color: "#ffffff", marginBottom: "2px", textShadow: "0 2px 4px rgba(0,0,0,0.3)", lineHeight: 1.25 }}>
              🎉 ACTIVATE YOUR ACCOUNT NOW! 🎉
            </div>

            <div style={{ fontSize: "13px", fontWeight: 700, color: "#e2e8f0", marginBottom: "8px" }}>
              and get
            </div>

            {/* What the user receives once activated */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              alignItems: "center",
              marginBottom: "10px"
            }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                flexWrap: "wrap",
                padding: "8px 14px",
                borderRadius: "40px",
                background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                boxShadow: "0 4px 16px rgba(6, 182, 212, 0.45)"
              }}>
                <span style={{ fontSize: "20px", fontWeight: 900, color: "#ffffff", textShadow: "0 2px 6px rgba(0,0,0,0.25)" }}>
                  {format(1200)}
                </span>
                <span style={{ fontSize: "14px", fontWeight: 900, color: "#ffffff" }}>
                  WELCOME BONUS
                </span>
              </div>

              <div style={{ fontSize: "13px", fontWeight: 800, color: "#22d3ee" }}>
                +
              </div>

              <div style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
                flexWrap: "wrap",
                padding: "8px 14px",
                borderRadius: "40px",
                background: "linear-gradient(135deg, #0DAA65 0%, #1a8d55 100%)",
                boxShadow: "0 4px 16px rgba(13, 170, 101, 0.45)"
              }}>
                <span style={{ fontSize: "14px", fontWeight: 900, color: "#ffffff" }}>
                  FREE DAILY SURVEYS
                </span>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#d1fae5" }}>
                  Plus {format(SURVEY_EARNINGS)} for every survey you complete.
                </span>
              </div>
            </div>

            {/* What they are paying for - stated plainly so there is no
                ambiguity about what the KES 100 actually unlocks. */}
            <div style={{
              fontSize: "13px !important",
              fontWeight: "700 !important",
              color: "#1a1128 !important",
              background: "#fef3c7 !important",
              padding: "10px 14px !important",
              borderRadius: "10px !important",
              border: "2px solid #ff6b6b !important",
              display: "block !important",
              lineHeight: 1.4,
              boxShadow: "0 4px 12px rgba(255, 107, 107, 0.3) !important"
            }}>
              ⚡ Pay{" "}
              <span style={{
                color: "#dc2626 !important",
                fontWeight: "900 !important",
                fontSize: "18px !important",
                background: "#ffe0e0 !important",
                padding: "2px 8px !important",
                borderRadius: "8px !important",
                border: "2px solid #ef4444 !important",
                marginLeft: "2px",
                marginRight: "2px"
              }}>
                {format(plan.activationFee)}
              </span>{" "}
              one-time fee to activate your account and start earning.
              <div style={{
                fontSize: "11px",
                fontWeight: "700",
                color: "#78350f",
                marginTop: "4px"
              }}>
                This is a one-time payment. You pay it only once.
              </div>
            </div>
          </div>

          {showPlanWarning && (
            <div style={{
              marginTop: "12px",
              padding: "10px",
              borderRadius: "8px",
              background: "rgba(255, 107, 107, 0.15)",
              border: "1px solid rgba(255, 107, 107, 0.4)",
              color: "#ff7a7a",
              fontSize: "12px",
              fontWeight: 700
            }}>
              ⚠️ <strong>Note:</strong> You have completed VVIP surveys.
              Make sure you're activating the correct plan. Current: <strong style={{color: "#ffffff"}}>{plan.label}</strong>
            </div>
          )}

          {/* MEGAPAY STK PUSH - AUTOMATIC PAYMENT */}
          {AUTO_PAY_ENABLED && !isUganda && (
          <>
          {/* MEGAPAY STK PUSH - NEW PAYMENT OPTION */}
          <div style={{
            background: "linear-gradient(135deg, #0c4a6e 0%, #5b21b6 50%, #7c3aed 100%)",
            border: "3px solid #a78bfa",
            borderRadius: "14px",
            padding: "14px 12px",
            marginBottom: "20px",
            boxShadow: "0 0 40px rgba(124, 58, 237, 0.6), 0 0 80px rgba(124, 58, 237, 0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
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
            }}>            </div>

            <div style={{ fontSize: "30px", marginBottom: "4px", animation: "bounce 2s infinite" }}>
              ⚡📱
            </div>

            <p style={{ fontWeight: 900, fontSize: "18px", color: "#ffffff", marginBottom: "6px", textShadow: "0 2px 8px rgba(0,0,0,0.5)", letterSpacing: "1px" }}>
              AUTOMATIC ACTIVATION
            </p>

            <p style={{ color: "#e0f2fe", fontSize: "13px", marginBottom: "10px", fontWeight: 600, lineHeight: 1.4 }}>
              📲 Pay directly from your <strong>M-Pesa</strong> — enter your number and tap the button below, then enter your M-Pesa PIN to complete payment instantly
            </p>

            <div style={{
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "10px",
              padding: "8px 10px",
              marginBottom: "8px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(4px)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                <span style={{ color: "#e0f2fe", fontWeight: 600 }}>💰Amount to Pay is:</span>
                <span style={{ color: "#ff7a7a", fontWeight: 900, fontSize: "16px", textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}>
                  {format(plan.activationFee)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", marginTop: "4px" }}>
                <span style={{ color: "#e0f2fe", fontWeight: 600 }}>✅After paying you get:</span>
                <span style={{ color: "#4ade80", fontWeight: 900, fontSize: "15px" }}>
                  {planKey === "WELCOME_BONUS" ? `${format(plan.total)} bonus + surveys` : "Surveys unlocked"}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: "8px", textAlign: "left" }}>
              <label style={{ ...styles.caption, color: "#c4b5fd", fontWeight: "800", fontSize: "12px", marginBottom: "2px", display: "block" }}>
                📱 M-Pesa Number
              </label>
              <input
                type="tel"
                placeholder="2547XXXXXXXX or 07XXXXXXXX"
                value={paynectaPhone}
                onChange={(e) => setPaynectaPhone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "2px solid rgba(167, 139, 250, 0.4)",
                  background: "rgba(15, 10, 26, 0.8)",
                  color: "#ffffff",
                  fontSize: "15px",
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
                marginTop: "4px",
                padding: "12px",
                borderRadius: "12px",
                fontWeight: 900,
                fontSize: "14px",
                cursor: "pointer",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                minHeight: "42px",
                background: paynectaSubmitting
                  ? "#4b5563"
                  : "linear-gradient(135deg, #ff6b6b 0%, #ff6b6b 50%, #ff6b6b 100%)",
                color: "#ffffff",
                boxShadow: paynectaSubmitting
                  ? "none"
                  : "0 8px 25px rgba(255, 107, 107, 0.5), 0 0 40px rgba(255, 107, 107, 0.3)",
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
                  <span>TAP here to Pay {format(plan.activationFee)} and ACTIVATE Account </span>
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
                background: "rgba(255, 107, 107, 0.2)",
                border: "2px solid rgba(255, 107, 107, 0.5)",
                color: "#ff9e9e",
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

            <button
              onClick={() => navigate("/dashboard")}
               style={{
                 ...styles.button,
                 background: "transparent",
                 border: "2px solid #7c3aed",
                 color: "#7c3aed",
                 marginTop: "8px",
                 fontWeight: 700
               }}
             >
                ⬅ Back to Dashboard
             </button>

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