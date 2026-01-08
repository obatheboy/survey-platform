import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

/* =========================
   CONSTANTS
========================= */
const TILL_NUMBER = "5628444";
const TILL_NAME = "MOONLIGHT ENTERPRISE";

/* =========================
   PLAN CONFIG (DISPLAY ONLY)
========================= */
const PLAN_CONFIG = {
  REGULAR: {
    label: "Regular",
    total: 1500,
    activationFee: 100,
    color: "#ffd000ff",
    glow: "rgba(91, 247, 0, 0.6)",
  },
  VIP: {
    label: "VIP",
    total: 2000,
    activationFee: 150,
    color: "#ffe600ff",
    glow: "rgba(121, 250, 0, 1)",
  },
  VVIP: {
    label: "VVIP",
    total: 3000,
    activationFee: 200,
    color: "#ffee00ff",
    glow: "rgba(51, 240, 4, 1)",
  },
};

export default function Activate() {
  const navigate = useNavigate();

  const [planKey, setPlanKey] = useState(null);
  const [planState, setPlanState] = useState(null);
  const [paymentText, setPaymentText] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD + VALIDATE ACCESS
     (BACKEND = LAW)
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

        if (!plan.completed) {
          navigate("/dashboard", { replace: true });
          return;
        }

        if (plan.is_activated) {
          navigate("/dashboard", { replace: true });
          return;
        }

        if (!alive) return;
        setPlanKey(activePlan);
        setPlanState(plan);
      } catch (err) {
        console.warn("Activate: auth/me transient failure");
        // ❌ do NOT redirect — interceptor handles auth
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

  /* =========================
     SUBMIT ACTIVATION
  ========================= */
  const submitActivation = async () => {
    if (!paymentText.trim()) {
      setMessage("❌ Enter M-Pesa confirmation message or transaction code");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("⏳ Submitting payment for approval…");

      await api.post("/activation/submit", {
        mpesa_code: paymentText.trim(),
        plan: planKey,
      });

      setMessage(
        "✅ Payment submitted.\n\nYour activation is pending admin approval."
      );
    } catch (err) {
      setMessage(
        err.response?.data?.message || "❌ Activation submission failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <div style={page}>
      <div style={{ ...card, boxShadow: `0 0 40px ${plan.glow}` }}>
        <h2 style={{ textAlign: "center", color: plan.color }}>
          🔓 Account Activation
        </h2>

        <p style={{ textAlign: "center", marginTop: 6 }}>
          You completed the <b>{plan.label}</b> survey plan
        </p>

        <h3 style={{ textAlign: "center", marginTop: 14 }}>
          💰 Earnings:{" "}
          <span style={{ color: plan.color }}>
            KES {plan.total}
          </span>
        </h3>

        <div style={sectionHighlight}>
          <p style={{ fontWeight: 700, color: "red" }}>
            🔐 Activation Required to Withdraw
          </p>
          <p>✔ One-time fee</p>
          <p>✔ Instant withdrawals after approval</p>
          <p>✔ Secured account</p>
        </div>

        <div style={section}>
          <p><b>Till Name:</b> {TILL_NAME}</p>
          <p><b>Till Number:</b> {TILL_NUMBER}</p>
          <p>
            <b>Activation Fee:</b>{" "}
            <span style={{ color: plan.color }}>
              KES {plan.activationFee}
            </span>
          </p>
        </div>

        <textarea
          placeholder="Paste M-Pesa confirmation message or transaction code"
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
            background: submitting
              ? "#555"
              : `linear-gradient(135deg, ${plan.color}, #0a7c4a)`,
            boxShadow: `0 0 22px ${plan.glow}`,
          }}
        >
          {submitting ? "Submitting…" : "Submit for Approval"}
        </button>

        {message && <pre style={messageBox}>{message}</pre>}

        <button
          onClick={() => navigate("/dashboard")}
          style={{
            ...button,
            marginTop: 10,
            background: "transparent",
            border: "2px solid #00ffcc",
            color: "#00ffcc",
          }}
        >
          ⬅ Go to Dashboard
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
  background: "linear-gradient(270deg, #177e0dff, #c20303ff, #20bb12ff)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
};

const card = {
  maxWidth: 520,
  width: "100%",
  background: "rgba(14, 58, 56, 1)",
  padding: 24,
  borderRadius: 22,
  color: "#fff",
  border: "1px solid rgba(255,0,0,1)",
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
};

const messageBox = {
  marginTop: 16,
  whiteSpace: "pre-wrap",
  fontSize: 13,
  color: "#ff8a80",
};
