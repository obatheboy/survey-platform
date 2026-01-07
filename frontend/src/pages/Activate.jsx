import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

/* =========================
   CONSTANTS
========================= */
const TILL_NUMBER = "5628444";
const TILL_NAME = "MOONLIGHT ENTERPRISE";

/* =========================
   PLAN CONFIG
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

  const [user, setUser] = useState(null);
  const [planKey, setPlanKey] = useState(null);
  const [paymentText, setPaymentText] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD USER
  ========================= */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/auth/me");
        const u = res.data;

        let resolvedPlan = localStorage.getItem("selectedPlan");

        if (!resolvedPlan && u.plan && PLAN_CONFIG[u.plan]) {
          resolvedPlan = u.plan;
        }

        if (!resolvedPlan || !PLAN_CONFIG[resolvedPlan]) {
          navigate("/dashboard", { replace: true });
          return;
        }

        setUser(u);
        setPlanKey(resolvedPlan);
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

  /* =========================
     SUBMIT ACTIVATION
  ========================= */
  const submitActivation = async () => {
    if (!paymentText.trim()) {
      setMessage("❌ Enter M-Pesa message or transaction code");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("⏳ Submitting payment for approval…");

      await api.post("/activation/submit", {
        mpesa_code: paymentText,
        plan: planKey,
      });

      localStorage.removeItem("selectedPlan");

      setMessage(
        "⚠️ Enter the correct payment message.\n\nFake submissions can lead to suspension.\nIf wrong, pay again and submit the correct M-Pesa message."
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
      <div
        style={{
          ...card,
          boxShadow: `0 0 40px ${plan.glow}`,
        }}
      >
        <h2 style={{ textAlign: "center", color: plan.color }}>
          🔐 Activate {plan.label} Plan
        </h2>

        <p style={{ textAlign: "center", opacity: 0.85, marginTop: 6 }}>
          One-time activation unlocks withdrawals & earnings
        </p>

        <h3 style={{ textAlign: "center", marginTop: 14 }}>
          💰 Earnings:{" "}
          <span style={{ color: plan.color }}>
            KES {plan.total}
          </span>
        </h3>

        {/* WHY SECTION */}
        <div style={sectionHighlight}>
          <p style={{ fontWeight: 700, marginBottom: 8, color: "red" }}>
            🔒 Why Activation Is Required
          </p>

          <p>✔ Secures your withdrawals</p>
          <p>✔ Prevents fraud & fake accounts</p>
          <p>✔ Faster approval</p>
          <p>✔ One-time fee per plan</p>
        </div>

        {/* PAYMENT INFO */}
        <div style={section}>
          <p>
            <b style={{ color: "#10d8dfff" }}>Till Name:</b>{" "}
            {TILL_NAME}
          </p>

          <p>
            <b style={{ color: "#10d8dfff" }}>Till Number:</b>{" "}
            {TILL_NUMBER}
          </p>

          <p>
            <b style={{ color: "#00b7ffff" }}>Activation Fee:</b>{" "}
            <span style={{ color: plan.color }}>
              KES {plan.activationFee}
            </span>
          </p>
        </div>

        {/* STEP GUIDE */}
        <div style={sectionHighlight}>
          <p style={{ fontWeight: 800, marginBottom: 10, color: "#00ffcc" }}>
            📲 How to Pay Using Lipa na M-Pesa (Till)
          </p>

          <p>1️⃣ Go to <b>M-Pesa</b> on your phone</p>
          <p>2️⃣ Select <b>Lipa na M-Pesa</b></p>
          <p>3️⃣ Choose <b>Buy Goods and Services</b></p>
          <p>4️⃣ Enter Till Number: <b>{TILL_NUMBER}</b></p>
          <p>5️⃣ Enter Amount: <b>KES {plan.activationFee}</b></p>
          <p>6️⃣ Enter your <b>M-Pesa PIN</b> and confirm</p>
          <p>7️⃣ Copy the <b>M-Pesa confirmation message</b></p>
          <p>8️⃣ Paste it below and submit for approval ✅</p>
        </div>

        {/* INPUT */}
        <textarea
          placeholder="Paste M-Pesa confirmation message or transaction code"
          value={paymentText}
          onChange={(e) => setPaymentText(e.target.value)}
          disabled={submitting}
          rows={4}
          style={input}
        />

        {/* SUBMIT BUTTON */}
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

        {/* MESSAGE */}
        {message && <pre style={messageBox}>{message}</pre>}

        {/* GO TO DASHBOARD */}
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
  backdropFilter: "blur(16px)",
  padding: 24,
  borderRadius: 22,
  color: "#ffffffff",
  border: "1px solid rgba(255, 0, 0, 1)",
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
  outline: "none",
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
};

const button = {
  width: "100%",
  marginTop: 16,
  padding: 14,
  color: "#fff",
  border: "none",
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
