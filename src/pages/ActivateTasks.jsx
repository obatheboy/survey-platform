import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api/api";
import { taskActivationApi } from "../api/api";
import { TASK_ACTIVATION_FEE } from "../constants/fees";
import { useCurrency } from "../contexts/CurrencyContext.jsx";
import "./ActivateTasks.css";

const LOADING_BAILOUT_MS = 6000;

function ActivationLoadingScreen({ onTimeout }) {
  useEffect(() => {
    const timer = setTimeout(onTimeout, LOADING_BAILOUT_MS);
    return () => clearTimeout(timer);
  }, [onTimeout]);

  return (
    <div className="activate-tasks-loading">
      <div className="activate-tasks-loading-spinner" />
      <p className="activate-tasks-loading-text">Loading task activation...</p>
      <button onClick={onTimeout} className="activate-tasks-back" style={{ marginTop: 16, width: "auto", padding: "10px 24px" }}>
        Continue to tasks
      </button>
    </div>
  );
}

export default function ActivateTasks() {
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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

        if (res.data.task_activated === true || res.data.task_activation_fee_paid === true) {
          navigate("/work", { replace: true });
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
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
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
              navigate("/work", { replace: true });
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
    return <ActivationLoadingScreen onTimeout={() => navigate("/work", { replace: true })} />;
  }

  if (success) {
    return (
      <div className="activate-tasks-overlay">
        <div className="activate-tasks-success-card">
          <div className="activate-tasks-success-icon">✅</div>
          <h2 className="activate-tasks-success-title">
            Task Access Activated!
          </h2>
          <p className="activate-tasks-success-text">
            You can now access paid work tasks and start earning.
          </p>
          <button
            onClick={() => navigate("/work", { replace: true })}
            className="activate-tasks-success-btn"
          >
            Continue to Tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="activate-tasks-page">
      <div className="activate-tasks-card">
        <div className="activate-tasks-header">
          <div className="activate-tasks-icon">💼</div>
          <h1 className="activate-tasks-title">Activate Work Tasks</h1>
          <p className="activate-tasks-subtitle">
            Unlock AI training, articles, academic writing, and transcription tasks
          </p>
        </div>

        <div className="activate-tasks-features">
          <div className="activate-tasks-feature">
            <span className="activate-tasks-feature-icon">🤖</span>
            <span>AI Training Tasks</span>
          </div>
          <div className="activate-tasks-feature">
            <span className="activate-tasks-feature-icon">📝</span>
            <span>Article Writing</span>
          </div>
          <div className="activate-tasks-feature">
            <span className="activate-tasks-feature-icon">🎓</span>
            <span>Academic Writing</span>
          </div>
          <div className="activate-tasks-feature">
            <span className="activate-tasks-feature-icon">🎧</span>
            <span>Audio Transcription</span>
          </div>
        </div>

        <div className="activate-tasks-divider" />

        <div style={{ textAlign: "center" }}>
          <div className="activate-tasks-price-badge">
            <span className="activate-tasks-price">{format(TASK_ACTIVATION_FEE)}</span>
            <span className="activate-tasks-price-label">ONE-TIME FEE</span>
          </div>

          <div className="activate-tasks-info">
            ⚡ Pay <strong>{format(TASK_ACTIVATION_FEE)}</strong> one-time fee to unlock work tasks.
            <br />
            Surveys have a separate activation.
          </div>
        </div>

        <div className="activate-tasks-input-group">
          <label className="activate-tasks-label">
            <span>📱</span>
            <span>M-Pesa Number</span>
          </label>
          <input
            type="tel"
            className="activate-tasks-input"
            placeholder="2547XXXXXXXX or 07XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={submitting || waiting}
          />
        </div>

        <button
          onClick={handlePayment}
          disabled={submitting || waiting || !phone.trim()}
          className="activate-tasks-submit"
        >
          <span className="activate-tasks-submit-content">
            {submitting ? (
              <>
                <span className="activate-tasks-spinner" />
                <span>Sending…</span>
              </>
            ) : waiting ? (
              <>
                <span className="activate-tasks-spinner" />
                <span>Waiting for payment…</span>
              </>
            ) : (
              <>
                <span>📱</span>
                <span>Pay {format(TASK_ACTIVATION_FEE)} and Unlock Tasks</span>
                <span>⚡</span>
              </>
            )}
          </span>
        </button>

        {error && (
          <div className="activate-tasks-error">
            ❌ {error}
          </div>
        )}

        {waiting && (
          <div className="activate-tasks-waiting">
            <p className="activate-tasks-waiting-title">
              📲 STK Push Sent! Check your phone.
            </p>
            <p className="activate-tasks-waiting-text">
              Enter your M-Pesa PIN to complete payment. Verifying automatically...
            </p>
          </div>
        )}

        <button
          onClick={() => navigate("/hub")}
          className="activate-tasks-back"
        >
          ⬅ Back to Hub
        </button>
      </div>
    </div>
  );
}
