import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { planPaymentApi } from "../api/api";
import { ACTIVATION_FEE } from "../constants/fees";

export default function Activate() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const res = await api.get("/auth/me");
        if (!isMounted) return;
        setUser(res.data);

        if (res.data.welcome_bonus_paid === true) {
          navigate("/hub", { replace: true });
        }
      } catch (err) {
        console.error("Failed to load user:", err);
        if (isMounted) navigate("/login");
      }
    };

    load();
    return () => {
      isMounted = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [navigate]);

  useEffect(() => {
    if (user?.phone && !phone) {
      setPhone(user.phone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const startPolling = (transactionRequestId) => {
    let attempts = 0;
    const maxAttempts = 30;
    const POLL_INTERVAL_MS = 3000;

    const stop = () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };

    const doPoll = async () => {
      attempts++;
      try {
        const res = await planPaymentApi.confirm({
          transaction_request_id: transactionRequestId,
          phone: phone,
          plan: "WELCOME_BONUS"
        });

        const confirmed =
          res.data.plan_paid ||
          res.data.paid === true ||
          res.data.already_paid === true;

        if (res.data.success && confirmed) {
          stop();
          sessionStorage.setItem("justActivated", "1");
          setShowSuccess(true);
          setWaiting(false);
          return;
        }

        if (attempts >= maxAttempts) {
          stop();
          setError("Payment verification timeout. Please check your M-Pesa and try again.");
          setWaiting(false);
        }
      } catch (err) {
        console.error(`Poll attempt ${attempts} error:`, err);
        if (attempts >= maxAttempts) {
          stop();
          setError("Payment verification timeout. Please try again.");
          setWaiting(false);
        }
      }
    };

    pollRef.current = setInterval(doPoll, POLL_INTERVAL_MS);
  };

  const handlePay = async () => {
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
    setWaiting(false);

    try {
      const response = await planPaymentApi.initiate("WELCOME_BONUS", cleanedPhone);
      const transactionRequestId = response.data.transaction_request_id || response.data.reference;

      if (response.data.success === true && transactionRequestId) {
        setWaiting(true);
        startPolling(transactionRequestId);
      } else {
        setError(response.data.message || "Payment initiation failed. Please try again.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1a1128",
        color: "#fff",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>
        <div style={{
          width: "36px",
          height: "36px",
          border: "3px solid rgba(255,255,255,0.1)",
          borderTopColor: "#ffd700",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#1a1128",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{
        maxWidth: "420px",
        width: "100%",
        background: "#0f0a1a",
        border: "1px solid #251a3a",
        borderRadius: "20px",
        padding: "32px 24px",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
      }}>
        {showSuccess ? (
          <>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
            <h2 style={{
              fontSize: "26px",
              fontWeight: 900,
              color: "#22c55e",
              margin: "0 0 12px 0"
            }}>
              Payment Successful!
            </h2>
            <p style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "#ffffff",
              marginBottom: "8px"
            }}>
              🎁 You have received your Welcome Bonus of{" "}
              <span style={{ color: "#ffd700", fontWeight: 900 }}>KES 1,200</span>
            </p>
            <p style={{
              fontSize: "14px",
              color: "#94a3b8",
              marginBottom: "24px",
              lineHeight: 1.5
            }}>
              Your account is now activated. Go to the dashboard and complete all surveys to earn more!
            </p>
            <button
              onClick={() => {
                sessionStorage.setItem("justActivated", "1");
                navigate("/dashboard", { replace: true });
              }}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "14px",
                fontWeight: 900,
                fontSize: "16px",
                cursor: "pointer",
                border: "none",
                color: "#ffffff",
                background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                boxShadow: "0 8px 24px rgba(34, 197, 94, 0.5)",
                minHeight: "52px"
              }}
            >
              GO TO THE DASHBOARD AND COMPLETE ALL SURVEYS
            </button>
          </>
        ) : (
          <>
        <div style={{ fontSize: "52px", marginBottom: "12px" }}>🎉</div>
        <h1 style={{
          fontSize: "28px",
          fontWeight: 900,
          color: "#ffd700",
          margin: "0 0 8px 0",
          textShadow: "0 2px 12px rgba(255, 215, 0, 0.4)",
          letterSpacing: "1px"
        }}>
          CONGRATULATIONS!
        </h1>

        <div style={{
          fontSize: "18px",
          fontWeight: 800,
          color: "#ffffff",
          marginBottom: "6px"
        }}>
          🎁 You have received a Welcome Bonus of:{" "}
          <span style={{ color: "#ffd700" }}>KES 1,200</span>
        </div>

        <div style={{
          fontSize: "16px",
          fontWeight: 800,
          color: "#22d3ee",
          marginBottom: "24px",
          lineHeight: 1.4
        }}>
          ACTIVATE your account with KES {ACTIVATION_FEE} AND WITHDRAW.
        </div>

        <div style={{ marginBottom: "20px", textAlign: "left" }}>
          <label style={{
            display: "block",
            fontSize: "15px",
            fontWeight: 800,
            color: "#c4b5fd",
            marginBottom: "8px",
            letterSpacing: "0.5px"
          }}>
            📱 Enter your M-Pesa Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0712345678 or 254712345678"
            disabled={submitting || waiting}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "12px",
              border: "2px solid #251a3a",
              background: "#1a1128",
              color: "#ffffff",
              fontSize: "17px",
              fontWeight: 700,
              boxSizing: "border-box",
              outline: "none",
              letterSpacing: "1px"
            }}
          />
          <p style={{
            fontSize: "13px",
            color: "#94a3b8",
            marginTop: "8px",
            marginBottom: 0,
            fontWeight: 600
          }}>
            Enter the number that you want to pay with and tap the button below
          </p>
        </div>

        <button
          onClick={handlePay}
          disabled={submitting || waiting}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "14px",
            fontWeight: 900,
            fontSize: "16px",
            cursor: "pointer",
            border: "none",
            color: "#ffffff",
            background: submitting || waiting
              ? "#4b5563"
              : "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
            boxShadow: submitting || waiting
              ? "none"
              : "0 8px 24px rgba(220, 38, 38, 0.5)",
            animation: submitting || waiting ? "none" : "pulse-btn 1.5s ease-in-out infinite",
            minHeight: "52px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          {submitting ? (
            <>
              <span style={{
                display: "inline-block",
                width: "18px",
                height: "18px",
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
                width: "18px",
                height: "18px",
                border: "3px solid rgba(255,255,255,0.3)",
                borderTopColor: "white",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }} />
              <span>Waiting for payment…</span>
            </>
          ) : (
            <>TAP HERE TO PAY</>
          )}
        </button>

        {waiting && (
          <div style={{
            marginTop: "12px",
            padding: "12px",
            borderRadius: "10px",
            background: "rgba(34, 197, 94, 0.15)",
            border: "1px solid rgba(34, 197, 94, 0.4)",
            color: "#bbf7d0",
            fontSize: "13px",
            fontWeight: 700,
            textAlign: "center"
          }}>
            📲 STK Push Sent! Check your phone and enter your M-Pesa PIN to complete payment.
          </div>
        )}

        {error && (
          <div style={{
            marginTop: "12px",
            padding: "10px",
            borderRadius: "8px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#fecaca",
            fontSize: "13px",
            fontWeight: 700,
            textAlign: "center"
          }}>
            ❌ {error}
          </div>
        )}

        <button
          onClick={() => navigate("/dashboard")}
          style={{
            width: "100%",
            marginTop: "16px",
            padding: "12px",
            borderRadius: "12px",
            fontWeight: 700,
            fontSize: "14px",
            cursor: "pointer",
            border: "2px solid #7c3aed",
            background: "transparent",
            color: "#7c3aed",
            minHeight: "44px"
          }}
        >
          ← Back to Dashboard
        </button>
          </>
        )}
      </div>

      <style>{
        `@keyframes spin { to { transform: rotate(360deg); } }
         @keyframes pulse-btn {
           0%, 100% { transform: scale(1); }
           50% { transform: scale(1.02); }
         }`
      }</style>
    </div>
  );
}
