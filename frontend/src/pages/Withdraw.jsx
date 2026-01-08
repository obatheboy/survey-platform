import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function Withdraw() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  /* =========================
     🔐 ACCESS GUARD
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

        // ❌ surveys not completed
        if (!plan.completed) {
          navigate("/dashboard", { replace: true });
          return;
        }

        // ❌ not activated
        if (!plan.is_activated) {
          navigate("/activation-notice", {
            state: { reason: "withdraw" },
            replace: true,
          });
          return;
        }

        // ❌ no earnings
        if (!res.data.total_earned || res.data.total_earned <= 0) {
          navigate("/dashboard", { replace: true });
          return;
        }

        if (!alive) return;
        setUser(res.data);
      } catch (err) {
        console.warn("Withdraw: transient auth/me failure");
        // ❌ DO NOT redirect — interceptor handles auth
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => (alive = false);
  }, [navigate]);

  if (loading) {
    return (
      <p style={{ textAlign: "center", marginTop: 80 }}>
        Loading…
      </p>
    );
  }

  if (!user) return null;

  /* =========================
     WITHDRAW ACTION
  ========================= */
  const submitWithdraw = async () => {
    if (!phone.trim()) {
      setMessage("❌ Phone number is required");
      return;
    }

    try {
      setMessage("⏳ Submitting withdrawal request…");

      await api.post("/withdraw/request", {
        phone_number: phone.trim(),
        amount: user.total_earned,
      });

      setSubmitted(true);
      setMessage("⏳ Your withdrawal is being processed.");
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "❌ Withdrawal request failed"
      );
    }
  };

  const shareLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    alert("✅ Link copied. Share with friends!");
  };

  /* =========================
     UI
  ========================= */
  return (
    <div style={page}>
      <div style={card}>
        <h2>💸 Withdraw Earnings</h2>

        <p>
          <b>Available Balance:</b>{" "}
          <span style={{ color: "green" }}>
            KES {Number(user.total_earned).toLocaleString()}
          </span>
        </p>

        {!submitted ? (
          <>
            <input
              placeholder="Phone number (07...)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={input}
            />

            <button
              onClick={submitWithdraw}
              style={{
                ...button,
                background: "#0a7c4a",
              }}
            >
              Withdraw KES{" "}
              {Number(user.total_earned).toLocaleString()}
            </button>
          </>
        ) : (
          <div style={processingBox}>
            <p>⏳ Your withdrawal is being processed.</p>
            <p>
              For faster processing, share this platform
              link with friends.
            </p>

            <button onClick={shareLink} style={shareBtn}>
              👉 Share Link
            </button>
          </div>
        )}

        {message && (
          <p style={{ marginTop: 12 }}>{message}</p>
        )}
      </div>
    </div>
  );
}

/* =========================
   STYLES
========================= */
const page = {
  minHeight: "100vh",
  background: "#f3f6f2",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const card = {
  width: 420,
  background: "#fff",
  padding: 24,
  borderRadius: 16,
};

const input = {
  width: "100%",
  padding: 10,
  marginTop: 12,
  borderRadius: 8,
  border: "1px solid #ccc",
};

const button = {
  width: "100%",
  marginTop: 16,
  padding: 12,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const processingBox = {
  marginTop: 20,
  padding: 16,
  background: "#fff7e6",
  borderRadius: 12,
};

const shareBtn = {
  marginTop: 10,
  padding: 10,
  width: "100%",
  borderRadius: 8,
  border: "none",
  background: "#007bff",
  color: "#fff",
  cursor: "pointer",
};
