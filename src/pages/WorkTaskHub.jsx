import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { workApi, taskActivationApi } from "../api/api";
import { useCurrency } from "../contexts/CurrencyContext.jsx";
import {
  TASK_TYPE_ORDER,
  TASK_TYPE_META,
  TASK_PAY,
  DAILY_LIMITS,
  VERIFICATION_MODE,
} from "../constants/workTasks";
import { TASK_ACTIVATION_FEE } from "../constants/fees";
import "./WorkTasks.css";

export default function WorkTaskHub() {
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [types, setTypes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskActivated, setTaskActivated] = useState(null);
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState("");
  const [activationWaiting, setActivationWaiting] = useState(false);

  useEffect(() => {
    loadHub();
    checkTaskActivation();
  }, []);

  useEffect(() => {
    if (taskActivated === true) {
      loadHub();
    }
  }, [taskActivated]);

  const checkTaskActivation = async () => {
    try {
      const res = await taskActivationApi.getStatus();
      if (res.data?.success) {
        setTaskActivated(res.data.task_activated === true);
      }
    } catch (err) {
      console.error("checkTaskActivation error:", err);
    }
  };

  const startActivationPolling = (transactionRequestId, phoneNumber) => {
    let attempts = 0;
    const maxAttempts = 40;
    const POLL_INTERVAL_MS = 3000;
    const INITIAL_DELAY_MS = 8000;
    let pollTimer = null;

    const stop = (errorMsg) => {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      setActivationWaiting(false);
      if (errorMsg) setActivationError(errorMsg);
    };

    const schedulePoll = () => {
      pollTimer = setInterval(async () => {
        attempts++;
        try {
          const confirmRes = await taskActivationApi.confirm({
            transaction_request_id: transactionRequestId,
            phone: phoneNumber
          });
          console.log(`Task activation poll ${attempts}`, confirmRes.data);

          if (confirmRes.data.success && confirmRes.data.task_activated) {
            stop();
            setTaskActivated(true);
            toast.success("Work tasks activated!");
            loadHub();
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

    setTimeout(() => schedulePoll(), INITIAL_DELAY_MS);
  };

  const handleActivateTasks = async () => {
    const phoneInput = prompt("Enter your M-Pesa phone number (07XXXXXXXX or 2547XXXXXXXX):");
    if (!phoneInput) return;

    const cleanedPhone = phoneInput.replace(/\s+/g, "");
    const phoneRegex = /^(0[17][0-9]{8}|254[17][0-9]{8}|[17][0-9]{9})$/;
    if (!phoneRegex.test(cleanedPhone)) {
      setActivationError("Invalid phone number. Use format: 07XXXXXXXX or 2547XXXXXXXX");
      return;
    }

    setActivating(true);
    setActivationError("");

    try {
      const response = await taskActivationApi.initiate(cleanedPhone);
      const apiMessage = response.data.message || "";
      const transactionRequestId = response.data.transaction_request_id || response.data.reference;

      if (response.data.success === true && transactionRequestId) {
        setActivationWaiting(true);
        startActivationPolling(transactionRequestId, cleanedPhone);
      } else {
        setActivationError(apiMessage || "Payment initiation failed. Please try again.");
        setActivationWaiting(false);
      }
    } catch (err) {
      console.error("Task activation error:", err);
      setActivationError(err?.response?.data?.message || err?.message || "Network error. Please try again.");
      setActivationWaiting(false);
    } finally {
      setActivating(false);
    }
  };

  const loadHub = async () => {
    setLoading(true);
    try {
      const [typesRes, statsRes] = await Promise.all([
        workApi.getTypes(),
        workApi.getStats(),
      ]);
      if (typesRes.data?.success) setTypes(typesRes.data.types || []);
      if (statsRes.data?.success) setStats(statsRes.data);
    } catch (err) {
      console.error("loadHub error:", err);
      toast.error("Could not load work tasks");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (type) => {
    const remaining = type.remainingToday;
    if (remaining <= 0) return { text: "Done today", color: "#9ca3af" };
    if (remaining <= 2) return { text: `${remaining} left`, color: "#f59e0b" };
    return { text: `${remaining} available`, color: "#0DAA65" };
  };

  if (loading) {
    return (
      <div className="work-page">
        <div className="work-card">
          <div className="work-spinner" />
          <p style={{ textAlign: "center", color: "#6b7280", marginTop: "12px" }}>
            Loading tasks...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="work-page">
      <div className="work-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <button onClick={() => navigate("/hub")} className="work-back-btn">
          ← Back to Hub
        </button>

        <h1 className="work-title">💼 Work Tasks</h1>
        <p className="work-subtitle">
          Complete tasks and get paid. Pick a category below to start.
        </p>

        {taskActivated === false && (
          <div style={{
            background: "linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(91, 33, 182, 0.2))",
            border: "2px solid rgba(124, 58, 237, 0.5)",
            borderRadius: "12px",
            padding: "14px",
            marginBottom: "16px",
            textAlign: "center"
          }}>
            <p style={{ margin: "0 0 8px 0", fontWeight: 800, color: "#ffffff", fontSize: "14px" }}>
              🔓 Unlock Paid Work Tasks
            </p>
            <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "#c4b5fd", fontWeight: 600 }}>
              Pay a one-time fee of <strong>{format(TASK_ACTIVATION_FEE)}</strong> to access all work task categories.
              This does not affect your surveys.
            </p>
            <button
              onClick={handleActivateTasks}
              disabled={activating || activationWaiting}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                background: activating || activationWaiting ? "#4b5563" : "linear-gradient(135deg, #7c3aed, #5b21b6)",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(124, 58, 237, 0.4)"
              }}
            >
              {activating ? "Sending…" : activationWaiting ? "Waiting for payment…" : `Activate Work Tasks — ${format(TASK_ACTIVATION_FEE)}`}
            </button>
            {activationError && (
              <p style={{ marginTop: "8px", fontSize: "12px", color: "#ff9e9e", fontWeight: 700 }}>
                ❌ {activationError}
              </p>
            )}
            {activationWaiting && (
              <p style={{ marginTop: "8px", fontSize: "12px", color: "#bbf7d0", fontWeight: 700 }}>
                📲 STK Push sent! Enter your M-Pesa PIN to complete payment.
              </p>
            )}
          </div>
        )}

        {stats && (
          <div className="work-stats-bar">
            <div className="work-stat">
              <span className="work-stat-value">{format(stats.totalEarned || 0)}</span>
              <span className="work-stat-label">Total Earned</span>
            </div>
            <div className="work-stat">
              <span className="work-stat-value">{stats.completedCount || 0}</span>
              <span className="work-stat-label">Completed</span>
            </div>
            <div className="work-stat">
              <span className="work-stat-value">{stats.pendingCount || 0}</span>
              <span className="work-stat-label">Pending</span>
            </div>
          </div>
        )}

        <div className="work-type-list">
          {TASK_TYPE_ORDER.map((typeKey) => {
            const meta = TASK_TYPE_META[typeKey];
            const typeData = types.find((t) => t.type === typeKey) || {};
            const badge = getStatusBadge(typeData);
            const remainingToday = typeData.remainingToday ?? DAILY_LIMITS[typeKey];

            return (
              <button
                key={typeKey}
                className="work-type-card"
                onClick={() => navigate(`/work/${meta.slug}`)}
                disabled={remainingToday <= 0}
              >
                <div
                  className="work-type-icon"
                  style={{ background: meta.accent }}
                >
                  {meta.icon}
                </div>
                <div className="work-type-info">
                  <div className="work-type-header">
                    <span className="work-type-label">{meta.label}</span>
                    <span
                      className="work-type-badge"
                      style={{ background: badge.color }}
                    >
                      {badge.text}
                    </span>
                  </div>
                  <p className="work-type-blurb">{meta.blurb}</p>
                  <div className="work-type-meta">
                    <span className="work-type-pay">{format(meta?.pay ?? TASK_PAY[typeKey])} per task</span>
                    <span className="work-type-limit">
                      {typeData.doneToday || 0}/{typeData.dailyLimit || DAILY_LIMITS[typeKey]} today
                    </span>
                  </div>
                </div>
                <span className="work-type-chevron">›</span>
              </button>
            );
          })}
        </div>

        <div className="work-actions">
          <button
            className="work-btn-secondary"
            onClick={() => navigate("/work/submissions")}
          >
            📋 My Submissions
          </button>
        </div>
      </div>
    </div>
  );
}
