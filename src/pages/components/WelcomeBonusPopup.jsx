import React from 'react';
import './WelcomeBonusPopup.css';

export default function WelcomeBonusPopup({ isOpen, onClose, onActivate }) {
  if (!isOpen) return null;

  return (
    <div className="welcome-bonus-overlay" onClick={onClose}>
      <div className="welcome-bonus-popup" onClick={(e) => e.stopPropagation()}>
        <button className="welcome-bonus-close" onClick={onClose}>×</button>
        
        <div className="welcome-bonus-content">
          <div className="welcome-bonus-header">
            <div className="bonus-icon-wrapper">
              <div className="welcome-bonus-icon">🎉</div>
            </div>
            <h2>Congratulations!</h2>
            <p>You have received KES 1,200 welcome bonus for joining our platform</p>
          </div>

          <div className="welcome-bonus-amount">
            <div className="bonus-amount-inner">
              <div className="welcome-bonus-label">Welcome Bonus Earned</div>
              <div className="welcome-bonus-value">
                KES 1,200
              </div>
            </div>
          </div>

          <div className="welcome-bonus-message">
            <span className="highlight-text">Pay only KES 100 to unlock and withdraw!</span>
            <br />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
              Instant activation - Your bonus is ready!
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button 
              className="welcome-bonus-button activate-btn"
              onClick={() => {
                if (onActivate) {
                  onActivate();
                }
                onClose();
              }}
            >
              <span className="button-content">
                <span className="button-icon">⚡</span>
                <span className="button-text">Activate Now</span>
              </span>
            </button>

            <button 
              onClick={onClose}
              className="welcome-bonus-button later-btn"
            >
              <span className="button-text">Maybe Later</span>
            </button>
          </div>

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
              <span>Secure</span>
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