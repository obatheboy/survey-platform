import { useEffect, useState } from 'react';
import { gamificationApi } from '../../api/api';
import './Achievements.css';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🎯' },
  { id: 'surveys', label: 'Surveys', icon: '📝' },
  { id: 'earnings', label: 'Earnings', icon: '💰' },
  { id: 'referrals', label: 'Referrals', icon: '👥' },
  { id: 'streaks', label: 'Streaks', icon: '🔥' },
  { id: 'withdrawals', label: 'Withdrawals', icon: '💳' }
];

const TIER_COLORS = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
  diamond: '#b9f2ff'
};

export default function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const response = await gamificationApi.getAchievements();
      setAchievements(response.data.achievements || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = activeCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === activeCategory);

  const completedCount = achievements.filter(a => a.completed).length;
  const totalCount = achievements.length;

  const getProgress = (achievement) => {
    if (achievement.completed) return 100;
    return Math.min(100, Math.round((achievement.progress / achievement.requirement) * 100));
  };

  return (
    <div className="achievements-container">
      <div className="achievements-header">
        <h3>🏅 Achievements</h3>
        <div className="achievements-progress">
          <span>{completedCount}/{totalCount}</span>
          <div className="achievements-progress-bar">
            <div 
              className="achievements-progress-fill"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="achievements-categories">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`achievement-category-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
            title={cat.label}
          >
            {cat.icon}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="achievements-loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="achievements-grid">
          {filteredAchievements.map((achievement) => (
            <div
              key={achievement._id}
              className={`achievement-card ${achievement.completed ? 'completed' : ''}`}
              style={{ '--tier-color': TIER_COLORS[achievement.tier] }}
            >
              <div className="achievement-icon">
                {achievement.completed ? achievement.icon : '🔒'}
              </div>
              <div className="achievement-info">
                <h4>{achievement.name}</h4>
                <p>{achievement.description}</p>
                <div className="achievement-progress">
                  <div className="achievement-progress-bar">
                    <div 
                      className="achievement-progress-fill"
                      style={{ width: `${getProgress(achievement)}%` }}
                    ></div>
                  </div>
                  <span className="achievement-progress-text">
                    {achievement.progress}/{achievement.requirement}
                  </span>
                </div>
              </div>
              {achievement.completed && (
                <div className="achievement-check">✓</div>
              )}
              <div className="achievement-reward">
                +{achievement.reward_bonus} KSh
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
