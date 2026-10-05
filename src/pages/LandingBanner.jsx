import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import "./LandingBanner.css";

/* =====================================================
   💰 ENTRANCE BANNER — "How you can earn"
   Shown at "/" so every new visitor lands here first.
   Tapping anywhere (or START NOW) goes to /auth?mode=register.

   Deliberately has NO auth check: it renders for everyone,
   including signed-in members who tap the link again.

   NO EARNING AMOUNTS ARE SHOWN. The banner says the user will earn
   but never quotes a figure. Per-survey values live in-app and can
   change, so publishing them here risks a promise the platform does
   not keep. The only money shown is what the user PAYS: the KES 96
   activation fee, and the KES 200 minimum withdrawal.
   ===================================================== */

const EARN_METHODS = [
  {
    id: "surveys",
    icon: "📝",
    title: "Complete Surveys",
    text: "60 topics — Safaricom, Equity Bank, food, football and more. Answer a few questions, get paid instantly.",
    tag: "Paid daily",
    accent: "#06b6d4",
  },
  {
    id: "chat",
    icon: "💬",
    title: "Chat Wazungu",
    text: "Unlock 200 profiles and chat with new people. Every profile you unlock pays you straight away.",
    tag: "Per unlock",
    accent: "#0DAA65",
  },
  {
    id: "affiliate",
    icon: "👥",
    title: "Affiliate Program",
    text: "Invite friends and build your team. Earn commissions on every unlock and survey completion.",
    tag: "Up to KES 3,000/day",
    accent: "#ea580c",
  },
  {
    id: "withdraw",
    icon: "💰",
    title: "Withdraw to M-Pesa",
    text: "Cash out straight to your M-Pesa once you reach the minimum balance. MTN and Airtel supported in Uganda.",
    tag: "M-Pesa",
    accent: "#7c3aed",
  },
];

/* No figures on the banner. It says the user will earn, without promising
   specific amounts - the exact per-survey values are discovered in-app and
   can change, so stating them here risks a promise the platform doesn't keep. */
const PROOF = [
  { value: "SURVEYS", label: "Every Day" },
  { value: "BONUS", label: "On Signup" },
  { value: "AFFILIATE", label: "Up to 3K/day" },
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
          <span className="lb-badge-text">🎁 WELCOME BONUS INCLUDED</span>
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

        {/* What you can earn - deliberately no figures */}
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