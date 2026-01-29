import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { SURVEY_QUESTIONS } from "./components/surveyQuestions.js";
import "./Surveys.css";

// Plan config for display
const PLANS_CONFIG = {
  REGULAR: { name: "Regular", icon: "⭐", total: 1500 },
  VIP: { name: "VIP", icon: "💎", total: 2000 },
  VVIP: { name: "VVIP", icon: "👑", total: 3000 },
};

export default function Surveys() {
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const plan = localStorage.getItem("active_plan");
    if (!plan || !SURVEY_QUESTIONS[plan]) {
      navigate("/dashboard");
      return;
    }

    // Check local storage first for immediate feedback
    if (localStorage.getItem(`survey_completed_${plan}`) === 'true') {
      navigate("/activation-notice", {
        state: {
          planType: plan,
          amount: PLANS_CONFIG[plan]?.total || 0
        }
      });
      return;
    }

    // Check if survey is already completed to prevent re-doing
    api.get("/auth/me")
      .then((res) => {
        const userPlan = res.data.plans?.[plan];
        if (userPlan && userPlan.surveys_completed >= 10) {
          navigate("/activation-notice", {
            state: {
              planType: plan,
              amount: PLANS_CONFIG[plan]?.total || 0
            }
          });
        } else {
          setActivePlan(plan);
        }
      })
      .catch(() => navigate("/dashboard"));
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
    // Mark as completed locally to prevent re-entry and update dashboard immediately
    localStorage.setItem(`survey_completed_${activePlan}`, 'true');

    try {
      // Submit survey answers to backend
      await api.post("/surveys/complete", {
        plan: activePlan,
        answers: answers,
      });

      navigate("/activation-notice", {
        state: {
          planType: activePlan,
          amount: PLANS_CONFIG[activePlan]?.total || 0
        }
      });
    } catch (error) {
      console.error("Failed to complete survey:", error);
      // Proceed to activation notice even if submission fails (fallback flow)
      navigate("/activation-notice", {
        state: {
          planType: activePlan,
          amount: PLANS_CONFIG[activePlan]?.total || 0
        }
      });
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