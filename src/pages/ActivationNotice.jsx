import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/api";

/* =========================
   PLAN CONFIG (DISPLAY ONLY)
========================= */
const PLAN_CONFIG = {
  REGULAR: {
    label: "Regular",
    activationFee: 100,
    color: "#00e676",
    glow: "rgba(0,230,118,0.7)",
  },
  VIP: {
    label: "VIP",
    activationFee: 150,
    color: "#ffd600",
    glow: "rgba(255,214,0,0.8)",
  },
  VVIP: {
    label: "VVIP",
    activationFee: 200,
    color: "#ff5252",
    glow: "rgba(255,82,82,0.8)",
  },
};

export default function ActivationNotice() {
  const navigate = useNavigate();
  const location = useLocation();

  const [planKey, setPlanKey] = useState(null);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =========================
     LOAD STATE (PRIORITIZE PASSED STATE, THEN BACKEND)
  ========================= */
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        // FIRST: Check if plan data was passed via state/navigation
        if (location.state?.plan || location.state?.planType) {
          const { plan, amount, planType } = location.state;
          
          console.log("Received state from navigation:", { plan, amount, planType });
          
          // Use the passed state immediately for instant display
          if (planType) {
            setPlanKey(planType);
          } else if (plan?.type) {
            setPlanKey(plan.type);
          }
          
          if (amount) {
            setTotalEarned(amount);
          } else if (plan?.amount) {
            setTotalEarned(plan.amount);
          }
          
          // Show the UI with passed data first
          if (!alive) return;
          setLoading(false);
          
          // THEN verify with backend in background (BUT DON'T SHOW ERRORS)
          try {
            const res = await api.get("/auth/me");
            if (!alive) return;
            
            const activePlan = res.data.active_plan;
            const backendPlan = res.data.plans?.[activePlan];

            if (!activePlan || !backendPlan) {
              console.warn("No active plan found in backend");
              // Don't show error - just use passed state
              return;
            }

            if (backendPlan.is_activated) {
              console.log("Plan already activated in backend");
              // If already activated, redirect to dashboard
              setTimeout(() => {
                navigate("/dashboard?activated=true");
              }, 1500);
              return;
            }

            // Update with accurate backend data silently
            setPlanKey(activePlan);
            setTotalEarned(res.data.total_earned);
          } catch (apiError) {
            console.error("Backend verification failed:", apiError);
            // Don't show error - just use passed state
          }
          
          return;
        }

        // SECOND: If no state was passed, rely entirely on backend
        const res = await api.get("/auth/me");

        const activePlan = res.data.active_plan;
        const plan = res.data.plans?.[activePlan];

        if (!activePlan || !plan) {
          navigate("/dashboard");
          return;
        }

        // Only check surveys completed if NO state was passed
        if (plan.surveys_completed < 10) { // Using hardcoded 10 instead of TOTAL_SURVEYS
          navigate("/dashboard");
          return;
        }

        if (plan.is_activated) {
          navigate("/dashboard?activated=true");
          return;
        }

        if (!alive) return;

        setPlanKey(activePlan);
        setTotalEarned(res.data.total_earned);
      } catch (err) {
        console.error("ActivationNotice error:", err);
        // Only show error if we have NO state data
        if (!location.state?.plan && !location.state?.planType) {
          setError("Failed to load activation details. Please try again.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => (alive = false);
  }, [navigate, location.state]);

  const handleActivate = () => {
    // Pass along any plan data to the activation page
    navigate("/activate", { 
      state: { 
        planKey,
        amount: totalEarned 
      }
    });
  };

  if (loading) {
    return (
      <div style={page}>
        <div style={{ ...card, boxShadow: "0 0 60px rgba(0,230,118,0.3)" }}>
          <p style={{ textAlign: "center", padding: "40px 0", color: "#fff" }}>
            Loading activation details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={page}>
        <div style={{ ...card, boxShadow: "0 0 60px rgba(255,82,82,0.3)" }}>
          <h2 style={{ color: "#ff5252", textAlign: "center" }}>⚠️ Error</h2>
          <p style={{ ...text, textAlign: "center", color: "#ff5252" }}>{error}</p>
          <button
            style={{
              ...activateBtn,
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              marginTop: "20px",
            }}
            onClick={() => navigate("/dashboard")}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!planKey) {
    return (
      <div style={page}>
        <div style={{ ...card, boxShadow: "0 0 60px rgba(255,82,82,0.3)" }}>
          <h2 style={{ color: "#ff5252", textAlign: "center" }}>No Plan Selected</h2>
          <p style={{ ...text, textAlign: "center" }}>
            Please select a plan from the dashboard first.
          </p>
          <button
            style={{
              ...activateBtn,
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              marginTop: "20px",
            }}
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const plan = PLAN_CONFIG[planKey];
  if (!plan) return null;

  return (
    <div style={page}>
      <div style={{ ...card, boxShadow: `0 0 60px ${plan.glow}` }}>
        <div style={flagWrap}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/4/49/Flag_of_Kenya.svg"
            alt="Kenya Flag"
            style={flag}
          />
        </div>

        <h2
          style={{
            color: plan.color,
            textShadow: `0 0 20px ${plan.glow}`,
          }}
        >
          🎉🎉 Congratulations! 🎉🎉
        </h2>

        <p style={text}>
          You have successfully completed all required surveys under the{" "}
          <b>{plan.label}</b> plan.
          <br />
          <br />
          Your total confirmed earnings are:
          <br />
          <b style={{ color: plan.color, fontSize: 18 }}>
            KES {totalEarned.toLocaleString()}
          </b>
          <br />
          <br />
          Activate your account now to unlock withdrawals directly to
          <b style={{ color: "#00e676" }}> M-Pesa</b>.
        </p>

        <div style={urgencyBox}>
          ⏳ Action Required: Activate your account to secure and withdraw your
          earnings now !!
        </div>

        <div style={highlightBox}>
          <p>
            💼 <b>Account Status:</b>{" "}
            <span style={{ color: "#ffd600" }}>Pending Activation</span>
          </p>

          <p>
            💰 <b>Earnings Available:</b>{" "}
            <span style={{ color: plan.color }}>
              KES {totalEarned.toLocaleString()}
            </span>
          </p>

          <p>
            🔐 <b>One-Time Activation Fee:</b>{" "}
            <span style={{ color: "#ff5252" }}>
              KES {plan.activationFee}
            </span>
          </p>

          <p>✅ Instant withdrawals after activation</p>
          <p>🛡️ Your earnings are secured and protected</p>
          <p>📲 Withdraw to M-Pesa anytime after activation</p>
        </div>

        {/* PRIMARY ACTION */}
        <button
          style={{
            ...activateBtn,
            background: "linear-gradient(135deg, #e60000, #ffeb3b)",
            boxShadow: "0 0 40px rgba(255,235,59,0.9)",
          }}
          onClick={handleActivate}
        >
          🔓 Activate Account & Withdraw Earnings
        </button>

        {/* SECONDARY / DE-EMPHASIZED */}
        <button
          style={linkBtn}
          onClick={() => navigate("/dashboard")}
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}

/* =========================
   STYLES
========================= */
const page = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #000, #0b3d2e, #000)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
};

const card = {
  maxWidth: 520,
  width: "100%",
  background: "rgba(0,0,0,0.92)",
  padding: 28,
  borderRadius: 28,
  textAlign: "center",
  color: "#fff",
  border: "2px solid rgba(0,230,118,0.3)",
};

const flagWrap = { display: "flex", justifyContent: "center" };

const flag = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  boxShadow: "0 0 20px rgba(255,255,255,0.6)",
};

const text = { marginTop: 14, fontSize: 15, lineHeight: 1.6 };

const urgencyBox = {
  marginTop: 16,
  padding: 14,
  borderRadius: 14,
  background: "rgba(255,0,0,0.2)",
  color: "#ff5252",
  fontWeight: 900,
};

const highlightBox = {
  marginTop: 22,
  padding: 18,
  borderRadius: 18,
  background: "rgba(0,230,118,0.1)",
  textAlign: "left",
  border: "1px solid rgba(0,230,118,0.4)",
};

const activateBtn = {
  width: "100%",
  marginTop: 26,
  padding: 18,
  color: "#000",
  border: "none",
  borderRadius: 999,
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 16,
};

const linkBtn = {
  marginTop: 14,
  background: "transparent",
  color: "#bbb",
  border: "none",
  cursor: "pointer",
  textDecoration: "underline",
};