import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const TOTAL_SURVEYS = 10;

/* =========================
   PLAN LABELS
========================= */
const PLAN_LABELS = {
  REGULAR: "Regular",
  VIP: "VIP",
  VVIP: "VVIP",
};

/* =========================
   QUESTIONS (STATIC)
========================= */
const QUESTIONS = [
  { q: "How often do you use the internet daily?", options: ["Less than 1 hour", "1–3 hours", "4–6 hours", "More than 6 hours"] },
  { q: "Do you trust online earning platforms?", options: ["Yes", "No", "Not sure", "Depends on platform"] },
  { q: "Which device do you use most?", options: ["Phone", "Laptop", "Tablet", "Desktop"] },
  { q: "How familiar are you with online surveys?", options: ["Very familiar", "Somewhat", "New", "Never used"] },
  { q: "How fast is your internet connection?", options: ["Very fast", "Average", "Slow", "Unstable"] },
  { q: "Do you use mobile money services?", options: ["Yes daily", "Occasionally", "Rarely", "Never"] },
  { q: "Which social platform do you use most?", options: ["WhatsApp", "Facebook", "Instagram", "TikTok"] },
  { q: "How comfortable are you sharing feedback online?", options: ["Very comfortable", "Comfortable", "Not sure", "Uncomfortable"] },
  { q: "Would you recommend online surveys to friends?", options: ["Yes", "Maybe", "No", "Not sure"] },
  { q: "What motivates you most to complete surveys?", options: ["Money", "Curiosity", "Time pass", "Learning"] },
];

export default function Surveys() {
  const navigate = useNavigate();

  const [activePlan, setActivePlan] = useState(null);
  const [surveysDone, setSurveysDone] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  /* =========================
     LOAD STATE (BACKEND = LAW)
  ========================= */
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await api.get("/auth/me");

        const backendActivePlan = res.data.active_plan;
        if (!backendActivePlan) {
          navigate("/dashboard", { replace: true });
          return;
        }

        const planState = res.data.plans?.[backendActivePlan];
        if (!planState) {
          navigate("/dashboard", { replace: true });
          return;
        }

        if (planState.completed || planState.surveys_completed >= TOTAL_SURVEYS) {
          navigate("/activation-notice", { replace: true });
          return;
        }

        if (!alive) return;
        setActivePlan(backendActivePlan);
        setSurveysDone(planState.surveys_completed);
      } catch (err) {
        console.warn("Survey state load failed");
        // ❌ DO NOT redirect here
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => (alive = false);
  }, [navigate]);

  if (loading) {
    return <p style={{ textAlign: "center", marginTop: 80 }}>Loading…</p>;
  }

  if (!activePlan) return null;

  const currentQuestion = QUESTIONS[surveysDone];
  const progress = (surveysDone / TOTAL_SURVEYS) * 100;

  /* =========================
     SUBMIT ANSWER
  ========================= */
  const handleNext = async () => {
    if (submitting) return;

    if (selectedOption === null) {
      alert("Please select an option to continue");
      return;
    }

    try {
      setSubmitting(true);

      const res = await api.post("/surveys/submit", {
        plan: activePlan,
        answer: selectedOption,
      });

      setSelectedOption(null);

      if (res.data.completed || res.data.surveys_completed >= TOTAL_SURVEYS) {
        navigate("/activation-notice", { replace: true });
        return;
      }

      setSurveysDone(res.data.surveys_completed);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to submit survey. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <div style={page}>
      <div style={card}>
        <h2 style={title}>📋 {PLAN_LABELS[activePlan]} Survey</h2>

        <div style={meta}>
          <span>
            Question {surveysDone + 1} / {TOTAL_SURVEYS}
          </span>
          <span>{progress.toFixed(0)}%</span>
        </div>

        <div style={progressBar}>
          <div style={{ ...progressFill, width: `${progress}%` }} />
        </div>

        <h3 style={question}>{currentQuestion.q}</h3>

        <div>
          {currentQuestion.options.map((opt, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedOption(idx)}
              style={{
                ...optionCard,
                ...(selectedOption === idx ? optionActive : {}),
              }}
            >
              {opt}
            </div>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={submitting || selectedOption === null}
          style={{
            ...button,
            opacity: submitting || selectedOption === null ? 0.6 : 1,
            cursor:
              submitting || selectedOption === null
                ? "not-allowed"
                : "pointer",
          }}
        >
          {surveysDone + 1 === TOTAL_SURVEYS ? "Finish Surveys" : "Next"}
        </button>
      </div>
    </div>
  );
}

/* =========================
   STYLES
========================= */
/* ===============================
   SURVEY PAGE STYLES (ENHANCED)
================================ */

const page = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 16,
  background: "#f8fafc", // Professional light background
};

const card = {
  width: "100%",
  maxWidth: 480,
  background: "#ffffff",
  borderRadius: 24,
  padding: 32,
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
  border: "1px solid #f1f5f9",
};

const title = {
  textAlign: "center",
  marginBottom: 20,
  fontSize: 22,
  fontWeight: 800,
  color: "#0f172a",
  letterSpacing: "-0.5px",
};

const meta = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 14,
  fontWeight: 600,
  color: "#64748b",
  marginBottom: 12,
};

/* ===============================
   PROGRESS BAR
================================ */
const progressBar = {
  height: 10,
  background: "#f1f5f9",
  borderRadius: 10,
  overflow: "hidden",
  marginBottom: 28,
  border: "1px solid #e2e8f0",
};

const progressFill = {
  height: "100%",
  background: "linear-gradient(90deg, #2563eb, #3b82f6)",
  borderRadius: 10,
  transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
};

/* ===============================
   QUESTION
================================ */
const question = {
  marginBottom: 20,
  fontSize: 18,
  fontWeight: 700,
  color: "#1e293b",
  lineHeight: "1.4",
};

/* ===============================
   OPTION CARDS
================================ */
const optionCard = {
  padding: "16px 20px",
  borderRadius: 16,
  border: "1.5px solid #e2e8f0",
  marginBottom: 12,
  cursor: "pointer",
  background: "#ffffff",
  fontSize: 16,
  fontWeight: 500,
  color: "#475569",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
};

const optionActive = {
  borderColor: "#2563eb",
  background: "#eff6ff",
  color: "#1e40af",
  fontWeight: "600",
  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.1)",
};

/* ===============================
   BUTTON
================================ */
const button = {
  width: "100%",
  padding: "16px",
  marginTop: 24,
  borderRadius: 16,
  border: "none",
  background: "linear-gradient(135deg, #2563eb, #1e40af)",
  color: "#ffffff",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.2s ease",
  boxShadow: "0 10px 15px -3px rgba(37, 99, 235, 0.3)",
};

/* ===============================
   EXPORT
================================ */
export {
  page,
  card,
  title,
  meta,
  progressBar,
  progressFill,
  question,
  optionCard,
  optionActive,
  button,
};
