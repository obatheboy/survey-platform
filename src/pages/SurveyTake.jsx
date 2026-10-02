import { useState, useEffect } from "react";
  import { useNavigate, useParams } from "react-router-dom";
  import { toast } from "react-hot-toast";
  import { getHardcodedSurveys } from "../data/surveys";
import { SURVEY_EARNINGS } from "../constants/fees";
  import { markSurveyCompleted, getDailySurveyCount } from "../utils/surveyCompletion";
import { surveyApi } from "../api/api";
  import { useCurrency } from "../contexts/CurrencyContext.jsx";
  import "./SurveyTake.css";

  export default function SurveyTake() {
    const { surveyId } = useParams();
    const { format } = useCurrency();
    const navigate = useNavigate();

    const [survey, setSurvey] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const SURVEY_DAILY_LIMIT = 5;

    useEffect(() => {
      loadSurvey();
    }, [surveyId]);

    const loadSurvey = () => {
      try {
        const allSurveys = getHardcodedSurveys();
        const found = allSurveys.find(s => s._id === surveyId);
        if (found) {
          setSurvey(found);
        } else {
          setError("Survey not found");
        }
      } catch (err) {
        setError("Failed to load survey");
      } finally {
        setLoading(false);
      }
    };

    const handleAnswerSelect = (optionIndex) => {
      setSelectedAnswer(optionIndex);
    };

    const handleNext = () => {
      if (selectedAnswer === null) {
        toast.error("Please select an answer");
        return;
      }
      setAnswers(prev => ({ ...prev, [currentQuestion]: selectedAnswer }));
      setSelectedAnswer(null);
      setCurrentQuestion(prev => prev + 1);
    };

    const handlePrevious = () => {
      setCurrentQuestion(prev => prev - 1);
      setSelectedAnswer(answers[currentQuestion - 1] ?? null);
    };

  const handleSubmit = async () => {
    if (selectedAnswer === null) {
      toast.error("Please select an answer");
      return;
    }

    // Check daily limit
    const dailyCount = getDailySurveyCount();
    if (dailyCount >= SURVEY_DAILY_LIMIT) {
      toast.error("Daily limit reached - come back tomorrow");
      return;
    }

    setSubmitting(true);

    // Record the completion on the server. This is what actually credits the
    // KES 75 to the user's balance, so it must succeed before we show success
    // and before we write to localStorage.
    try {
      const res = await surveyApi.completeSurvey(surveyId);
      const earned = res.data?.earnings ?? SURVEY_EARNINGS;

      // Keep the local mirror in sync for the dashboard UI and daily limit.
      markSurveyCompleted(surveyId);

      toast.success(`Survey completed! Earned ${format(earned)}`);
      setTimeout(() => {
        setSubmitting(false);
        navigate("/dashboard");
      }, 600);
    } catch (err) {
      setSubmitting(false);
      const message = err.response?.data?.message || "Could not record your survey. Please try again.";
      toast.error(message);
    }
  };

    if (loading) {
      return (
        <div className="survey-take-container">
          <div className="survey-take-loading">Loading survey...</div>
        </div>
      );
    }

    if (error || !survey) {
      return (
        <div className="survey-take-container">
          <div className="survey-take-error">{error || "Survey not found"}</div>
          <button className="survey-take-back" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </button>
        </div>
      );
    }

    const questions = survey.questions || [];
    const totalQuestions = questions.length;
    const progress = ((currentQuestion + 1) / totalQuestions) * 100;
    const question = questions[currentQuestion];

    return (
      <div className="survey-take-container">
        <div className="survey-take-header">
          <button className="survey-take-back" onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
          <div className="survey-take-info">
            <h2>{survey.title}</h2>
            <span className="survey-take-earnings">Earn {format(survey.earnings)}</span>
          </div>
        </div>

        <div className="survey-take-progress">
          <div className="survey-take-progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="survey-take-progress-text">
          Question {currentQuestion + 1} of {totalQuestions}
        </div>

        <div className="survey-take-question">
          <h3>{question.question}</h3>
          <div className="survey-take-options">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                className={`survey-take-option ${selectedAnswer === idx ? "selected" : ""}`}
                onClick={() => handleAnswerSelect(idx)}
              >
                <span className="survey-take-option-letter">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="survey-take-option-text">{option}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="survey-take-nav">
          {currentQuestion > 0 && (
            <button className="survey-take-btn secondary" onClick={handlePrevious}>
              ← Previous
            </button>
          )}
          <div className="survey-take-spacer"></div>
          {currentQuestion < totalQuestions - 1 ? (
            <button className="survey-take-btn primary" onClick={handleNext}>
              Next →
            </button>
          ) : (
            <button
              className="survey-take-btn primary"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Survey"}
            </button>
          )}
        </div>
      </div>
    );
  }