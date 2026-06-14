import React from 'react';
import './WelcomeBonusPopup.css';

export default function WelcomeBonusPopup({ isOpen, onClose, onActivate, showMaybeLater = true }) {
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
            <h2>Activate Your Welcome Bonus!</h2>
            <p>Pay KES 100 and get extra earnings</p>
          </div>

          <div className="welcome-bonus-message" style={{ fontSize: '14px', marginBottom: '20px' }}>
            Welcome Bonus gives you additional earning opportunities. 
            <span className="highlight-text">It's optional and doesn't affect account activation.</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button 
              className="welcome-bonus-button" 
              onClick={() => {
                if (onActivate) {
                  onActivate();
                }
                onClose();
              }}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              <span className="button-content">
                <span className="button-icon">⚡</span>
                <span className="button-text">Activate Now</span>
              </span>
            </button>

            {showMaybeLater && (
              <button 
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Maybe Later
              </button>
            )}
          </div>

          <div className="welcome-bonus-features">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Optional</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>KES 100</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Extra Earnings</span>
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
