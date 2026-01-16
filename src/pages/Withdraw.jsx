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

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/auth/me");
        const u = res.data;

        if (u.surveys_completed < TOTAL_SURVEYS) {
          navigate("/dashboard", { replace: true });
          return;
        }

        if (!u.is_activated) {
          navigate("/activation-notice", { replace: true });
          return;
        }

        if (!u.total_earned || u.total_earned <= 0) {
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
    return <p style={loadingText}>Loading withdrawal…</p>;
  }

  if (!user) return null;

  const submitWithdraw = async () => {
    if (!phone.trim()) {
      setMessage("❌ Phone number is required");
      return;
    }

    try {
      setMessage("Submitting withdrawal request…");

      await api.post("/withdraw/request", {
        phone_number: phone,
        amount: user.total_earned,
      });

      setSubmitted(true);
      setMessage("Your withdrawal is being processed.");
    } catch (err) {
      setMessage(
        err.response?.data?.message || "❌ Withdrawal request failed"
      );
    }
  };

  const shareLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    alert("Link copied");
  };

  return (
    <div style={page}>
      <div style={card}>
        <h2 style={title}>💸 Withdraw Earnings</h2>

        <div style={balanceBox}>
          <span style={balanceLabel}>Available Balance</span>
          <span style={balanceAmount}>
            KES {Number(user.total_earned).toLocaleString()}
          </span>
        </div>

        {!submitted ? (
          <>
            <label style={label}>Phone Number</label>
            <input
              placeholder="07XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={input}
            />

            <button
              onClick={submitWithdraw}
              style={withdrawBtn}
            >
              Withdraw KES {Number(user.total_earned).toLocaleString()}
            </button>
          </>
        ) : (
          <div style={processingBox}>
            <h4 style={{ marginBottom: 6 }}>⏳ Processing</h4>
            <p style={processingText}>
              Your withdrawal request has been received.
            </p>

            <button onClick={shareLink} style={shareBtn}>
              Share Platform Link
            </button>
          </div>
        )}

        {message && <div style={messageBox}>{message}</div>}
      </div>
    </div>
  );
}

/* =========================
   STYLES (DISPLAY ONLY)
========================= */

const page = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #eef2f3, #e6f7ef)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 16,
};

const card = {
  width: "100%",
  maxWidth: 420,
  background: "#ffffff",
  padding: 26,
  borderRadius: 18,
  boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
};

const title = {
  textAlign: "center",
  marginBottom: 20,
};

const balanceBox = {
  background: "#f1f8f4",
  borderRadius: 12,
  padding: 16,
  textAlign: "center",
  marginBottom: 20,
};

const balanceLabel = {
  display: "block",
  fontSize: 13,
  color: "#666",
};

const balanceAmount = {
  fontSize: 24,
  fontWeight: 800,
  color: "#0a7c4a",
};

const label = {
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 6,
  display: "block",
};

const input = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "1px solid #ccc",
  marginBottom: 14,
  fontSize: 15,
};

const withdrawBtn = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "none",
  background: "#0a7c4a",
  color: "#fff",
  fontWeight: 800,
  fontSize: 16,
  cursor: "pointer",
};

const processingBox = {
  marginTop: 10,
  padding: 16,
  background: "#fff7e6",
  borderRadius: 14,
  textAlign: "center",
};

const processingText = {
  fontSize: 14,
  color: "#555",
};

const shareBtn = {
  marginTop: 12,
  padding: 10,
  width: "100%",
  borderRadius: 10,
  border: "none",
  background: "#007bff",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const messageBox = {
  marginTop: 14,
  padding: 12,
  borderRadius: 10,
  background: "#f4f4f4",
  fontSize: 14,
  textAlign: "center",
};

const loadingText = {
  textAlign: "center",
  marginTop: 80,
  fontSize: 16,
};
