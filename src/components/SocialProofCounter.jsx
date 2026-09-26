import { useState, useEffect } from 'react';
import './SocialProofCounter.css';

function AnimatedCounter({ target, duration = 2000, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * target);

      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [target, duration]);

  return (
    <span className="animated-number">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

export default function SocialProofCounter() {
  const [stats, setStats] = useState({
    totalUsers: 15847,
    totalPaid: 12450000,
    activeSurveys: 3421,
    successRate: 98.5
  });

  // Simulate real-time updates (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        totalUsers: prev.totalUsers + Math.floor(Math.random() * 3),
        totalPaid: prev.totalPaid + Math.floor(Math.random() * 5000),
        activeSurveys: prev.activeSurveys + Math.floor(Math.random() * 5) - 2,
        successRate: 98.5
      }));
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="social-proof-container">
      <div className="social-proof-header">
        <h2>🎉 Join Thousands of Happy Earners</h2>
        <p>Real-time platform statistics</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card users">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">
              <AnimatedCounter target={stats.totalUsers} />
            </div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-pulse"></div>
        </div>

        <div className="stat-card earnings">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">
              <AnimatedCounter 
                target={stats.totalPaid} 
                prefix="KES " 
              />
            </div>
            <div className="stat-label">Total Paid Out</div>
          </div>
          <div className="stat-pulse"></div>
        </div>

        <div className="stat-card surveys">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">
              <AnimatedCounter target={stats.activeSurveys} />
            </div>
            <div className="stat-label">Active Surveys Today</div>
          </div>
          <div className="stat-pulse"></div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">
              <AnimatedCounter 
                target={stats.successRate} 
                suffix="%" 
              />
            </div>
            <div className="stat-label">Success Rate</div>
          </div>
          <div className="stat-pulse"></div>
        </div>
      </div>

      <div className="trust-badges">
        <div className="badge">
          <span className="badge-icon">🔒</span>
          <span>Secure Payments</span>
        </div>
        <div className="badge">
          <span className="badge-icon">⚡</span>
          <span>Instant Withdrawals</span>
        </div>
        <div className="badge">
          <span className="badge-icon">🎯</span>
          <span>Verified Platform</span>
        </div>
      </div>
    </div>
  );
}
