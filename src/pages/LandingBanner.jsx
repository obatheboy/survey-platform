import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingBanner.css";

/* =====================================================
   💰 ENTRANCE BANNER — "How you can earn"
   Shown at "/" for visitors who are not signed in.
   Tapping anywhere (or START NOW) goes to /auth?mode=register.

   Every figure below is taken from the live platform rules so the
   claims stay verifiable:
     - Surveys      : 60 topics, KES 450 each, max 5/day  -> KES 2,250/day
     - Chat Wazungu : KES 500 per unlocked profile, 200 profiles
     - Welcome bonus: KES 1,200 credited once at signup
     - Withdrawal   : from KES 200 to M-Pesa (KE) / MTN+Airtel (UG)
     - Activation   : KES 100
   ===================================================== */

const EARN_METHODS = [
  {
    id: "surveys",
    icon: "📝",
    title: "Complete Surveys",
    text: "60 topics — Safaricom, Equity Bank, food, football and more. Answer a few questions, get paid instantly.",
    tag: "KES 450 each",
    accent: "#06b6d4",
  },
  {
    id: "chat",
    icon: "💬",
    title: "Chat Wazungu",
    text: "Unlock 200 profiles and chat with new people. Every profile you unlock pays you straight away.",
    tag: "KES 500 / unlock",
    accent: "#0DAA65",
  },
  {
    id: "affiliate",
    icon: "👥",
    title: "Refer & Earn",
    text: "Share your link with friends. Keep earning every time someone joins through you.",
    tag: "Unlimited",
    accent: "#ea580c",
  },
  {
    id: "withdraw",
    icon: "💰",
    title: "Withdraw to M-Pesa",
    text: "Cash out from KES 200 directly to your M-Pesa. MTN and Airtel supported in Uganda.",
    tag: "From KES 200",
    accent: "#7c3aed",
  },
];

const PROOF = [
  { value: "KES 450", label: "Per Survey" },
  { value: "KES 2,250", label: "Per Day" },
  { value: "KES 1,200", label: "Welcome Bonus" },
];

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
      {/* Soft glow orbs */}
      <div className="lb-orb lb-orb-1" aria-hidden="true" />
      <div className="lb-orb lb-orb-2" aria-hidden="true" />

      <div className="lb-content">
        {/* Welcome bonus badge */}
        <div className="lb-badge">
          <span className="lb-badge-text">🎁 KES 1,200 WELCOME BONUS</span>
        </div>

        {/* Logo */}
        <div className="lb-logo" aria-hidden="true">
          <span className="lb-logo-text">CW</span>
        </div>

        {/* Headline */}
        <h1 className="lb-headline">
          Turn Your Phone
          <br />
          <span className="lb-headline-accent">Into Real Cash</span>
        </h1>
        <p className="lb-sub">4 simple ways to earn every single day</p>

        {/* How you can earn */}
        <div className="lb-methods">
          {EARN_METHODS.map((m, i) => (
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

        {/* Provable figures — replaces the old "500K+ Users" claim */}
        <div className="lb-proof">
          {PROOF.map((p, i) => (
            <Fragment key={p.label}>
              {i > 0 && <span className="lb-proof-divider" aria-hidden="true" />}
              <div className="lb-proof-item">
                <span className="lb-proof-value">{p.value}</span>
                <span className="lb-proof-label">{p.label}</span>
              </div>
            </Fragment>
          ))}
        </div>

        {/* Trust strip */}
        <div className="lb-trust">
          <span className="lb-trust-chip">🇰🇪 🇺🇬 Kenya & Uganda</span>
          <span className="lb-trust-chip">🔒 Secure payments</span>
        </div>

        {/* CTA */}
        <button
          type="button"
          className="lb-cta"
          onClick={goToRegister}
          aria-label="Start now and create your free account"
        >
          START NOW
        </button>
        <p className="lb-cta-note">Free to join • Takes under a minute</p>

        {/* Tap hint */}
        <p className="lb-tap-hint">👆 Tap anywhere to register</p>
      </div>
    </div>
  );
}