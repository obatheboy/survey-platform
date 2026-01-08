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

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD USER (DB = LAW)
  ========================= */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/auth/me");
        const u = res.data;

        /* 🚫 NO PLAN OR NOT COMPLETED → DASHBOARD */
        if (!u.plan || u.surveys_completed < TOTAL_SURVEYS) {
          navigate("/dashboard", { replace: true });
          return;
        }

        /* ✅ ALREADY ACTIVATED → DASHBOARD */
        if (u.is_activated) {
          navigate("/dashboard", { replace: true });
          return;
        }

        setUser(u);
      } catch {
        navigate("/auth", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: 80 }}>Loading…</p>;
  }

  if (!user) return null;

  const plan = PLAN_CONFIG[user.plan];

  /* =========================
     FIXED: ACTIVATE HANDLER
  ========================= */
  const handleActivate = () => {
    navigate("/activate");
  };

  return (
    <div style={page}>
      <div
        style={{
          ...card,
          boxShadow: `0 0 60px ${plan.glow}`,
        }}
      >
        {/* FLAG */}
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
          🎉 CONGRATULATIONS 🎉
        </h2>

        <p style={text}>
          You have successfully completed the{" "}
          <b>{plan.label}</b> survey plan and earned{" "}
          <b style={{ color: plan.color }}>
            KES {user.total_earned}
          </b>.
          <br />
          <br />
          Activate your account now to unlock withdrawals via
          <b style={{ color: "#00e676" }}> M-Pesa</b>.
        </p>

        <div style={urgencyBox}>
          ⏳ ACTIVATE NOW — secure your earnings
        </div>

        <div style={highlightBox}>
          <p>
            💰 <b>Total Earnings:</b>{" "}
            <span style={{ color: plan.color }}>
              KES {user.total_earned}
            </span>
          </p>

          <p>
            🔓 <b>Activation Fee (once):</b>{" "}
            <span style={{ color: "#ff5252" }}>
              KES {plan.activationFee}
            </span>
          </p>

          <p>✅ Instant withdrawals after activation</p>
          <p>🛡️ Verified & secure account</p>
        </div>

        <div style={socialProof}>
          🔔 <b>98%</b> of users activate and withdraw instantly
        </div>

        <div style={mpesaBadge}>
          🇰🇪 Official Kenya Payments • <b>M-Pesa Secured</b>
        </div>

        <button
          style={{
            ...activateBtn,
            background:
              "linear-gradient(135deg, #e60000, #ffeb3b)",
            boxShadow: "0 0 40px rgba(255,235,59,0.9)",
            animation: "pulse 1.4s infinite",
          }}
          onClick={handleActivate}
        >
          🔓 ACTIVATE & WITHDRAW
        </button>

        <button
          style={backBtn}
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
      `}</style>
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

const socialProof = { marginTop: 16, fontSize: 13, color: "#ffd600" };
const mpesaBadge = { marginTop: 10, fontSize: 13, color: "#00e676" };

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
 