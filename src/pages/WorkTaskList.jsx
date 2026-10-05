import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { workApi } from "../api/api";
import { useCurrency } from "../contexts/CurrencyContext.jsx";
import {
  TASK_TYPE_META,
  DAILY_LIMITS,
  VERIFICATION_MODE,
  STATUS_LABELS,
} from "../constants/workTasks";
import "./WorkTasks.css";

export default function WorkTaskList() {
  const { typeSlug } = useParams();
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const typeKey =
    Object.entries(TASK_TYPE_META).find(
      ([, m]) => m.slug === typeSlug
    )?.[0] || null;
  const meta = typeKey ? TASK_TYPE_META[typeKey] : null;

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workApi.getTasks(typeSlug);
      if (res.data?.success) setData(res.data);
    } catch (err) {
      console.error("loadTasks error:", err);
      toast.error("Could not load tasks");
    } finally {
      setLoading(false);
    }
  }, [typeSlug]);

  useEffect(() => {
    if (!typeKey) {
      toast.error("Unknown task type");
      navigate("/work");
      return;
    }
    loadTasks();
  }, [typeKey, navigate, loadTasks]);

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

  if (!meta || !data) return null;

  const stateLabel = {
    available: "Available",
    completed: "Completed",
    pending: "In review",
    exhausted: "Attempts used",
  };
  const stateColor = {
    available: "#0DAA65",
    completed: "#6b7280",
    pending: "#f59e0b",
    exhausted: "#ef4444",
  };

  return (
    <div className="work-page">
      <div className="work-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <button
          onClick={() => navigate("/work")}
          className="work-back-btn"
        >
          ← Back to Work Tasks
        </button>

        <div className="work-type-header-bar">
          <span className="work-type-header-icon">{meta.icon}</span>
          <div>
            <h1 className="work-title" style={{ fontSize: "20px" }}>
              {meta.label}
            </h1>
            <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>
              {format(data.pay)} per task •{" "}
              {data.doneToday}/{data.dailyLimit} done today •{" "}
              {data.remainingToday} remaining
            </p>
          </div>
        </div>

        {data.remainingToday <= 0 && (
          <div className="work-warning">
            Daily limit reached. Come back tomorrow for more tasks.
          </div>
        )}

        <div className="work-task-list">
          {data.tasks.map((task) => {
            return (
              <button
                key={task.taskId}
                className={`work-task-card ${task.state}`}
                onClick={() => {
                  if (task.state === "available") navigate(`/work/task/${task.taskId}`);
                }}
                disabled={task.state !== "available"}
              >
                <div className="work-task-main">
                  <div className="work-task-title-row">
                    <span className="work-task-id">{task.taskId}</span>
                    <span
                      className="work-task-state"
                      style={{ background: stateColor[task.state] || "#6b7280" }}
                    >
                      {stateLabel[task.state] || task.state}
                    </span>
                  </div>
                  <h3 className="work-task-title">{task.title}</h3>
                  <p className="work-task-brief">{task.brief}</p>
                  <div className="work-task-footer">
                    <span className="work-task-pay">{format(task.pay)}</span>
                    <span className="work-task-effort">{task.estimatedTime}</span>
                    <span
                      className="work-task-difficulty"
                      style={{
                        color:
                          task.difficulty === "Easy"
                            ? "#0DAA65"
                            : task.difficulty === "Medium"
                            ? "#f59e0b"
                            : "#ef4444",
                      }}
                    >
                      {task.difficulty}
                    </span>
                  </div>
                  {task.lastMessage && (
                    <p className="work-task-message">
                      Reviewer: {task.lastMessage}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {data.tasks.length === 0 && (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "20px" }}>
            No tasks available right now. Check back later.
          </p>
        )}
      </div>
    </div>
  );
}
