import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const ONBOARDING_QUESTIONS = [
  {
    id: 1,
    question: "How did you hear about us?",
    options: [
      "Facebook",
      "WhatsApp",
      "Friend/Relative",
      "Google Search",
      "Other"
    ]
  },
  {
    id: 2,
    question: "What device do you use?",
    options: [
      "Smartphone (Android)",
      "Smartphone (iPhone)",
      "Tablet",
      "Computer/Laptop"
    ]
  },
  {
    id: 3,
    question: "How often do you use the internet?",
    options: [
      "Every day",
      "Several times a week",
      "Once a week",
      "Rarely"
    ]
  },
  {
    id: 4,
    question: "What do you hope to earn per month?",
    options: [
      "KES 1,000 - 5,000",
      "KES 5,000 - 10,000",
      "KES 10,000 - 20,000",
      "KES 20,000+"
    ]
  }
];

export default function OnboardingSurvey() {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);

  const handleAnswer = async (answer) => {
    const newAnswers = {
      ...answers,
      [ONBOARDING_QUESTIONS[currentQuestion].id]: answer
    };
    setAnswers(newAnswers);

    if (currentQuestion < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      await submitAnswers(newAnswers);
    }
  };

  const submitAnswers = async (finalAnswers) => {
    setLoading(true);
    try {
      await api.post("/auth/survey-onboarding", {
        answers: finalAnswers
      });
      localStorage.setItem("survey_onboarding_completed", "true");
      localStorage.setItem("showWelcomeBonusOnDashboard", "true");
      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to submit survey answers:", error);
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const progress = ((currentQuestion + 1) / ONBOARDING_QUESTIONS.length) * 100;
  const question = ONBOARDING_QUESTIONS[currentQuestion];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: "20px",
        padding: "30px",
        maxWidth: "400px",
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            fontSize: "48px",
            marginBottom: "10px"
          }}>📝</div>
          <h2 style={{
            color: "#1e293b",
            fontSize: "20px",
            fontWeight: "800",
            margin: "0 0 8px 0"
          }}>
            Quick Survey
          </h2>
          <p style={{
            color: "#64748b",
            fontSize: "14px",
            margin: 0
          }}>
            Help us know you better!
          </p>
        </div>

        <div style={{
          background: "#f1f5f9",
          borderRadius: "10px",
          height: "8px",
          marginBottom: "24px",
          overflow: "hidden"
        }}>
          <div style={{
            background: "linear-gradient(90deg, #667eea, #764ba2)",
            height: "100%",
            width: `${progress}%`,
            transition: "width 0.3s ease",
            borderRadius: "10px"
          }} />
        </div>

        <div style={{
          background: "#f8fafc",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
          border: "2px solid #e2e8f0"
        }}>
          <p style={{
            color: "#1e293b",
            fontSize: "16px",
            fontWeight: "700",
            margin: "0 0 20px 0",
            lineHeight: "1.5"
          }}>
            {question.question}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={loading}
                style={{
                  padding: "14px 16px",
                  background: "#ffffff",
                  border: "2px solid #e2e8f0",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#334155",
                  cursor: loading ? "not-allowed" : "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  opacity: loading ? 0.6 : 1
                }}
                onMouseOver={(e) => {
                  if (!loading) {
                    e.target.style.borderColor = "#667eea";
                    e.target.style.background = "#f0fdf4";
                  }
                }}
                onMouseOut={(e) => {
                  if (!loading) {
                    e.target.style.borderColor = "#e2e8f0";
                    e.target.style.background = "#ffffff";
                  }
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <p style={{
          textAlign: "center",
          color: "#94a3b8",
          fontSize: "12px",
          margin: 0
        }}>
          Question {currentQuestion + 1} of {ONBOARDING_QUESTIONS.length}
        </p>
      </div>
    </div>
  );
}