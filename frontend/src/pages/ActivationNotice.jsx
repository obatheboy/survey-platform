import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/api";

/* =========================
   PLAN CONFIG (SOURCE)
========================= */
const PLAN_CONFIG = {
  REGULAR: {
    label: "Regular",
    total: 1500,
    activationFee: 100,
    color: "#00e676",
    glow: "rgba(0,230,118,0.7)",
  },
  VIP: {
    label: "VIP",
    total: 2000,
    activationFee: 150,
    color: "#ffd600",
    glow: "rgba(255,214,0,0.8)",
  },
  VVIP: {
    label: "VVIP",
    total: 3000,
    activationFee: 200,
    color: "#ff5252",
    glow: "rgba(255,82,82,0.8)",
  },
};

export default function ActivationNotice() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [planKey, setPlanKey] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD USER + PLAN
========================= */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/auth/me");
        const u = res.data;

        let selectedPlan = localStorage.getItem("selectedPlan");

        if (!selectedPlan && u.plan && PLAN_CONFIG[u.plan]) {
          selectedPlan = u.plan;
        }

        if (!selectedPlan || !PLAN_CONFIG[selectedPlan]) {
          navigate("/dashboard", { replace: true });
          return;
        }

        setUser(u);
        setPlanKey(selectedPlan);
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

  if (!user || !planKey) return null;

  const plan = PLAN_CONFIG[planKey];

  return (
    <div style={page}>
      <div
        style={{
          ...card,
          boxShadow: `0 0 60px ${plan.glow}`,
        }}
      >
        {/* KENYAN FLAG */}
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
          🎉🎉🎉🎉CONGRATULATION🎉🎉🎉🎉
        </h2>

        <p style={text}>
          You have successfully completed your surveys and earned{" "}
          <b style={{ color: plan.color, fontSize: 18 }}>
            KES {plan.total}
          </b>
          <br />
          <br />
          <span>
            Activate your account now to unlock instant withdrawals via
            <b style={{ color: "#00e676" }}> M-Pesa</b>.
          </span>
        </p>

        <div style={urgencyBox}>
          ⏳ ACTIVATE NOW — earnings may expire if not secured!
        </div>

        <div style={highlightBox}>
          <p>
            💰 <b style={labelTitle}>Total Earnings:</b>{" "}
            <span style={{ color: plan.color }}>
              KES {plan.total}
            </span>
          </p>

          <p>
            🔓 <b style={labelTitle}>Activation Fee (paid once):</b>{" "}
            <span style={{ color: "#ff0000ff" }}>
              KES {plan.activationFee}  
            </span>
          </p>

          <p>✅ Instant withdrawal after activation</p>
          <p>🛡️ 100% secure & verified account</p>
        </div>

        <div style={socialProof}>
          🔔 <b>100%</b> of Members activate and withdraw instantly
        </div>

        <div style={mpesaBadge}>
          🇰🇪 Official Kenya Payments • <b>M-Pesa Secured</b>
        </div>

        <button
          style={{
            ...activateBtn,
            background:
              "linear-gradient(135deg, #e60000ff, #eeff00ff)",
            boxShadow: "0 0 40px rgba(207, 230, 0, 0.9)",
            animation: "pulse 1.4s infinite",
          }}
          onClick={() => navigate("/activate")}
        >
          🔓 ACTIVATE & WITHDRAW NOW
        </button>

        <button
          style={backBtn}
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </div>

      {/* ANIMATIONS + RESPONSIVE */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }

        /* 📱 Phones */
        @media (max-width: 480px) {
          .responsive-card {
            padding: 20px !important;
          }
        }

        /* 💻 Tablets & PCs */
        @media (min-width: 768px) {
          .responsive-card {
            max-width: 720px !important;
          }
        }

        /* 🖥️ Large screens */
        @media (min-width: 1200px) {
          .responsive-card {
            max-width: 860px !important;
          }
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
  background:
    "linear-gradient(135deg, #000000, #0b3d2e, #000000)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
};

const card = {
  maxWidth: 520,
  width: "100%",
  background: "rgba(0, 0, 0, 0.92)",
  padding: 28,
  borderRadius: 28,
  textAlign: "center",
  color: "#ffffff",
  border: "2px solid rgba(0,230,118,0.3)",
};

const flagWrap = {
  display: "flex",
  justifyContent: "center",
  marginBottom: 10,
};

const flag = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  boxShadow: "0 0 20px rgba(255,255,255,0.6)",
};

const text = {
  marginTop: 14,
  fontSize: 15,
  lineHeight: 1.6,
};

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

const socialProof = {
  marginTop: 16,
  fontSize: 13,
  color: "#ffd600",
};

const mpesaBadge = {
  marginTop: 10,
  fontSize: 13,
  color: "#00e676",
};

const labelTitle = {
  color: "#ffffff",
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
