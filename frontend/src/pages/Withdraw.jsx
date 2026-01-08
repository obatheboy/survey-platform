import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const TOTAL_SURVEYS = 10;

export default function Withdraw() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [planKey, setPlanKey] = useState(null);
  const [planData, setPlanData] = useState(null);

  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const activePlan = localStorage.getItem("active_plan");
        if (!activePlan) {
          navigate("/dashboard", { replace: true });
          return;
        }

        const res = await api.get("/auth/me");
        const u = res.data;
        const p = u.plans?.[activePlan];

        if (!p) {
          navigate("/dashboard", { replace: true });
          return;
        }

        if (p.surveys_completed < TOTAL_SURVEYS) {
          navigate("/dashboard", { replace: true });
          return;
        }

        if (!p.is_activated) {
          navigate("/congratulations", { replace: true });
          return;
        }

        if (!u.total_earned || u.total_earned <= 0) {
          navigate("/dashboard", { replace: true });
          return;
        }

        setUser(u);
        setPlanKey(activePlan);
        setPlanData(p);
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

  if (!user || !planData) {
    return <p style={{ textAlign: "center", marginTop: 80 }}>Redirecting…</p>;
  }

  const submitWithdraw = async () => {
    if (!phone.trim()) {
      setMessage("❌ Phone number is required");
      return;
    }

    try {
      setMessage("⏳ Submitting withdrawal request…");

      await api.post("/withdraw/request", {
        plan: planKey,
        phone_number: phone,
        amount: user.total_earned,
      });

      setSubmitted(true);
      setMessage("⏳ Your withdrawal is being processed.");
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Withdrawal failed");
    }
  };

  return (
    <div style={page}>
      <div style={card}>
        <h2>💸 Withdraw Earnings</h2>

        <p><b>Plan:</b> {planKey}</p>

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

            <button onClick={submitWithdraw} style={button}>
              Withdraw KES {Number(user.total_earned).toLocaleString()}
            </button>
          </>
        ) : (
          <p>⏳ Withdrawal is being processed.</p>
        )}

        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

/* STYLES */
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
  background: "#0a7c4a",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};
