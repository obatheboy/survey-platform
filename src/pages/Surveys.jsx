import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { SURVEY_QUESTIONS } from "./components/surveyQuestions.js";
import "./Surveys.css";

// Plan configuration constants
const PLANS_CONFIG = {
  REGULAR: { name: "Regular", icon: "⭐", total: 1500 },
  VIP: { name: "VIP", icon: "💎", total: 2000 },
  VVIP: { name: "VVIP", icon: "👑", total: 3000 },
};

// Local storage keys
const STORAGE_KEYS = {
  USER_DATA: "userData",
  CACHED_BALANCE: "cachedBalance",
  ACTIVE_PLAN: "active_plan",
};

export default function Surveys() {
  const navigate = useNavigate();
  
  // State management
  const [activePlan, setActivePlan] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isCompleting, setIsCompleting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Memoized questions based on active plan
  const questions = useMemo(() => {
    return activePlan ? SURVEY_QUESTIONS[activePlan] : [];
  }, [activePlan]);

  // Memoized current question
  const currentQuestion = useMemo(() => {
    return questions[currentQuestionIndex];
  }, [questions, currentQuestionIndex]);

  // Memoized progress percentage
  const progress = useMemo(() => {
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  }, [currentQuestionIndex, questions.length]);

  // Memoized plan config
  const planConfig = useMemo(() => {
    return activePlan ? PLANS_CONFIG[activePlan] : null;
  }, [activePlan]);

  // Check if current question is answered
  const isCurrentQuestionAnswered = useMemo(() => {
    return currentQuestion && Boolean(answers[currentQuestion.id]);
  }, [currentQuestion, answers]);

  // =========================================================
  // NAVIGATION HELPER
  // =========================================================
  const navigateToActivation = useCallback((plan) => {
    navigate("/activation-notice", {
      state: {
        planType: plan,
        amount: PLANS_CONFIG[plan]?.total || 0
      }
    });
  }, [navigate]);

  // =========================================================
  // SURVEY STATUS CHECK
  // =========================================================
  useEffect(() => {
    const checkSurveyStatus = async () => {
      setIsLoading(true);
      
      try {
        const plan = localStorage.getItem(STORAGE_KEYS.ACTIVE_PLAN);
        
        // Validate plan exists
        if (!plan || !SURVEY_QUESTIONS[plan]) {
          navigate("/dashboard");
          return;
        }

        // Check localStorage first (instant)
        const surveyCompleted = await checkLocalStorageSurveyStatus(plan);
        if (surveyCompleted) return;

        // If not in localStorage, check API
        await checkApiSurveyStatus(plan);
        
      } catch (error) {
        console.error("Survey status check failed:", error);
        // Allow survey on error
        const plan = localStorage.getItem(STORAGE_KEYS.ACTIVE_PLAN);
        setActivePlan(plan);
      } finally {
        setIsLoading(false);
      }
    };

    const checkLocalStorageSurveyStatus = async (plan) => {
      const localUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      
      if (localUserData) {
        const parsed = JSON.parse(localUserData);
        const userPlan = parsed.plans?.[plan];
        
        if (userPlan?.surveys_completed >= 10) {
          navigateToActivation(plan);
          return true;
        }
      }
      
      return false;
    };

    const checkApiSurveyStatus = async (plan) => {
      const res = await api.get("/auth/me");
      const userPlan = res.data.plans?.[plan];
      
      // Update localStorage cache
      updateLocalStorageUserData(res.data);
      
      if (userPlan?.surveys_completed >= 10) {
        navigateToActivation(plan);
      } else {
        setActivePlan(plan);
      }
    };

    const updateLocalStorageUserData = (apiData) => {
      const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || "{}");
      userData.plans = apiData.plans;
      userData.total_earned = apiData.total_earned;
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    };

    checkSurveyStatus();
  }, [navigate, navigateToActivation]);

  // =========================================================
  // EVENT HANDLERS
  // =========================================================
  const handleOptionSelect = useCallback((questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  const handlePrev = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  // =========================================================
  // LOCAL STORAGE UPDATE HELPER
  // =========================================================
  const updateLocalStorageAfterSubmission = useCallback((userData, plan, newCount, currentBalance, reward) => {
    const updatedData = {
      ...userData,
      total_earned: currentBalance + reward,
      plans: {
        ...userData.plans,
        [plan]: {
          surveys_completed: newCount,
          completed: newCount >= 10,
          is_activated: userData.plans?.[plan]?.is_activated || false
        }
      }
    };
    
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedData));
    localStorage.setItem(STORAGE_KEYS.CACHED_BALANCE, (currentBalance + reward).toString());
  }, []);

  // =========================================================
  // BATCH SUBMIT HELPER
  // =========================================================
  const submitBatchSurveys = useCallback(async (plan, surveysNeeded, userData, currentCount) => {
    const response = await api.post("/surveys/batch-submit", { 
      plan,
      count: surveysNeeded
    });
    
    setSubmitProgress(80);
    
    // Log success
    const { data } = response;
    console.log(`✅ Successfully submitted ${data.added || surveysNeeded} surveys`);
    
    // Calculate new values
    const newCount = currentCount + surveysNeeded;
    const reward = PLANS_CONFIG[plan]?.total || 0;
    const currentBalance = Number(userData.total_earned || 0);
    
    // Update localStorage optimistically
    updateLocalStorageAfterSubmission(userData, plan, newCount, currentBalance, reward);
    
    setSubmitProgress(100);
    
    // Navigate to activation
    navigate("/activation-notice", {
      state: {
        planType: plan,
        amount: reward,
        instant: true,
        surveysAdded: data.added || surveysNeeded,
        totalCompleted: data.surveys_completed || newCount
      }
    });
  }, [navigate, updateLocalStorageAfterSubmission]);

  // =========================================================
  // ERROR HANDLER
  // =========================================================
  const handleSubmissionError = useCallback((plan) => {
    // Optimistic update on error
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || "{}");
    const currentCount = userData.plans?.[plan]?.surveys_completed || 0;
    const surveysNeeded = Math.max(0, 10 - currentCount);
    const newCount = currentCount + surveysNeeded;
    const reward = PLANS_CONFIG[plan]?.total || 0;
    const currentBalance = Number(userData.total_earned || 0);
    
    updateLocalStorageAfterSubmission(userData, plan, newCount, currentBalance, reward);
    
    // Navigate anyway - user gets their reward!
    navigate("/activation-notice", {
      state: {
        planType: plan,
        amount: reward,
        offline: true
      }
    });
  }, [navigate, updateLocalStorageAfterSubmission]);

  // =========================================================
  // HANDLE COMPLETE - MAIN SUBMISSION FUNCTION
  // =========================================================
  const handleComplete = useCallback(async () => {
    setIsCompleting(true);
    setSubmitProgress(10);

    try {
      // Get current count from localStorage
      const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || "{}");
      const currentCount = userData.plans?.[activePlan]?.surveys_completed || 0;
      
      setSubmitProgress(30);
      
      // Calculate how many surveys needed
      const surveysNeeded = Math.max(0, 10 - currentCount);
      
      if (surveysNeeded <= 0) {
        // Already completed, just navigate
        navigateToActivation(activePlan);
        return;
      }

      setSubmitProgress(50);

      // Batch submit surveys
      await submitBatchSurveys(activePlan, surveysNeeded, userData, currentCount);
      
    } catch (error) {
      console.error("❌ Batch submission failed:", error);
      handleSubmissionError(activePlan);
    }
  }, [activePlan, navigateToActivation, submitBatchSurveys, handleSubmissionError]);

  // =========================================================
  // RENDER LOADING STATE
  // =========================================================
  if (isLoading || !activePlan || !planConfig) {
    return (
      <div className="survey-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">
            {isLoading ? "Loading survey..." : "Preparing your questions..."}
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER COMPLETION STATE
  // =========================================================
  if (isCompleting) {
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
                style={{ width: `${submitProgress}%` }}
              ></div>
            </div>
          </div>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">
              {submitProgress < 80 
                ? `Completing your survey... ${submitProgress}%` 
                : submitProgress < 100
                ? "Finalizing your results..."
                : "Survey complete! Redirecting..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // MAIN RENDER
  // =========================================================
  return (
    <div className="survey-page">
      <div className="survey-container">
        {/* Header */}
        <div className="survey-header">
          <h1>
            <span className="plan-icon">{planConfig.icon}</span>
            {planConfig.name} Plan Survey
          </h1>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="survey-body">
          <p className="question-counter">
            <span>Q{currentQuestionIndex + 1}</span>
            of {questions.length}
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
                aria-pressed={answers[currentQuestion.id] === option}
              >
                <span className="option-indicator">
                  {answers[currentQuestion.id] === option && "✓"}
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="survey-footer">
          <button
            className="nav-btn secondary"
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            aria-label="Previous question"
          >
            ← Previous
          </button>
          
          {currentQuestionIndex < questions.length - 1 ? (
            <button
              className="nav-btn primary"
              onClick={handleNext}
              disabled={!isCurrentQuestionAnswered}
              aria-label="Next question"
            >
              Next →
            </button>
          ) : (
            <button
              className="nav-btn primary"
              onClick={handleComplete}
              disabled={!isCurrentQuestionAnswered}
              aria-label="Complete survey"
            >
              ✓ Complete Survey
            </button>
          )}
        </div>
      </div>
    </div>
  );
}