import { useEffect, useMemo } from 'react';
import './WelcomeBonusPopup.css';

// Predefined particle configurations for consistent rendering
const PARTICLE_CONFIG = [
  { id: 1, x: 5, delay: 0.2, duration: 4, size: 10 },
  { id: 2, x: 15, delay: 1.5, duration: 3.5, size: 8 },
  { id: 3, x: 25, delay: 0.8, duration: 5, size: 12 },
  { id: 4, x: 35, delay: 2.1, duration: 4.2, size: 9 },
  { id: 5, x: 45, delay: 0.5, duration: 3.8, size: 11 },
  { id: 6, x: 55, delay: 1.8, duration: 4.5, size: 8 },
  { id: 7, x: 65, delay: 0.3, duration: 3.2, size: 14 },
  { id: 8, x: 75, delay: 2.5, duration: 4.8, size: 10 },
  { id: 9, x: 85, delay: 1.2, duration: 3.6, size: 9 },
  { id: 10, x: 95, delay: 0.9, duration: 5.2, size: 12 },
  { id: 11, x: 10, delay: 3.1, duration: 4.1, size: 11 },
  { id: 12, x: 20, delay: 2.8, duration: 3.4, size: 8 },
  { id: 13, x: 30, delay: 1.6, duration: 4.9, size: 13 },
  { id: 14, x: 40, delay: 0.4, duration: 3.7, size: 10 },
  { id: 15, x: 50, delay: 2.2, duration: 4.3, size: 9 },
  { id: 16, x: 60, delay: 1.1, duration: 5.1, size: 12 },
  { id: 17, x: 70, delay: 3.5, duration: 3.9, size: 8 },
  { id: 18, x: 80, delay: 0.7, duration: 4.6, size: 11 },
  { id: 19, x: 90, delay: 2.9, duration: 3.3, size: 10 },
  { id: 20, x: 8, delay: 1.9, duration: 4.7, size: 9 },
];

export default function WelcomeBonusPopup({ isOpen, onClose, bonusAmount = 1200, onActivate }) {
  // Memoize particles to avoid recalculation
  const particles = useMemo(() => PARTICLE_CONFIG, []);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="welcome-bonus-overlay active" onClick={onClose}>
      <div className="welcome-bonus-popup show" onClick={(e) => e.stopPropagation()}>
        {/* Animated particles background */}
        <div className="bonus-particles">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="particle"
              style={{
                left: `${particle.x}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
                width: particle.size,
                height: particle.size,
              }}
            />
          ))}
        </div>

        {/* Glow effects */}
        <div className="bonus-glow bonus-glow-1"></div>
        <div className="bonus-glow bonus-glow-2"></div>

        {/* Sparkles decoration */}
        <div className="welcome-bonus-sparkles">
          <span className="sparkle sparkle-1">✨</span>
          <span className="sparkle sparkle-2">⭐</span>
          <span className="sparkle sparkle-3">💫</span>
          <span className="sparkle sparkle-4">✨</span>
          <span className="sparkle sparkle-5">⭐</span>
          <span className="sparkle sparkle-6">💫</span>
        </div>

        <button className="welcome-bonus-close" onClick={onClose}>×</button>
        
        <div className="welcome-bonus-content">
          <div className="welcome-bonus-header">
            <div className="bonus-icon-wrapper">
              <div className="welcome-bonus-icon">🎉</div>
              <div className="icon-ring"></div>
            </div>
            <h2>Welcome Bonus Unlocked!</h2>
            <p>Congratulations on joining our platform!</p>
          </div>

          <div className="welcome-bonus-amount">
            <div className="bonus-amount-inner">
              <div className="welcome-bonus-label">Your Welcome Bonus</div>
              <div className="welcome-bonus-value">
                <span>KSh </span>{bonusAmount.toLocaleString()}
              </div>
              <div className="bonus-coin coin-1">🪙</div>
              <div className="bonus-coin coin-2">💎</div>
            </div>
          </div>

          <div className="welcome-bonus-message">
            You've successfully received your welcome bonus of <strong>KSh {bonusAmount.toLocaleString()}</strong>! 
            <br /><br />
            <span className="highlight-text">Now activate your account to withdraw!</span>
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
            <span className="button-shine"></span>
          </button>

          <div className="welcome-bonus-features">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Instant Bonus</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Easy Activation</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span>Start Earning</span>
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
