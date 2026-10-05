import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { workApi } from "../api/api";
import { useCurrency } from "../contexts/CurrencyContext.jsx";
import { STATUS_LABELS } from "../constants/workTasks";
import "./WorkTasks.css";

export default function WorkSubmissions() {
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const res = await workApi.getSubmissions(50);
      if (res.data?.success) setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error("loadSubmissions error:", err);
      toast.error("Could not load submissions");
    } finally {
      setLoading(false);
    }
  };

  const statusStyle = (status) => {
    const s = STATUS_LABELS[status] || { tone: "pending", label: status };
    const tones = {
      paid: { bg: "#dcfce7", color: "#166534", border: "#86efac" },
      pending: { bg: "#fef3c7", color: "#92400e", border: "#fcd34d" },
      rejected: { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
    };
    return tones[s.tone] || tones.pending;
  };

  return (
    <div className="work-page">
      <div className="work-card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <button onClick={() => navigate("/work")} className="work-back-btn">
          ← Back to Work Tasks
        </button>
        <h1 className="work-title">📋 My Submissions</h1>
        <p className="work-subtitle">Your recent work and payment status.</p>

        {loading ? (
          <div className="work-spinner-wrap">
            <div className="work-spinner" />
          </div>
        ) : submissions.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6b7280", padding: "24px" }}>
            No submissions yet. Complete a task to see it here.
          </p>
        ) : (
          <div className="work-submission-list">
            {submissions.map((sub) => {
              const st = statusStyle(sub.status);
              return (
                <div key={sub._id} className="work-submission-card">
                  <div className="work-submission-header">
                    <span className="work-submission-id">{sub.taskId}</span>
                    <span
                      className="work-submission-status"
                      style={{
                        background: st.bg,
                        color: st.color,
                        border: `1px solid ${st.border}`,
                      }}
                    >
                      {STATUS_LABELS[sub.status]?.label || sub.status}
                    </span>
                  </div>
                  <h3 className="work-submission-title">{sub.title}</h3>
                  <div className="work-submission-meta">
                    <span>{format(sub.pay)}</span>
                    <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                  </div>
                  {sub.reviewNotes && (
                    <p className="work-submission-notes">
                      Reviewer: {sub.reviewNotes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
