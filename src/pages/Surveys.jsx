import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { surveyApi } from "../api/api";
import { useCurrency } from "../contexts/CurrencyContext.jsx";
import "./Surveys.css";

const CATEGORY_ICONS = {
  "Daily Lifestyle": "🏠",
  "Food and Eating Preferences": "🍽️",
  "Football and Games": "⚽",
  "Safaricom Network Experience": "📶",
  "Equity Bank": "🏦",
  "Communication Habits": "💬"
};

export default function Surveys() {
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    try {
      const [surveysRes, statsRes] = await Promise.all([
        surveyApi.getSurveys(),
        surveyApi.getStats()
      ]);
      setSurveys(surveysRes.data.surveys || []);
      setStats(statsRes.data);
    } catch (err) {
      setError("Failed to load surveys");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSurvey = (survey) => {
    navigate(`/surveys/${survey._id}`);
  };

  if (loading) {
    return (
      <div className="surveys-container">
        <div className="surveys-loading">Loading surveys...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="surveys-container">
        <div className="surveys-error">{error}</div>
        <button onClick={loadSurveys} className="retry-btn">Retry</button>
      </div>
    );
  }

  // Group surveys by category
  const grouped = {};
  surveys.forEach(s => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });

  const categories = Object.keys(grouped);

  return (
    <div className="surveys-container">
      <div className="surveys-header">
        <h1>Available Surveys</h1>
        <p>Complete surveys to earn {format(450)} each</p>
      </div>

      {stats && (
        <div className="surveys-stats">
          <div className="stat-item">
            <span className="stat-value">{stats.total_completed || 0}/{stats.total_surveys || 60}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.remaining_today}/5</span>
            <span className="stat-label">Remaining Today</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{format(stats.total_earnings || 0)}</span>
            <span className="stat-label">Total Earned</span>
          </div>
        </div>
      )}

      <div className="surveys-progress">
        <div
          className="surveys-progress-fill"
          style={{ width: `${((stats?.total_completed || 0) / 60) * 100}%` }}
        />
      </div>

      <div className="surveys-list">
        {categories.map(category => (
          <div key={category} className="survey-category">
            <h2 className="category-title">
              <span className="category-icon">{CATEGORY_ICONS[category] || "📝"}</span>
              {category}
              <span className="category-count">
                ({grouped[category].length} surveys)
              </span>
            </h2>
            <div className="category-surveys">
              {grouped[category].map(survey => (
                <div key={survey._id} className="survey-card">
                  <div className="survey-card-info">
                    <h3>{survey.title}</h3>
                    <div className="survey-meta">
                      <span className="survey-earnings">{format(survey.earnings)}</span>
                      <span className="survey-time">⏱️ {survey.estimatedTime}</span>
                      <span className="survey-questions">📝 {survey.totalQuestions} questions</span>
                    </div>
                  </div>
                  {survey.isCompleted ? (
                    <span className="survey-done-badge">✓ Completed</span>
                  ) : (
                    <button
                      className="survey-start-btn"
                      onClick={() => handleStartSurvey(survey)}
                    >
                      Start →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}