import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const TOTAL_SURVEYS = 10;

export default function Withdraw() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  /* =========================
     🔐 ACCESS GUARD (SOURCE = BACKEND)
  ========================= */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/auth/me");
        const u = res.data;

        // ❌ NOT COMPLETED
        if (u.surveys_completed < TOTAL_SURVEYS) {
          alert("❌ Complete all surveys before withdrawing.");
          navigate("/dashboard", { replace: true });
          return;
        }

        // ❌ NOT ACTIVATED
        if (!u.is_activated) {
          navigate("/congratulations", { replace: true });
          return;
        }

        // ❌ NO MONEY
        if (!u.total_earned || u.total_earned <= 0) {
          alert("❌ No available balance to withdraw.");
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
        phone_number: phone,
        amount: user.total_earned,
      });

      setSubmitted(true);
      setMessage("⏳ Your withdrawal is being processed.");
    } catch (err) {
      setMessage(
        err.response?.data?.message || "❌ Withdrawal request failed"
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
              style={{ ...button, background: "#0a7c4a" }}
            >
              Withdraw KES{" "}
              {Number(user.total_earned).toLocaleString()}
            </button>
          </>
        ) : (
          <div style={processingBox}>
            <p>⏳ Your withdrawal is being processed.</p>
            <p>For faster processing, share this platform link.</p>

            <button onClick={shareLink} style={shareBtn}>
              👉 Share Link
            </button>
          </div>
        )}

        {message && <p style={{ marginTop: 12 }}>{message}</p>}
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
