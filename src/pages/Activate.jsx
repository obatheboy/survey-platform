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
  REGULAR: { label: "Regular", total: 1500, activationFee: 100, color: "#ffd000ff", glow: "rgba(91, 247, 0, 0.6)" },
  VIP: { label: "VIP", total: 2000, activationFee: 150, color: "#ffe600ff", glow: "rgba(121, 250, 0, 1)" },
  VVIP: { label: "VVIP", total: 3000, activationFee: 200, color: "#ffee00ff", glow: "rgba(51, 240, 4, 1)" },
};

export default function Activate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [planKey, setPlanKey] = useState(null);
  const [planState, setPlanState] = useState(null);
  const [paymentText, setPaymentText] = useState("");
  const [notification, setNotification] = useState(null);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  /* =========================
     LOAD USER + PLAN
  ========================== */
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await api.get("/auth/me");
        if (!alive) return;
        setUser(res.data);

        // detect if this activation is for welcome bonus
        const isWelcome = searchParams.get("welcome_bonus");
        const planFromQuery = isWelcome ? "WELCOME" : res.data.active_plan;

        let plan;
        if (planFromQuery === "WELCOME") {
          plan = { is_activated: false, completed: true, total: res.data.welcome_bonus || 1200 };
        } else {
          plan = res.data.plans?.[res.data.active_plan];
        }

        // if no plan, or already activated → redirect dashboard
        if (!plan) {
          navigate("/dashboard", { replace: true });
          return;
        }
        if (planFromQuery !== "WELCOME" && plan.is_activated) {
          navigate("/dashboard", { replace: true });
          return;
        }

        setPlanKey(planFromQuery);
        setPlanState(plan);
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => (alive = false);
  }, [navigate, searchParams]);

  if (loading) return <p style={{ textAlign: "center", marginTop: 80 }}>Loading…</p>;
  if (!planKey || !planState) return null;

  const plan = planKey === "WELCOME"
    ? { label: "Welcome Bonus", total: user.welcome_bonus || 1200, activationFee: 100, color: "#00ffcc", glow: "rgba(0, 255, 204, 0.5)" }
    : PLAN_CONFIG[planKey];

  /* =========================
     COPY TILL
  ========================== */
  const copyTill = async () => {
    try {
      await navigator.clipboard.writeText(TILL_NUMBER);
      setCopied(true);
      setNotification("✅ Till number copied successfully. Proceed to M-Pesa payment.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setNotification("⚠️ Failed to copy till number. Please copy manually.");
    }
  };

  /* =========================
     SUBMIT ACTIVATION
  ========================== */
  const submitActivation = async () => {
    if (!paymentText.trim()) {
      setNotification("❌ Please paste the full M-Pesa confirmation message.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/activation/submit", { mpesa_code: paymentText.trim(), plan: planKey });

      setNotification(
        <div style={{ lineHeight: 1.5 }}>
          <div>🎉 <b>{plan.label} activated successfully!</b></div>
          <div style={{ marginTop: 8 }}>
            You can now withdraw your <b>{plan.label}</b> earnings.
          </div>
          <button
            style={goDashboardBtn}
            onClick={() => navigate("/dashboard")}
          >
            ⬅ Go to Dashboard
          </button>
        </div>
      );

      setPaymentText("");
    } catch {
      setNotification(
        "⚠️ Submission failed. Paste the ORIGINAL M-Pesa confirmation message exactly as received."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     UI
  ========================== */
  return (
    <div style={page}>
      <div style={{ ...card, boxShadow: `0 0 40px ${plan.glow}` }}>
        <h2 style={{ textAlign: "center", color: plan.color }}>🔓 Account Activation</h2>
        <p style={{ textAlign: "center", marginTop: 6 }}>
          You are attempting to withdraw <b>{plan.label}</b>
        </p>
        <h3 style={{ textAlign: "center", marginTop: 14 }}>
          💰 Earnings Ready: <span style={{ color: plan.color }}>KES {plan.total}</span>
        </h3>

        <div style={sectionHighlight}>
          <p style={{ fontWeight: 900, color: "#ff3b3b" }}>🔐 ACTIVATION REQUIRED TO WITHDRAW</p>
          <p>✔ One-time activation fee</p>
          <p>✔ Withdraw directly to M-Pesa</p>
          <p>✔ Secure & verified account</p>
        </div>

        <div style={section}>
          <p style={{ fontWeight: 800 }}>📲 How to Pay via Lipa na M-Pesa</p>
          <ol style={{ fontSize: 14, lineHeight: 1.6 }}>
            <li>Open <b>M-Pesa</b></li>
            <li>Select <b>Lipa na M-Pesa</b></li>
            <li>Choose <b>Buy Goods & Services</b></li>
            <li>Enter Till Number: <b>{TILL_NUMBER}</b></li>
            <li>Enter Amount: <span style={activationFee}>KES {plan.activationFee}</span></li>
            <li>Confirm payment with your M-Pesa PIN</li>
          </ol>
        </div>

        <div style={section}>
          <p><b>Till Name:</b> {TILL_NAME}</p>
          <p>
            <b>Till Number:</b> {TILL_NUMBER}
            <button onClick={copyTill} style={copyBtn}>📋 Copy</button>
          </p>
          {copied && <p style={copiedNote}>✅ Copied! Paste this till number in M-Pesa</p>}
          <p><b>Activation Fee:</b> <span style={activationFee}>KES {plan.activationFee}</span></p>
        </div>

        <div style={noteBox}>
          📋 <b>Important:</b> Paste the <b>exact M-Pesa confirmation message</b> below after payment.
        </div>

        <textarea
          placeholder="Paste full M-Pesa confirmation message here"
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
            background: submitting ? "#555" : `linear-gradient(135deg, ${plan.color}, #0a7c4a)`,
            boxShadow: `0 0 22px ${plan.glow}`,
          }}
        >
          {submitting ? "Submitting…" : "Submit Payment"}
        </button>

        {notification && <div style={notificationBox}>{notification}</div>}

        {/* ✅ Fix: Go to dashboard button for welcome bonus works with query param */}
        <button
          onClick={() => navigate("/dashboard")}
          style={{ ...button, marginTop: 10, background: "transparent", border: "2px solid #00ffcc", color: "#00ffcc" }}
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
const page = { minHeight: "100vh", background: "linear-gradient(270deg, #177e0dff, #c20303ff, #20bb12ff)", display: "flex", justifyContent: "center", alignItems: "center", padding: 20 };
const card = { maxWidth: 520, width: "100%", background: "rgba(14, 58, 56, 1)", padding: 24, borderRadius: 22, color: "#fff", border: "1px solid rgba(255,0,0,1)" };
const section = { marginTop: 20, padding: 16, borderRadius: 14, border: "1px solid rgba(255,255,255,0.18)" };
const sectionHighlight = { ...section, background: "rgba(0,255,128,0.08)" };
const noteBox = { marginTop: 16, padding: 14, borderRadius: 12, background: "rgba(0, 29, 190, 0.91)", color: "#fff", fontSize: 13, fontWeight: 600, border: "1px solid rgba(0, 255, 204, 0.4)" };
const notificationBox = { marginTop: 16, padding: 16, borderRadius: 14, background: "rgba(0,255,128,0.15)", color: "#00ffcc", fontWeight: 700, fontSize: 14 };
const activationFee = { color: "#ff2d2d", fontWeight: 900, fontSize: 18 };
const copiedNote = { marginTop: 6, color: "#00ff99", fontWeight: 800, fontSize: 13 };
const input = { width: "100%", padding: 12, marginTop: 16, borderRadius: 10, border: "none", background: "rgba(255,255,255,0.12)", color: "#fff" };
const button = { width: "100%", marginTop: 16, padding: 14, borderRadius: 999, fontWeight: 800, cursor: "pointer" };
const copyBtn = { marginLeft: 10, padding: "4px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700 };
const goDashboardBtn = { marginTop: 12, padding: "12px 18px", borderRadius: 12, border: "none", background: "#00ffd4", color: "#000", fontWeight: 900, fontSize: 15, cursor: "pointer", boxShadow: "0 0 15px #00ffd4" };
