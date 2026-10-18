import React from 'react';
import './ActivatePlansPopup.css';

const PLAN_META = {
  REGULAR: { icon: '⭐', label: 'REGULAR SURVEYS', fee: 100, color: '#1f7405' },
  VIP:     { icon: '💎', label: 'VIP SURVEY',     fee: 200, color: '#7c3aed' },
  VVIP:    { icon: '👑', label: 'VVIP SURVEYS',   fee: 300, color: '#ff6b6b' },
};

export default function ActivatePlansPopup({ isOpen, onClose, onActivate, remainingPlans }) {
  if (!isOpen) return null;

  const plans = remainingPlans && remainingPlans.length
    ? remainingPlans.map((p) => PLAN_META[p] || PLAN_META[p.toUpperCase()])
    : [PLAN_META.REGULAR, PLAN_META.VIP, PLAN_META.VVIP];

  const totalFee = plans.reduce((sum, p) => sum + p.fee, 0);

  const handleActivate = () => {
    if (onActivate) onActivate();
    onClose();
  };

  return (
    <div className="activate-overlay" onClick={onClose}>
      <div className="activate-popup" onClick={(e) => e.stopPropagation()}>
        <button className="activate-close" onClick={onClose} aria-label="Close">×</button>

        <div className="activate-glow" />

        <div className="activate-header">
          <div className="activate-icon-ring">
            <span className="activate-icon-main">🚀</span>
          </div>
          <h2 className="activate-title">You're on a roll!</h2>
          <p className="activate-subtitle">
            You've unlocked the platform. Keep the momentum — activate your remaining plans and earn more.
          </p>
        </div>

        <div className="activate-plans">
          {plans.map((plan) => (
            <div className="activate-plan-row" key={plan.label}>
              <span className="activate-plan-icon" style={{ color: plan.color }}>{plan.icon}</span>
              <div className="activate-plan-info">
                <span className="activate-plan-label">{plan.label}</span>
                <span className="activate-plan-fee">KES {plan.fee}</span>
              </div>
              <span className="activate-plan-badge">Activate</span>
            </div>
          ))}
        </div>

        <div className="activate-total">
          <span>Total activation</span>
          <strong>KES {totalFee}</strong>
        </div>

        <button className="activate-btn" onClick={handleActivate}>
          <span className="activate-btn-content">
            <span>⚡</span>
            <span>Activate Now</span>
          </span>
        </button>

        <p className="activate-hint">Tap anywhere outside to dismiss</p>
      </div>
    </div>
  );
}