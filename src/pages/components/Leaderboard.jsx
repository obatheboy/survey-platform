import { useEffect, useState } from 'react';
import { gamificationApi } from '../../api/api';
import './Leaderboard.css';

const LEADERBOARD_TYPES = [
  { id: 'earnings', label: '💰 Top Earners', icon: '💰' },
  { id: 'surveys', label: '📝 Most Surveys', icon: '📝' },
  { id: 'streaks', label: '🔥 Best Streaks', icon: '🔥' },
  { id: 'referrals', label: '👥 Top Referrers', icon: '👥' }
];

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('earnings');

  useEffect(() => {
    fetchLeaderboard();
  }, [activeType]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await gamificationApi.getLeaderboard(activeType, 10);
      setLeaderboard(response.data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return '';
  };

  const getDisplayValue = (user) => {
    switch (activeType) {
      case 'earnings':
        return `${user.total_earned.toLocaleString()} KSh`;
      case 'surveys':
        return `${user.total_surveys} surveys`;
      case 'streaks':
        return `${user.current_streak} days`;
      case 'referrals':
        return `${user.referrals} referrals`;
      default:
        return '';
    }
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h3>🏆 Leaderboard</h3>
      </div>

      <div className="leaderboard-tabs">
        {LEADERBOARD_TYPES.map((type) => (
          <button
            key={type.id}
            className={`leaderboard-tab ${activeType === type.id ? 'active' : ''}`}
            onClick={() => setActiveType(type.id)}
          >
            {type.icon}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="leaderboard-loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="leaderboard-empty">
          <p>No data available yet</p>
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((user) => (
            <div
              key={user.rank}
              className={`leaderboard-item ${getRankClass(user.rank)} ${user.isCurrentUser ? 'current-user' : ''}`}
            >
              <div className="leaderboard-rank">
                {user.rank <= 3 ? getRankIcon(user.rank) : user.rank}
              </div>
              <div className="leaderboard-info">
                <span className="leaderboard-name">
                  {user.isCurrentUser ? 'You' : user.name}
                  {user.isCurrentUser && <span className="you-badge">You</span>}
                </span>
                <span className="leaderboard-level">Level {user.level}</span>
              </div>
              <div className="leaderboard-value">
                {getDisplayValue(user)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
