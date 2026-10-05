import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { workApi } from "../api/api";
import { useCurrency } from "../contexts/CurrencyContext.jsx";
import {
  TASK_TYPE_ORDER,
  TASK_TYPE_META,
  TASK_PAY,
  DAILY_LIMITS,
  VERIFICATION_MODE,
} from "../constants/workTasks";
import "./WorkTasks.css";

export default function WorkTaskHub() {
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [types, setTypes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHub();
  }, []);

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
        <h1 className="work-title">💼 Work Tasks</h1>
        <p className="work-subtitle">
          Complete tasks and get paid. Pick a category below to start.
        </p>

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
