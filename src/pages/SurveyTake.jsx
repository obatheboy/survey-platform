import { useState, useEffect } from "react";
  import { useNavigate, useParams } from "react-router-dom";
  import { toast } from "react-hot-toast";
  import api from "../api/api";
  import { getHardcodedSurveys } from "../data/surveys";
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

    useEffect(() => {
      loadSurvey();
    }, [surveyId]);

    const loadSurvey = () => {
      try {
        // Use hardcoded surveys — always available, no API dependency
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
    const finalAnswers = { ...answers, [currentQuestion]: selectedAnswer };

    setSubmitting(true);
    try {
      const res = await surveyApi.completeSurvey(surveyId);
      if (res.data.success) {
        toast.success(res.data.message);
        navigate("/dashboard");
      } else {
        setError(res.data.message || "Failed to complete survey");
      }
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error(err.response.data.message);
      } else {
        setError("Failed to submit survey");
      }
    } finally {
      setSubmitting(false);
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