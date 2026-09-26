import { useState, useEffect } from 'react';
import { gamificationApi } from '../../api/api';
import './DailyRewardPopup.css';

const REWARD_ICONS = ['🎁', '💎', '⭐', '🌟', '✨', '🎉', '🏆'];

export default function DailyRewardPopup({ isOpen, onClose, onRewardClaimed }) {
  const [loading, setLoading] = useState(false);
  const [rewardData, setRewardData] = useState(null);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkDailyReward();
    }
  }, [isOpen]);

  const checkDailyReward = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await gamificationApi.checkDailyReward();
      setRewardData(response.data);
    } catch (err) {
      console.error('Error checking daily reward:', err);
      setError('Failed to load daily reward');
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async () => {
    if (!rewardData?.can_claim) return;

    setClaiming(true);
    try {
      const response = await gamificationApi.claimDailyReward();
      const result = response.data;
      
      setShowConfetti(true);
      
      // Show success animation
      setTimeout(() => {
        if (onRewardClaimed) {
          onRewardClaimed(result);
        }
        setShowConfetti(false);
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Error claiming reward:', err);
      setError(err.response?.data?.message || 'Failed to claim reward');
    } finally {
      setClaiming(false);
    }
  };

  const formatTimeLeft = (nextClaimTime) => {
    if (!nextClaimTime) return '';
    
    const now = new Date();
    const next = new Date(nextClaimTime);
    const diff = next - now;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="daily-reward-overlay" onClick={onClose}>
      <div className="daily-reward-popup" onClick={(e) => e.stopPropagation()}>
        {showConfetti && <div className="confetti-container">🎊</div>}
        
        <button className="daily-reward-close" onClick={onClose}>×</button>
        
        <div className="daily-reward-header">
          <h2>🎁 Daily Reward</h2>
          <p>Claim your reward every day to grow your streak!</p>
        </div>

        {loading ? (
          <div className="daily-reward-loading">
            <div className="spinner"></div>
          </div>
        ) : error ? (
          <div className="daily-reward-error">
            <p>{error}</p>
            <button onClick={checkDailyReward}>Try Again</button>
          </div>
        ) : rewardData ? (
          <>
            <div className="daily-reward-streak">
              <div className="streak-flame">🔥</div>
              <div className="streak-info">
                <span className="streak-count">{rewardData.current_streak}</span>
                <span className="streak-label">Day Streak</span>
              </div>
            </div>

            <div className="daily-reward-level">
              <div className="level-badge">Level {rewardData.level}</div>
              <div className="xp-progress">
                <div 
                  className="xp-fill" 
                  style={{ width: `${(rewardData.xp / rewardData.xp_to_next_level) * 100}%` }}
                ></div>
                <span className="xp-text">{rewardData.xp}/{rewardData.xp_to_next_level} XP</span>
              </div>
            </div>

            {rewardData.can_claim ? (
              <div className="daily-reward-claim">
                <div className="reward-amount">
                  <span className="reward-icon">{REWARD_ICONS[rewardData.current_streak % REWARD_ICONS.length]}</span>
                  <span className="reward-value">+{rewardData.next_reward?.reward} KSh</span>
                  <span className="reward-xp">+{rewardData.next_reward?.xp} XP</span>
                </div>
                <button 
                  className="claim-button" 
                  onClick={claimReward}
                  disabled={claiming}
                >
                  {claiming ? 'Claiming...' : '🎉 Claim Now!'}
                </button>
              </div>
            ) : (
              <div className="daily-reward-wait">
                <p>Come back tomorrow to claim your next reward!</p>
                <div className="next-reward-preview">
                  <span>Next: </span>
                  <strong>+{rewardData.next_reward?.reward} KSh</strong>
                </div>
                <div className="timer">
                  ⏰ {formatTimeLeft(rewardData.next_claim_time)}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
