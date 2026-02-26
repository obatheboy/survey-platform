import { useEffect } from 'react';
import './WelcomeBonusPopup.css';

export default function WelcomeBonusPopup({ isOpen, onClose, bonusAmount = 1200, onActivate }) {
  useEffect(() => {
    if (isOpen) {
      // Auto-close confetti after 3 seconds
      const timer = setTimeout(() => {
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="welcome-bonus-overlay" onClick={onClose}>
      <div className="welcome-bonus-popup" onClick={(e) => e.stopPropagation()}>
        {/* Sparkles decoration */}
        <div className="welcome-bonus-sparkles">
          <span className="sparkle">✨</span>
          <span className="sparkle">⭐</span>
          <span className="sparkle">✨</span>
          <span className="sparkle">⭐</span>
        </div>

        <button className="welcome-bonus-close" onClick={onClose}>×</button>
        
        <div className="welcome-bonus-header">
          <div className="welcome-bonus-icon">🎉</div>
          <h2>Welcome Bonus Unlocked!</h2>
          <p>Congratulations on joining our platform!</p>
        </div>

        <div className="welcome-bonus-amount">
          <div className="welcome-bonus-label">Your Welcome Bonus</div>
          <div className="welcome-bonus-value">
            <span>KSh </span>{bonusAmount.toLocaleString()}
          </div>
        </div>

        <div className="welcome-bonus-message">
          You've successfully received your welcome bonus of <strong>KSh {bonusAmount.toLocaleString()}</strong>! 
          <br /><br />
          <strong>Now activate your account to withdraw!</strong>
        </div>

        <button 
          className="welcome-bonus-button" 
          onClick={() => {
            if (onActivate) {
              onActivate();
            } else {
              onClose();
            }
          }}
        >
          🚀 Activate to Withdraw
        </button>

        <div className="welcome-bonus-note">
          Click anywhere outside to close
        </div>
      </div>
    </div>
  );
}
