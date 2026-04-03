import React from 'react';
import './WelcomeBonusPopup.css';

export default function WelcomeBonusPopup({ isOpen, onClose, bonusAmount = 1200, onActivate }) {
  if (!isOpen) return null;

  return (
    <div className="welcome-bonus-overlay" onClick={onClose}>
      <div className="welcome-bonus-popup" onClick={(e) => e.stopPropagation()}>
        <button className="welcome-bonus-close" onClick={onClose}>×</button>
        
        <div className="welcome-bonus-content">
          <div className="welcome-bonus-header">
            <div className="bonus-icon-wrapper">
              <div className="welcome-bonus-icon">🎉</div>
              <div className="icon-ring"></div>
            </div>
            <h2>Welcome Bonus!</h2>
            <p>Congratulations for joining our company!</p>
          </div>

          <div className="welcome-bonus-amount">
            <div className="bonus-amount-inner">
              <div className="welcome-bonus-label">Your Welcome Bonus Is</div>
              <div className="welcome-bonus-value">
                <span>KSh </span>{bonusAmount.toLocaleString()}
              </div>
              <div className="bonus-coin coin-1">🪙</div>
              <div className="bonus-coin coin-2">💎</div>
            </div>
          </div>

          <div className="welcome-bonus-message">
            You haveReceived <strong>KSh {bonusAmount.toLocaleString()}</strong>   -
            <span className="highlight-text">Activate to withdraw!</span>
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
            <span className="button-content">
              <span className="button-icon">🚀</span>
            <span className="button-text">Activate to Withdraw</span>
            </span>
          </button>

          <div className="welcome-bonus-features">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Instant</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Easy</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Earn</span>
            </div>
          </div>

          <div className="welcome-bonus-note">
            Tap anywhere outside to close
          </div>
        </div>
      </div>
    </div>
  );
}
