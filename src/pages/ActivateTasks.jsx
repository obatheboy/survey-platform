import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useCurrency } from "../contexts/CurrencyContext.jsx";
import { taskActivationApi } from "../api/api";
import { TASK_ACTIVATION_FEE } from "../constants/fees";

const LOADING_BAILOUT_MS = 6000;

function ActivationLoadingScreen({ onTimeout }) {
  useEffect(() => {
    const timer = setTimeout(onTimeout, LOADING_BAILOUT_MS);
    return () => clearTimeout(timer);
  }, [onTimeout]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      background: "#0f0a1a",
      color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        border: "3px solid rgba(255,255,255,0.15)",
        borderTopColor: "#06b6d4",
        animation: "lb-spin 0.8s linear infinite",
      }} />
      <p style={{ fontSize: "14px", fontWeight: 600, margin: 0, color: "rgba(255,255,255,0.8)" }}>
        Loading task activation...
      </p>
      <button
        onClick={onTimeout}
        style={{
          marginTop: "8px",
          padding: "10px 20px",
          borderRadius: "999px",
          border: "1px solid rgba(255,255,255,0.25)",
          background: "transparent",
          color: "rgba(255,255,255,0.85)",
          fontSize: "13px",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Continue to tasks
      </button>
      <style>{"@keyframes lb-spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#1a1128",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px",
    paddingTop: "24px",
    paddingBottom: "40px",
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    maxWidth: "100%",
    width: "100%",
    background: "#0f0a1a",
    padding: "20px 16px",
    borderRadius: "16px",
    color: "#ffffff",
    border: "1px solid #251a3a",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
  },
  button: {
    width: "100%",
    marginTop: "12px",
    padding: "14px",
    borderRadius: "12px",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    minHeight: "48px",
    background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
    color: "#ffffff",
    boxShadow: "0 6px 12px -3px rgba(124, 58, 237, 0.3)",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 10, 26, 0.95)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999,
    padding: "16px",
    backdropFilter: "blur(4px)",
  },
  overlayCard: {
    maxWidth: "100%",
    width: "100%",
    background: "var(--bg-surface)",
    padding: "24px 20px",
    borderRadius: "16px",
    color: "var(--text-main)",
    textAlign: "center",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
    border: "1px solid var(--border-soft)",
    margin: "0 16px",
  },
};

export default function ActivateTasks() {
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await api.get("/auth/me");
        if (!isMounted) return;
        setUser(res.data);

        if (res.data.task_activated === true || res.data.task_activation_fee_paid === true) {
          navigate("/hub", { replace: true });
          return;
        }
      } catch (err) {
        console.error("Failed to load user:", err);
        if (isMounted) navigate("/login");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, [navigate]);

  const startPolling = (transactionRequestId, phoneNumber) => {
    let attempts = 0;
    const maxAttempts = 40;
    const POLL_INTERVAL_MS = 3000;
    const INITIAL_DELAY_MS = 8000;

    const stop = (errorMsg) => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      setWaiting(false);
      if (errorMsg) setError(errorMsg);
    };

    const schedulePoll = () => {
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const confirmRes = await taskActivationApi.confirm({
            transaction_request_id: transactionRequestId,
            phone: phoneNumber
          });
          console.log(`Task activation poll ${attempts}`, confirmRes.data);

          if (confirmRes.data.success && confirmRes.data.task_activated) {
            stop();
            setSuccess(true);
            setTimeout(() => {
              navigate("/hub", { replace: true });
            }, 2000);
            return;
          }

          if (!confirmRes.data.success && attempts >= maxAttempts) {
            stop("Payment verification timeout. Please check your M-Pesa and try again.");
          }
        } catch (err) {
          console.error(`Task activation poll ${attempts} error:`, err);
          if (attempts >= maxAttempts) {
            stop("Payment verification timeout. Please try again.");
          }
        }
      }, POLL_INTERVAL_MS);
    };

    setTimeout(schedulePoll, INITIAL_DELAY_MS);
  };

  const handlePayment = async () => {
    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    const cleanedPhone = phone.replace(/\s+/g, "");
    const phoneRegex = /^(0[17][0-9]{8}|254[17][0-9]{8}|[17][0-9]{9})$/;
    if (!phoneRegex.test(cleanedPhone)) {
      setError("Invalid phone number. Use format: 07XXXXXXXX or 2547XXXXXXXX");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await taskActivationApi.initiate(cleanedPhone);
      const apiMessage = response.data.message || "";
      const transactionRequestId = response.data.transaction_request_id || response.data.reference;

      if (response.data.success === true && transactionRequestId) {
        setWaiting(true);
        startPolling(transactionRequestId, cleanedPhone);
      } else {
        setError(apiMessage || "Payment initiation failed. Please try again.");
        setWaiting(false);
      }
    } catch (err) {
      console.error("Task activation error:", err);
      setError(err?.response?.data?.message || err?.message || "Network error. Please try again.");
      setWaiting(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <ActivationLoadingScreen onTimeout={() => navigate("/hub", { replace: true })} />;
  }

  if (success) {
    return (
      <div style={styles.overlay}>
        <div style={styles.overlayCard}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>✅</div>
          <h2 style={{ color: "#06b6d4", textAlign: "center", fontSize: "20px", fontWeight: 800, marginBottom: "12px" }}>
            TASK ACCESS ACTIVATED!
          </h2>
          <p style={{ marginTop: "12px", lineHeight: "1.6", fontWeight: 500, fontSize: "14px", color: "#5c5775" }}>
            You can now access paid work tasks and start earning.
          </p>
          <button
            onClick={() => navigate("/hub", { replace: true })}
            style={{ ...styles.button, marginTop: "20px", background: "#7c3aed" }}
          >
            Continue to Tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={{ textAlign: "center", color: "#7c3aed", fontSize: "18px", marginBottom: "4px", fontWeight: 800 }}>
          💼 Activate Work Tasks
        </h2>

        <div style={{
          marginTop: "12px",
          padding: "16px 14px",
          borderRadius: "12px",
          background: "#1a1128",
          border: "1px solid #251a3a",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "16px", fontWeight: 900, color: "#ffffff", marginBottom: "4px" }}>
            Unlock Paid Work Tasks
          </div>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0", marginBottom: "12px" }}>
            One-time payment to access AI training, articles, academic writing, and transcription tasks.
          </div>

          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "10px 18px",
            borderRadius: "40px",
            background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
            boxShadow: "0 4px 16px rgba(124, 58, 237, 0.45)"
          }}>
            <span style={{ fontSize: "18px", fontWeight: 900, color: "#ffffff" }}>
              {format(TASK_ACTIVATION_FEE)}
            </span>
            <span style={{ fontSize: "13px", fontWeight: 900, color: "#ffffff" }}>
              TASK ACTIVATION
            </span>
          </div>

          <div style={{
            marginTop: "12px",
            fontSize: "12px",
            fontWeight: 700,
            color: "#78350f",
            background: "#fef3c7",
            padding: "10px 14px",
            borderRadius: "10px",
            lineHeight: 1.4,
            textAlign: "left"
          }}>
            ⚡ Pay <strong>{format(TASK_ACTIVATION_FEE)}</strong> one-time fee to unlock work tasks.
            <div style={{ marginTop: "4px", fontSize: "11px" }}>
              This unlocks only work tasks. Surveys have a separate activation.
            </div>
          </div>
        </div>

        <div style={{ marginTop: "16px", textAlign: "left" }}>
          <label style={{ fontSize: "12px", fontWeight: 700, color: "#c4b5fd", marginBottom: "4px", display: "block" }}>
            📱 M-Pesa Number
          </label>
          <input
            type="tel"
            placeholder="2547XXXXXXXX or 07XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "2px solid rgba(167, 139, 250, 0.4)",
              background: "rgba(15, 10, 26, 0.8)",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: "700",
              boxSizing: "border-box",
              outline: "none",
              letterSpacing: "1px"
            }}
            disabled={submitting || waiting}
          />
        </div>

        <button
          onClick={handlePayment}
          disabled={submitting || waiting || !phone.trim()}
          style={{
            width: "100%",
            marginTop: "12px",
            padding: "14px",
            borderRadius: "12px",
            fontWeight: 900,
            fontSize: "14px",
            cursor: "pointer",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            minHeight: "48px",
            background: submitting || waiting ? "#4b5563" : "linear-gradient(135deg, #7c3aed, #5b21b6)",
            color: "#ffffff",
            boxShadow: submitting || waiting ? "none" : "0 8px 25px rgba(124, 58, 237, 0.5)",
          }}
        >
          {submitting ? (
            <>
              <span style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                border: "3px solid rgba(255,255,255,0.3)",
                borderTopColor: "white",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }} />
              <span>Sending…</span>
            </>
          ) : waiting ? (
            <>
              <span style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                border: "3px solid rgba(255,255,255,0.3)",
                borderTopColor: "white",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }} />
              <span>Waiting for payment…</span>
            </>
          ) : (
            <>
              <span>📱</span>
              <span>Pay {format(TASK_ACTIVATION_FEE)} and Unlock Tasks</span>
              <span>⚡</span>
            </>
          )}
        </button>

        {error && (
          <div style={{
            marginTop: "10px",
            padding: "10px",
            borderRadius: "8px",
            background: "rgba(255, 107, 107, 0.2)",
            border: "2px solid rgba(255, 107, 107, 0.5)",
            color: "#ff9e9e",
            fontWeight: 700,
            fontSize: "12px"
          }}>
            ❌ {error}
          </div>
        )}

        {waiting && (
          <div style={{
            marginTop: "10px",
            padding: "16px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, rgba(22, 163, 74, 0.2), rgba(22, 163, 74, 0.3))",
            border: "2px solid rgba(34, 197, 94, 0.5)",
            color: "#bbf7d0",
            fontWeight: 700,
            fontSize: "14px",
            textAlign: "center"
          }}>
            <p style={{ margin: "0 0 8px 0", fontWeight: 800, color: "#ffffff" }}>
              📲 STK Push Sent! Check your phone.
            </p>
            <p style={{ margin: 0, fontSize: "12px", color: "#cbd5e1" }}>
              Enter your M-Pesa PIN to complete payment. Verifying automatically...
            </p>
          </div>
        )}

        <button
          onClick={() => navigate("/hub")}
          style={{
            ...styles.button,
            background: "transparent",
            border: "2px solid #7c3aed",
            color: "#7c3aed",
            marginTop: "8px",
            fontWeight: 700
          }}
        >
          ⬅ Back to Hub
        </button>
      </div>
    </div>
  );
}
