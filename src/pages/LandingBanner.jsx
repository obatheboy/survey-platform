import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingBanner.css";

export default function LandingBanner() {
  const navigate = useNavigate();

  const goToRegister = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate("/auth?mode=register");
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate("/auth?mode=register");
    }
  };

  return (
    <div
      className="lb-page"
      onClick={goToRegister}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Start earning. Tap to register."
    >
      {/* Animated background orbs */}
      <div className="lb-orb lb-orb-1" aria-hidden="true" />
      <div className="lb-orb lb-orb-2" aria-hidden="true" />

      <div className="lb-content">
        {/* Headline */}
        <h1 className="lb-headline">
          Transform Your Digital Presence
          <br />
          <span className="lb-headline-accent">Into An Income</span>
        </h1>

        <p className="lb-sub">
          Start now and make <strong style={{ color: "#fbbf24", fontWeight: 900, fontSize: "18px" }}>KES 500 – 3,500 daily</strong> by completing simple tasks.
        </p>

        {/* CTA near top */}
        <button
          type="button"
          className="lb-cta"
          onClick={goToRegister}
          aria-label="Start now and create your free account"
        >
          START NOW
        </button>
        <p className="lb-cta-note">Easier to join • Takes under a minute</p>

        {/* Earning methods */}
        <div className="lb-methods">
          {[
            { id: "surveys", icon: "📝", title: "Complete Surveys", tag: "Paid daily", accent: "#06b6d4", text: "60 topics — Safaricom, Equity Bank, food, football and more. Answer a few questions, get paid instantly." },
            { id: "chat", icon: "💬", title: "Chat Wazungu", tag: "Per unlock", accent: "#0DAA65", text: "Unlock 200 profiles and chat with new people. Every profile you unlock pays you straight away." },
            { id: "affiliate", icon: "👥", title: "Affiliate Program", tag: "Earn commissions", accent: "#ea580c", text: "Invite friends and build your team. Earn commissions on every unlock and survey completion." },
            { id: "withdraw", icon: "💰", title: "Withdraw to M-Pesa", tag: "M-Pesa", accent: "#7c3aed", text: "Cash out straight to your M-Pesa once you reach the minimum balance. MTN and Airtel supported in Uganda." },
          ].map((m, i) => (
            <div
              key={m.id}
              className="lb-method"
              style={{ animationDelay: `${0.12 + i * 0.09}s` }}
            >
              <span className="lb-method-icon" style={{ background: m.accent }}>
                {m.icon}
              </span>
              <div className="lb-method-body">
                <div className="lb-method-head">
                  <span className="lb-method-title">{m.title}</span>
                  <span className="lb-method-tag" style={{ color: m.accent }}>
                    {m.tag}
                  </span>
                </div>
                <span className="lb-method-text">{m.text}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Task type pills */}
        <div className="lb-proof">
          {["AFFILIATE MARKETING", "SURVEYS", "AI TRAINING", "TRANSCRIPTION", "ONLINE WRITING"].map((label, i) => (
            <Fragment key={label}>
              {i > 0 && <span className="lb-proof-divider" aria-hidden="true" />}
              <span className="lb-proof-pill">{label}</span>
            </Fragment>
          ))}
        </div>

        {/* Trust strip */}
        <div className="lb-trust">
          <span className="lb-trust-chip">🇰🇪 🇺🇬 Kenya & Uganda</span>
          <span className="lb-trust-chip">🔒 Secure payments</span>
        </div>

        {/* Tap hint */}
        <p className="lb-tap-hint">👆 Tap anywhere to register</p>
      </div>
    </div>
  );
}