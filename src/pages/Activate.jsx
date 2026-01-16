// ========================= Activate.jsx =========================
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";

/* =========================
   CONSTANTS
========================= */
const TILL_NUMBER = "7282886";
const TILL_NAME = "OBADIAH NYAKUNDI OTOKI";

/* =========================
   PLAN CONFIG (DISPLAY ONLY)
========================= */
const PLAN_CONFIG = {
  REGULAR: { label: "Regular", total: 1500, activationFee: 100, color: "#ffd000", glow: "rgba(255, 208, 0, 0.6)" },
  VIP: { label: "VIP", total: 2000, activationFee: 150, color: "#ffe600", glow: "rgba(255, 230, 0, 0.6)" },
  VVIP: { label: "VVIP", total: 3000, activationFee: 200, color: "#ffee00", glow: "rgba(255, 238, 0, 0.6)" },
};

export default function Activate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [planKey, setPlanKey] = useState(null);
  const [plan, setPlan] = useState(null);
  const [paymentText, setPaymentText] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  /* =========================
     LOAD USER + PLAN
  ========================== */
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await api.get("/auth/me");
        if (!alive) return;

        const isWelcome = searchParams.get("welcome_bonus");
        const activePlan = isWelcome ? "WELCOME" : res.data.active_plan;

        if (!activePlan) {
          navigate("/dashboard", { replace: true });
          return;
        }

        if (activePlan === "WELCOME") {
          setPlanKey("WELCOME");
          setPlan({
            label: "Welcome Bonus",
            total: res.data.welcome_bonus || 1200,
            activationFee: 100,
            color: "#00ffcc",
            glow: "rgba(0,255,204,0.5)",
          });
          return;
        }

        const planState = res.data.plans?.[activePlan];
        if (!planState || planState.is_activated) {
          navigate("/dashboard", { replace: true });
          return;
        }

        setPlanKey(activePlan);
        setPlan(PLAN_CONFIG[activePlan]);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => (alive = false);
  }, [navigate, searchParams]);

  if (loading) return <p style={loadingText}>Loading activation…</p>;
  if (!planKey || !plan) return null;

  /* =========================
     COPY TILL
  ========================== */
  const copyTill = async () => {
    try {
      await navigator.clipboard.writeText(TILL_NUMBER);
      setCopied(true);
      setMessage("Till number copied. Proceed to M-Pesa payment.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setMessage("Failed to copy till number. Please copy manually.");
    }
  };

  /* =========================
     SUBMIT ACTIVATION
  ========================== */
  const submitActivation = async () => {
    if (!paymentText.trim()) {
      setMessage("Please paste the full M-Pesa confirmation message.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      await api.post("/activation/submit", {
        mpesa_code: paymentText.trim(),
        plan: planKey,
      });

      setSuccess(true);
    } catch {
      setMessage(
        "Payment received. Your activation is under review and will be approved shortly."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     SUCCESS SCREEN
  ========================== */
  if (success) {
    return (
      <div style={page}>
        <div style={{ ...card, textAlign: "center" }}>
          <h2 style={{ color: plan.color }}>🎉 Activation Submitted</h2>
          <p style={{ marginTop: 12 }}>
            Your <b>{plan.label}</b> activation has been received.
          </p>
          <p style={{ marginTop: 6 }}>
            You’ll be able to withdraw once approved.
          </p>

          <button
            style={{ ...button, background: plan.color, color: "#000" }}
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* =========================
     UI
  ========================== */
  return (
    <div style={page}>
      <div style={{ ...card, boxShadow: `0 0 40px ${plan.glow}` }}>
        <h2 style={{ textAlign: "center", color: plan.color }}>
          🔓 Activate {plan.label}
        </h2>

        <h3 style={{ textAlign: "center", marginTop: 12 }}>
          Earnings Ready: <span style={{ color: plan.color }}>KES {plan.total}</span>
        </h3>

        <div style={sectionHighlight}>
          <p style={{ fontWeight: 800 }}>Activation required to withdraw</p>
          <p>✔ One-time fee</p>
          <p>✔ Instant withdrawals after approval</p>
        </div>

        <div style={section}>
          <p style={{ fontWeight: 700 }}>Pay via Lipa na M-Pesa</p>
          <ol style={{ fontSize: 14, lineHeight: 1.6 }}>
            <li>Open M-Pesa</li>
            <li>Lipa na M-Pesa</li>
            <li>Buy Goods & Services</li>
            <li>Till: <b>{TILL_NUMBER}</b></li>
            <li>
              Amount: <span style={activationFee}>KES {plan.activationFee}</span>
            </li>
          </ol>
        </div>

        <div style={section}>
          <p><b>Till Name:</b> {TILL_NAME}</p>
          <p>
            <b>Till Number:</b> {TILL_NUMBER}
            <button onClick={copyTill} style={copyBtn}>Copy</button>
          </p>
          {copied && <p style={copiedNote}>Copied successfully</p>}
        </div>

        <textarea
          placeholder="Paste full M-Pesa confirmation message"
          value={paymentText}
          onChange={(e) => setPaymentText(e.target.value)}
          disabled={submitting}
          rows={4}
          style={input}
        />

        <button
          onClick={submitActivation}
          disabled={submitting}
          style={{
            ...button,
            background: submitting ? "#555" : plan.color,
            color: "#000",
          }}
        >
          {submitting ? "Submitting…" : "Submit Payment"}
        </button>

        {message && <div style={notificationBox}>{message}</div>}
      </div>
    </div>
  );
}

/* =========================
   STYLES
========================= */
const page = {
  minHeight: "100vh",
  background: "linear-gradient(270deg, #177e0d, #c20303, #20bb12)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
};

const card = {
  maxWidth: 520,
  width: "100%",
  background: "rgba(14,58,56,1)",
  padding: 24,
  borderRadius: 22,
  color: "#fff",
};

const section = {
  marginTop: 20,
  padding: 16,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.18)",
};

const sectionHighlight = {
  ...section,
  background: "rgba(0,255,128,0.08)",
};

const notificationBox = {
  marginTop: 16,
  padding: 14,
  borderRadius: 12,
  background: "rgba(0,255,128,0.15)",
  fontWeight: 700,
  fontSize: 14,
};

const activationFee = {
  color: "#ff2d2d",
  fontWeight: 900,
  fontSize: 18,
};

const copiedNote = {
  marginTop: 6,
  color: "#00ff99",
  fontWeight: 700,
  fontSize: 13,
};

const input = {
  width: "100%",
  padding: 12,
  marginTop: 16,
  borderRadius: 10,
  border: "none",
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
};

const button = {
  width: "100%",
  marginTop: 16,
  padding: 14,
  borderRadius: 999,
  fontWeight: 800,
  cursor: "pointer",
  border: "none",
};

const copyBtn = {
  marginLeft: 10,
  padding: "4px 10px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
};

const loadingText = {
  textAlign: "center",
  marginTop: 80,
};
