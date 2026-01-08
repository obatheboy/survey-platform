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

const page = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 16,
  background: "#f4f6fb",
};

const card = {
  width: "100%",
  maxWidth: 480,
  background: "#fff",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const title = { textAlign: "center", marginBottom: 12 };

const meta = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 14,
  color: "#555",
  marginBottom: 10,
};

const progressBar = {
  height: 6,
  background: "#eee",
  borderRadius: 4,
  overflow: "hidden",
  marginBottom: 20,
};

const progressFill = { height: "100%", background: "#6a1b9a" };

const question = { marginBottom: 16 };

const optionCard = {
  padding: 14,
  borderRadius: 10,
  border: "1px solid #ddd",
  marginBottom: 10,
  cursor: "pointer",
};

const optionActive = {
  borderColor: "#6a1b9a",
  background: "#f3e5f5",
};

const button = {
  width: "100%",
  padding: 14,
  marginTop: 20,
  borderRadius: 10,
  border: "none",
  background: "#6a1b9a",
  color: "#fff",
  fontSize: 16,
  fontWeight: "bold",
};
