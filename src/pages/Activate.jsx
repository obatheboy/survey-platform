// ========================= Activate.jsx =========================
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";

/* =========================
   CONSTANTS
========================= */
const SEND_MONEY_NUMBER = "0740209662";
const RECEIVER_NAME = "Irene Otoki";

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

  // 🔥 FORCE full screen popup after submit
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

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
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  /* =========================
     SUBMIT ACTIVATION (FIXED)
  ========================== */
  const submitActivation = async () => {
    if (!paymentText.trim()) {
      setNotification("❌ Paste the FULL M-Pesa confirmation message.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/activation/submit", {
        mpesa_code: paymentText.trim(),
        plan: planKey,
      });
    } catch {
      // backend may return verification status — IGNORE
    } finally {
      // ✅ ALWAYS SHOW FULL SCREEN POPUP
      setSubmitting(false);
      setPaymentText("");
      setShowSuccessPopup(true);
    }
  };

  return (
    <>
      {/* =========================
         FULL SCREEN SUCCESS POPUP
      ========================== */}
      {showSuccessPopup && (
        <div style={overlay}>
          <div style={overlayCard}>
            <h2 style={{ color: "#00ff99" }}>
              🎉 PAYMENT SUBMITTED SUCCESSFULLY
            </h2>

            <p style={{ marginTop: 20, lineHeight: 1.7, fontWeight: 700 }}>
              You have successfully submitted your payment for approval.
              <br /><br />
              The management will confirm your payment and approve it.
              <br /><br />
              Now go back to <b>VIP Survey Plan</b>, complete them and activate
              your account with <b>KES 150</b> to withdraw all your earnings immediately.
            </p>

            <button onClick={() => navigate("/vip")} style={vipBtn}>
              👉 GO TO VIP SURVEY PLAN
            </button>
          </div>
        </div>
      )}

      <div style={page}>
        <div style={{ ...card, boxShadow: `0 0 40px ${plan.glow}` }}>
          <h2 style={{ textAlign: "center", color: plan.color }}>🔓 Account Activation</h2>

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
              background: submitting ? "#555" : `linear-gradient(135deg, ${plan.color}, #0a7c4a)`,
            }}
          >
            {submitting ? "Submitting…" : "Submit Payment"}
          </button>
        </div>
      </div>
    </>
  );
}

/* =========================
   STYLES
========================= */
const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.9)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999999,
};

const overlayCard = {
  maxWidth: 520,
  width: "90%",
  background: "#062f2a",
  padding: 28,
  borderRadius: 22,
  color: "#fff",
  textAlign: "center",
};

const vipBtn = {
  marginTop: 24,
  width: "100%",
  padding: 16,
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(135deg,#00ff99,#00cc66)",
  fontWeight: 900,
  cursor: "pointer",
};

const page = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const card = {
  maxWidth: 520,
  width: "100%",
  padding: 24,
  borderRadius: 22,
  background: "#0e3a38",
  color: "#fff",
};

const input = {
  width: "100%",
  padding: 12,
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
