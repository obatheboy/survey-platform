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
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.2)",
  },
  VIP: {
    label: "VIP",
    activationFee: 150,
    color: "#6366f1",
    glow: "rgba(99, 102, 241, 0.2)",
  },
  VVIP: {
    label: "VVIP",
    activationFee: 200,
    color: "#f59e0b",
    glow: "rgba(245, 158, 11, 0.2)",
  },
};

const SEND_MONEY_NUMBER = "0740209662";
const RECEIVER_NAME = "Irene Otoki";

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
        if (plan.surveys_completed < 10 && localStorage.getItem(`survey_completed_${activePlan}`) !== 'true') {
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
        <div style={{ ...card, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <div style={{ padding: "40px 0", color: "#64748b" }}>
            <div style={spinnerStyle}></div>
            <p>Loading activation details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={page}>
        <div style={{ ...card, boxShadow: "0 10px 30px rgba(239, 68, 68, 0.1)" }}>
          <h2 style={{ color: "#ef4444", textAlign: "center" }}>⚠️ Error</h2>
          <p style={{ ...text, textAlign: "center", color: "#ef4444" }}>{error}</p>
          <button
            style={{
              ...activateBtn,
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff",
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
        <div style={{ ...card, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <h2 style={{ color: "#1e293b", textAlign: "center" }}>No Plan Selected</h2>
          <p style={{ ...text, textAlign: "center", color: "#64748b" }}>
            Please select a plan from the dashboard first.
          </p>
          <button
            style={{
              ...activateBtn,
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff",
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
      <div style={{ ...card, boxShadow: `0 20px 40px ${plan.glow}` }}>
        <div style={flagWrap}>
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/4/49/Flag_of_Kenya.svg"
            alt="Kenya Flag"
            style={flag}
          />
        </div>

        <h2
          style={{
            color: "#1e293b",
            fontSize: "28px",
            fontWeight: "800",
            margin: "20px 0 10px",
          }}
        >
          🎉 Congratulations! 🎉
        </h2>

        <p style={{ ...text, color: "#475569" }}>
          You have successfully completed all required surveys under the{" "}
          <b style={{ color: plan.color }}>{plan.label}</b> plan.
          <br />
          <br />
          Your total confirmed earnings are:
          <br />
          <b style={{ color: "#1e293b", fontSize: 28, fontWeight: "900" }}>
            KES {totalEarned.toLocaleString()}
          </b>
          <br />
          <br />
          Activate your account now to unlock withdrawals directly to
          <b style={{ color: "#10b981" }}> M-Pesa</b>.
        </p>

        <div style={urgencyBox}>
          ⏳ Action Required: Activate your account to secure and withdraw your
          earnings now!
        </div>

        <div style={highlightBox}>
          <p style={highlightItem}>
            💼 <b>Account Status:</b>{" "}
            <span style={{ color: "#f59e0b", fontWeight: "700" }}>Pending Activation</span>
          </p>

          <p style={highlightItem}>
            💰 <b>Earnings Available:</b>{" "}
            <span style={{ color: plan.color, fontWeight: "700" }}>
              KES {totalEarned.toLocaleString()}
            </span>
          </p>

          <p style={highlightItem}>
            🔐 <b>One-Time Activation Fee:</b>{" "}
            <span style={{ color: "#ef4444", fontWeight: "700" }}>
              KES {plan.activationFee}
            </span>
          </p>

          <div style={{ marginTop: "16px", padding: "12px", background: "rgba(37, 99, 235, 0.05)", borderRadius: "12px", border: "1px dashed rgba(37, 99, 235, 0.2)" }}>
            <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
              📲 PAY VIA M-PESA:
            </p>
            <p style={{ margin: "4px 0", fontSize: "14px" }}>
              Send <b>KES {plan.activationFee}</b> to <b style={{ color: "#2563eb", fontSize: "16px" }}>{SEND_MONEY_NUMBER}</b>
            </p>
            <p style={{ margin: "0", fontSize: "12px", color: "#64748b" }}>
              Name: {RECEIVER_NAME}
            </p>
          </div>

          <div style={benefitsList}>
            <p style={benefitItem}>✅ Instant withdrawals after activation</p>
            <p style={benefitItem}>🛡️ Your earnings are secured and protected</p>
            <p style={benefitItem}>📲 Withdraw to M-Pesa anytime after activation</p>
          </div>
        </div>

        {/* PRIMARY ACTION */}
        <button
          style={{
            ...activateBtn,
            background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
            boxShadow: "0 10px 20px rgba(37, 99, 235, 0.3)",
            color: "#fff",
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

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

/* =========================
   STYLES
========================= */
const page = {
  minHeight: "100vh",
  background: "#f8fafc",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};

const card = {
  maxWidth: 500,
  width: "100%",
  background: "#ffffff",
  padding: "40px 32px",
  borderRadius: 24,
  textAlign: "center",
  color: "#1e293b",
  border: "1px solid #f1f5f9",
};

const flagWrap = { display: "flex", justifyContent: "center" };

const flag = {
  width: 70,
  height: 70,
  borderRadius: "50%",
  boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
  border: "3px solid #fff",
};

const text = { marginTop: 14, fontSize: 16, lineHeight: 1.6 };

const urgencyBox = {
  marginTop: 20,
  padding: 16,
  borderRadius: 16,
  background: "rgba(239, 68, 68, 0.05)",
  color: "#ef4444",
  fontWeight: "700",
  fontSize: "14px",
  border: "1px solid rgba(239, 68, 68, 0.1)",
};

const highlightBox = {
  marginTop: 24,
  padding: 24,
  borderRadius: 16,
  background: "#f8fafc",
  textAlign: "left",
  border: "1px solid #e2e8f0",
};

const highlightItem = {
  margin: "0 0 12px 0",
  fontSize: "15px",
  display: "flex",
  justifyContent: "space-between",
};

const benefitsList = {
  marginTop: 20,
  paddingTop: 20,
  borderTop: "1px solid #e2e8f0",
};

const benefitItem = {
  margin: "0 0 8px 0",
  fontSize: "14px",
  color: "#64748b",
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const activateBtn = {
  width: "100%",
  marginTop: 30,
  padding: "20px",
  color: "#fff",
  border: "none",
  borderRadius: 16,
  fontWeight: "800",
  cursor: "pointer",
  fontSize: "16px",
  transition: "all 0.3s ease",
};

const linkBtn = {
  marginTop: 20,
  background: "transparent",
  color: "#94a3b8",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
};

const spinnerStyle = {
  width: "40px",
  height: "40px",
  border: "4px solid #f3f3f3",
  borderTop: "4px solid #2563eb",
  borderRadius: "50%",
  margin: "0 auto 20px",
  animation: "spin 1s linear infinite",
};