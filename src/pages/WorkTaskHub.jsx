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
    try {
      const [typesRes, statsRes] = await Promise.all([
        workApi.getTaskTypes(),
        workApi.getHubStats(),
      ]);
      setTypes(typesRes.data?.types || []);
      setStats(statsRes.data || {});
    } catch (err) {
      console.error("Failed to load hub:", err);
      toast.error("Failed to load work tasks");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="work-page">
        <div className="work-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "4px solid rgba(124, 58, 237, 0.2)",
                borderTopColor: "#7c3aed",
                borderRadius: "50%",
                animation: "lb-spin 0.8s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <p style={{ color: "#9ca3af", fontWeight: 600 }}>Loading work tasks...</p>
          </div>
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

        <div className="work-types-list">
          {types.map((type) => {
            const meta = TASK_TYPE_META[type] || {};
            const pay = TASK_PAY[type] || 0;
            const dailyLimit = DAILY_LIMITS[type] || 0;
            const todayCount = stats?.today_counts?.[type] || 0;
            const remaining = Math.max(0, dailyLimit - todayCount);

            return (
              <div
                key={type}
                className="work-type-card"
                onClick={() => navigate(`/work/${type}`)}
              >
                <div className="work-type-info">
                  <span className="work-type-icon">{meta.icon || "📋"}</span>
                  <div>
                    <div className="work-type-name">{meta.label || type}</div>
                    <div className="work-type-meta">
                      {format(pay)} per task
                      {dailyLimit > 0 && ` • ${remaining} left today`}
                    </div>
                  </div>
                </div>
                <span className="work-type-arrow">›</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
