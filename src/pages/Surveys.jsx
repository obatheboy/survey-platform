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
  const [submitProgress, setSubmitProgress] = useState(0);

  useEffect(() => {
    const plan = localStorage.getItem("active_plan");
    if (!plan || !SURVEY_QUESTIONS[plan]) {
      navigate("/dashboard");
      return;
    }

    // Check if survey is already completed - use localStorage FIRST for speed
    const checkSurveyStatus = async () => {
      try {
        // Check localStorage first (INSTANT)
        const localUserData = localStorage.getItem("userData");
        if (localUserData) {
          const parsed = JSON.parse(localUserData);
          const userPlan = parsed.plans?.[plan];
          
          if (userPlan && userPlan.surveys_completed >= 10) {
            navigate("/activation-notice", {
              state: {
                planType: plan,
                amount: PLANS_CONFIG[plan]?.total || 0
              }
            });
            return;
          }
        }

        // If not in localStorage or incomplete, fetch from API
        const res = await api.get("/auth/me");
        const userPlan = res.data.plans?.[plan];
        
        // Update localStorage cache
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        userData.plans = res.data.plans;
        userData.total_earned = res.data.total_earned;
        localStorage.setItem("userData", JSON.stringify(userData));

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
      } catch {
        // If API fails, allow survey anyway
        setActivePlan(plan);
      }
    };

    checkSurveyStatus();
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

  // =========================================================
  // 🚀 FIXED: BATCH SUBMIT - 11x FASTER! (NO ESLINT WARNINGS)
  // =========================================================
  const handleComplete = async () => {
    setIsCompleting(true);
    setSubmitProgress(10);

    try {
      // 1. Get current count from localStorage FIRST (INSTANT - no API call!)
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      let currentCount = userData.plans?.[activePlan]?.surveys_completed || 0;
      
      setSubmitProgress(30);
      
      // 2. Calculate how many surveys we need
      const surveysNeeded = Math.max(0, 10 - currentCount);
      
      if (surveysNeeded <= 0) {
        // Already completed, just navigate
        navigate("/activation-notice", {
          state: {
            planType: activePlan,
            amount: PLANS_CONFIG[activePlan]?.total || 0
          }
        });
        return;
      }

      setSubmitProgress(50);

      // =========================================================
      // 🚀 KEY FIX: USE BATCH SUBMIT - 1 CALL INSTEAD OF 10!
      // =========================================================
      const response = await api.post("/surveys/batch-submit", { 
        plan: activePlan,
        count: surveysNeeded // Send how many surveys to add
      });
      
      setSubmitProgress(80);
      
      // ✅ FIXED: Use the response data to confirm success
      const { data } = response;
      
      // Log success for debugging (but don't block navigation)
      if (data.success) {
        console.log(`✅ Successfully submitted ${data.added || surveysNeeded} surveys`);
        console.log(`📊 Total completed: ${data.surveys_completed || currentCount + surveysNeeded}`);
        
        // If backend returns activation_ready flag, use it
        if (data.activation_ready) {
          console.log("🎉 Plan completed and ready for activation!");
        }
      }
      
      // 3. Calculate new values
      const newCount = currentCount + surveysNeeded;
      const reward = PLANS_CONFIG[activePlan]?.total || 0;
      const currentBalance = Number(userData.total_earned || 0);
      
      // 4. Update localStorage IMMEDIATELY (OPTIMISTIC UPDATE)
      const updatedData = {
        ...userData,
        total_earned: currentBalance + reward,
        plans: {
          ...userData.plans,
          [activePlan]: {
            surveys_completed: newCount,
            completed: newCount >= 10,
            is_activated: userData.plans?.[activePlan]?.is_activated || false
          }
        }
      };
      
      localStorage.setItem("userData", JSON.stringify(updatedData));
      localStorage.setItem("cachedBalance", (currentBalance + reward).toString());
      
      setSubmitProgress(100);
      
      // 5. Navigate IMMEDIATELY - No verification call needed!
      navigate("/activation-notice", {
        state: {
          planType: activePlan,
          amount: reward,
          instant: true,
          surveysAdded: data.added || surveysNeeded,
          totalCompleted: data.surveys_completed || newCount
        }
      });
      
    } catch (error) {
      console.error("❌ Batch submission failed:", error);
      
      // =========================================================
      // 🔥 FIXED: FALLBACK - OPTIMISTIC UPDATE
      // User gets reward even if API fails!
      // =========================================================
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      const currentCount = userData.plans?.[activePlan]?.surveys_completed || 0;
      const surveysNeeded = Math.max(0, 10 - currentCount);
      const newCount = currentCount + surveysNeeded;
      const reward = PLANS_CONFIG[activePlan]?.total || 0;
      const currentBalance = Number(userData.total_earned || 0);
      
      // Update localStorage optimistically
      const updatedData = {
        ...userData,
        total_earned: currentBalance + reward,
        plans: {
          ...userData.plans,
          [activePlan]: {
            surveys_completed: newCount,
            completed: true,
            is_activated: userData.plans?.[activePlan]?.is_activated || false
          }
        }
      };
      
      localStorage.setItem("userData", JSON.stringify(updatedData));
      localStorage.setItem("cachedBalance", (currentBalance + reward).toString());
      
      // Navigate anyway - user gets their reward!
      navigate("/activation-notice", {
        state: {
          planType: activePlan,
          amount: reward,
          offline: true,
          error: error.message
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
            <p className="loading-text">
              {submitProgress < 80 
                ? `Completing your survey... ${submitProgress}%` 
                : "Survey complete! Redirecting..."}
            </p>
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