import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { SURVEY_QUESTIONS } from "../data/surveyQuestions.js";
import "./Surveys.css";

// Plan config for display
const PLANS_CONFIG = {
  REGULAR: { name: "Regular", icon: "⭐" },
  VIP: { name: "VIP", icon: "💎" },
  VVIP: { name: "VVIP", icon: "👑" },
};

export default function Surveys() {
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const plan = localStorage.getItem("active_plan");
    if (!plan || !SURVEY_QUESTIONS[plan]) {
      navigate("/dashboard");
    } else {
      setActivePlan(plan);
    }
  }, [navigate]);

  const questions = useMemo(() => {
    return activePlan ? SURVEY_QUESTIONS[activePlan] : [];
  }, [activePlan]);

  const handleOptionSelect = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      // Simulate API call to submit survey answers
      await api.post("/surveys/complete", {
        plan: activePlan,
        answers: answers,
      });
      setIsCompleted(true);
    } catch (error) {
      console.error("Failed to complete survey:", error);
      // In a real app, show an error message
      alert("Failed to submit survey. Please try again.");
    } finally {
      setIsCompleting(false);
    }
  };

  if (!activePlan) {
    return (
      <div className="survey-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading survey...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const planConfig = PLANS_CONFIG[activePlan];

  if (isCompleted) {
    return (
      <div className="survey-page">
        <div className="survey-container">
          <div className="completion-container">
            <div className="completion-icon">🎉</div>
            <h2>Survey Completed!</h2>
            <p>
              Thank you for your feedback. Your earnings have been updated.
              You can now return to your dashboard.
            </p>
            <button
              className="nav-btn primary"
              onClick={() => navigate("/dashboard")}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-page">
      <div className="survey-container">
        <div className="survey-header">
          <h1>
            <span className="plan-icon">{planConfig.icon}</span>
            {planConfig.name} Plan Survey
          </h1>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {isCompleting ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Submitting your answers...</p>
          </div>
        ) : (
          <>
            <div className="survey-body">
              <p className="question-counter">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
              <h2 className="question-text">{currentQuestion.question}</h2>
              <div className="options-grid">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className={`option-btn ${
                      answers[currentQuestion.id] === option ? "selected" : ""
                    }`}
                    onClick={() => handleOptionSelect(currentQuestion.id, option)}
                  >
                    <span className="option-indicator">
                      {answers[currentQuestion.id] === option && "✓"}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="survey-footer">
              <button
                className="nav-btn secondary"
                onClick={handlePrev}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </button>
              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  className="nav-btn primary"
                  onClick={handleNext}
                  disabled={!answers[currentQuestion.id]}
                >
                  Next
                </button>
              ) : (
                <button
                  className="nav-btn primary"
                  onClick={handleComplete}
                  disabled={!answers[currentQuestion.id]}
                >
                  Complete Survey
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}