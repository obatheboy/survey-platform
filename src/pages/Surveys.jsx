import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { SURVEY_QUESTIONS } from "./components/surveyQuestions.js";
import "./Surveys.css";

const PLANS_CONFIG = {
  REGULAR: { name: "REGULAR SURVEYS", icon: "⭐", total: 1500 },
  VIP: { name: "VIP SURVEY", icon: "💎", total: 2000 },
  VVIP: { name: "VVIP SURVEYS", icon: "👑", total: 3000 },
};

const STORAGE_KEYS = {
  USER_DATA: "userData",
  CACHED_BALANCE: "cachedBalance",
  ACTIVE_PLAN: "active_plan",
};

export default function Surveys() {
  const navigate = useNavigate();
  
  const [activePlan, setActivePlan] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isCompleting, setIsCompleting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const questions = useMemo(() => {
    return activePlan ? SURVEY_QUESTIONS[activePlan] : [];
  }, [activePlan]);

  const currentQuestion = useMemo(() => {
    return questions[currentQuestionIndex];
  }, [questions, currentQuestionIndex]);

  const progress = useMemo(() => {
    return questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;
  }, [currentQuestionIndex, questions.length]);

  const planConfig = useMemo(() => {
    return activePlan ? PLANS_CONFIG[activePlan] : null;
  }, [activePlan]);

  const isCurrentQuestionAnswered = useMemo(() => {
    return currentQuestion && Boolean(answers[currentQuestion.id]);
  }, [currentQuestion, answers]);

  const navigateToActivation = useCallback((plan) => {
    navigate("/activate", {
      state: {
        planType: plan,
        amount: PLANS_CONFIG[plan]?.total || 0
      }
    });
  }, [navigate]);

  useEffect(() => {
    const checkSurveyStatus = async () => {
      setIsLoading(true);
      
      try {
        let plan = localStorage.getItem(STORAGE_KEYS.ACTIVE_PLAN);
        
        if (!plan || !SURVEY_QUESTIONS[plan]) {
          try {
            const res = await api.get("/auth/me");
            plan = res.data.active_plan;
            
            if (plan && SURVEY_QUESTIONS[plan]) {
              localStorage.setItem(STORAGE_KEYS.ACTIVE_PLAN, plan);
            }
          } catch (apiError) {
            console.error("API error:", apiError);
          }
        }
        
        if (!plan || !SURVEY_QUESTIONS[plan]) {
          plan = "REGULAR";
          localStorage.setItem(STORAGE_KEYS.ACTIVE_PLAN, plan);
        }
        
        setActivePlan(plan);

        try {
          const res = await api.get("/auth/me");
          const userPlan = res.data.plans?.[plan];
          
          if (userPlan?.surveys_completed >= 10) {
            navigateToActivation(plan);
          }
        } catch (e) {
          console.error("Check status error:", e);
        }
        
      } catch (error) {
        console.error("Survey status check failed:", error);
        setActivePlan("REGULAR");
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PLAN, "REGULAR");
      } finally {
        setIsLoading(false);
      }
    };

    checkSurveyStatus();
  }, [navigate, navigateToActivation]);

  const handleOptionSelect = useCallback((questionId, option) => {
    if (isCompleting) return;
    
    setAnswers(prev => ({ ...prev, [questionId]: option }));
    
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
      }, 300);
    }
  }, [currentQuestionIndex, questions.length, isCompleting]);

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

  const submitBatchSurveys = useCallback(async (plan, surveysNeeded, userData, currentCount) => {
    const response = await api.post("/surveys/batch-submit", { 
      plan,
      count: surveysNeeded
    });
    
    setSubmitProgress(80);
    
    const { data } = response;
    console.log(`Submitted ${data.added || surveysNeeded} surveys`);
    
    const newCount = currentCount + surveysNeeded;
    const reward = PLANS_CONFIG[plan]?.total || 0;
    const currentBalance = Number(userData.total_earned || 0);
    
    updateLocalStorageAfterSubmission(userData, plan, newCount, currentBalance, reward);
    
    setSubmitProgress(100);
    
    navigate("/activate", {
      state: {
        planType: plan,
        amount: reward,
        instant: true,
        surveysAdded: data.added || surveysNeeded,
        totalCompleted: data.surveys_completed || newCount
      }
    });
  }, [navigate, updateLocalStorageAfterSubmission]);

  const handleSubmissionError = useCallback((plan) => {
    const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || "{}");
    const currentCount = userData.plans?.[plan]?.surveys_completed || 0;
    const surveysNeeded = Math.max(0, 10 - currentCount);
    const newCount = currentCount + surveysNeeded;
    const reward = PLANS_CONFIG[plan]?.total || 0;
    const currentBalance = Number(userData.total_earned || 0);
    
    updateLocalStorageAfterSubmission(userData, plan, newCount, currentBalance, reward);
    
    navigate("/activate", {
      state: {
        planType: plan,
        amount: reward,
        offline: true
      }
    });
  }, [navigate, updateLocalStorageAfterSubmission]);

  const handleComplete = useCallback(async () => {
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      alert("Please answer all questions before submitting");
      return;
    }
    
    setIsCompleting(true);
    setSubmitProgress(10);

    try {
      const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || "{}");
      const currentCount = userData.plans?.[activePlan]?.surveys_completed || 0;
      
      setSubmitProgress(30);
      
      const surveysNeeded = Math.max(0, 10 - currentCount);
      
      if (surveysNeeded <= 0) {
        navigateToActivation(activePlan);
        return;
      }

      setSubmitProgress(50);
      await submitBatchSurveys(activePlan, surveysNeeded, userData, currentCount);
      
    } catch (error) {
      console.error("Submission failed:", error);
      handleSubmissionError(activePlan);
    }
  }, [activePlan, navigateToActivation, submitBatchSurveys, handleSubmissionError, questions, answers]);

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

  if (isCompleting) {
    return (
      <div className="survey-page">
        <div className="survey-container">
          <div className="survey-header">
            <h1>
              <span className="plan-icon">{planConfig.icon}</span>
              {planConfig.name}
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

  return (
    <div className="survey-page">
      <div className="survey-container">
        <div className="survey-header">
          <h1>
            <span className="plan-icon">{planConfig.icon}</span>
            {planConfig.name}
          </h1>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

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