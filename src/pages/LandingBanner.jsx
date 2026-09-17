import { useNavigate } from "react-router-dom";

export default function LandingBanner() {
  const navigate = useNavigate();

  const handleStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = "/auth?mode=register";
  };

  return (
    <div style={styles.page} onClick={handleStart}>
      {/* Animated background orbs */}
      <div style={styles.orb1}></div>
      <div style={styles.orb2}></div>
      <div style={styles.orb3}></div>

      <div style={styles.content}>
         {/* Trust badge */}
        <div style={styles.trustBadge}>
          <span style={styles.trustBadgeIcon}>⚡</span>
           <span style={styles.trustBadgeText}>3 Ways to Earn • KES 6,500/day</span>
        </div>

        {/* Logo */}
        <div style={styles.logoContainer}>
          <span style={styles.logoText}>CW</span>
        </div>

        {/* Main headline */}
         <h1 style={styles.headline}>
          ChatWazungu
          <br />
          <span style={styles.headlineAccent}>Multiple Ways to Earn</span>
        </h1>

        {/* Earnings caption - center */}
        <div style={styles.earningsCaption}>
          <span style={styles.earningsCaptionIcon}>💸</span>
          <span style={styles.earningsCaptionText}>Surveys • Chat • Affiliate</span>
        </div>

        {/* Subheadline */}
        <p style={styles.subheadline}>
          One app. Three earning paths. Register with phone + name now.
        </p>

        {/* Earning options grid */}
        <div style={styles.earnOptions}>
          <div style={styles.earnOption}>
            <span style={styles.earnOptionIcon}>📊</span>
            <span style={styles.earnOptionText}>Surveys — up to KES 6,500/day</span>
          </div>
          <div style={styles.earnOption}>
            <span style={styles.earnOptionIcon}>💬</span>
            <span style={styles.earnOptionText}>Chat Wazungu — up to KES 5,500/day</span>
          </div>
          <div style={styles.earnOption}>
            <span style={styles.earnOptionIcon}>👥</span>
            <span style={styles.earnOptionText}>Affiliate — endless commissions</span>
          </div>
        </div>

        {/* Stats row */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>🌍</span>
            <span style={styles.statLabel}>500K+ Users</span>
          </div>
          <div style={styles.statDivider}></div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>🎁</span>
            <span style={styles.statLabel}>KES 1,200 Bonus</span>
          </div>
          <div style={styles.statDivider}></div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>🔓</span>
            <span style={styles.statLabel}>KES 99 Unlock</span>
          </div>
        </div>

        {/* Benefits - compact */}
        <div style={styles.benefits}>
          <div style={styles.benefit}>
            <span style={styles.benefitIcon}>💰</span>
            <span style={styles.benefitText}>Instant Withdrawals</span>
          </div>
          <div style={styles.benefit}>
            <span style={styles.benefitIcon}>🔒</span>
            <span style={styles.benefitText}>Secure</span>
          </div>
          <div style={styles.benefit}>
            <span style={styles.benefitIcon}>📱</span>
            <span style={styles.benefitText}>Mobile App</span>
          </div>
        </div>

        {/* CTA - centered and prominent */}
        <div style={styles.ctaContainer}>
          <button style={styles.ctaButton} onClick={handleStart}>
            START NOW 🚀
          </button>
          <p style={styles.ctaNote}>
            Free to join • KES 1,200 welcome bonus
          </p>
        </div>

        {/* Tap hint */}
        <p style={styles.tapHint}>
          👆 Tap anywhere to continue
        </p>

        {/* Trust indicators */}
        <div style={styles.trustRow}>
          <div style={styles.trustItem}>
            <span style={styles.trustIcon}>🛡️</span>
            <span>Verified Platform</span>
          </div>
          <div style={styles.trustItem}>
            <span style={styles.trustIcon}>💸</span>
            <span>Fast Payments</span>
          </div>
          <div style={styles.trustItem}>
            <span style={styles.trustIcon}>⭐</span>
            <span>Top Rated</span>
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; width: 100%; margin: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

        @keyframes float-orb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -40px) scale(1.1); }
          50% { transform: translate(-20px, -20px) scale(0.9); }
          75% { transform: translate(-30px, 20px) scale(1.05); }
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 8px 32px rgba(124, 58, 237, 0.4); }
          50% { box-shadow: 0 12px 48px rgba(6, 182, 212, 0.6); }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    height: "100vh",
    background: "linear-gradient(135deg, #0f0a1a 0%, #1a1128 50%, #0f0a1a 100%)",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  orb1: {
    position: "absolute",
    top: "10%",
    right: "-10%",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, transparent 70%)",
    animation: "float-orb 8s ease-in-out infinite",
    pointerEvents: "none",
  },
  orb2: {
    position: "absolute",
    bottom: "20%",
    left: "-10%",
    width: "250px",
    height: "250px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, transparent 70%)",
    animation: "float-orb 10s ease-in-out infinite reverse",
    pointerEvents: "none",
  },
  orb3: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255, 107, 107, 0.15) 0%, transparent 70%)",
    animation: "float-orb 12s ease-in-out infinite",
    pointerEvents: "none",
  },
  content: {
    width: "100%",
    maxWidth: "400px",
    padding: "20px 16px 32px",
    position: "relative",
    zIndex: 2,
    textAlign: "center",
    animation: "fadeInUp 0.6s ease-out",
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "64px",
    height: "64px",
    margin: "0 auto 20px",
    background: "linear-gradient(135deg, #0DAA65 0%, #0A0A0A 100%)",
    borderRadius: "18px",
    boxShadow: "0 8px 32px rgba(13, 170, 101, 0.4)",
  },
  logoText: {
    fontSize: "28px",
    fontWeight: "900",
    color: "white",
    letterSpacing: "1px",
  },
  trustBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(13, 170, 101, 0.15)",
    border: "1px solid rgba(13, 170, 101, 0.3)",
    padding: "8px 18px",
    borderRadius: "30px",
    fontSize: "12px",
    fontWeight: "700",
    color: "#c4b5fd",
    marginBottom: "12px",
    backdropFilter: "blur(10px)",
    letterSpacing: "0.3px",
  },
  trustBadgeIcon: {
    fontSize: "14px",
  },
  trustBadgeText: {
    background: "linear-gradient(90deg, #c4b5fd, #67e8f9)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  earningsBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)",
    border: "1px solid rgba(124, 58, 237, 0.4)",
    padding: "10px 22px",
    borderRadius: "30px",
    fontSize: "14px",
    fontWeight: "800",
    color: "#fff",
    marginBottom: "20px",
    backdropFilter: "blur(10px)",
    boxShadow: "0 0 24px rgba(124, 58, 237, 0.3)",
    letterSpacing: "0.3px",
  },
  earningsIcon: {
    fontSize: "18px",
  },
  earningsText: {
    background: "linear-gradient(90deg, #ff7a7a, #ffd700)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontWeight: "900",
  },
  earningsCaption: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    background: "linear-gradient(135deg, rgba(124, 58, 237, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%)",
    border: "1px solid rgba(124, 58, 237, 0.5)",
    padding: "14px 28px",
    borderRadius: "30px",
    fontSize: "16px",
    fontWeight: "800",
    color: "#fff",
    marginBottom: "24px",
    backdropFilter: "blur(10px)",
    boxShadow: "0 0 32px rgba(124, 58, 237, 0.4)",
    letterSpacing: "0.3px",
    animation: "pulse-glow 3s ease-in-out infinite",
  },
  earningsCaptionIcon: {
    fontSize: "22px",
  },
  earningsCaptionText: {
    background: "linear-gradient(90deg, #ff7a7a, #ffd700)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    fontWeight: "900",
  },
  headline: {
    fontSize: "38px",
    fontWeight: "900",
    color: "#fff",
    lineHeight: "1.15",
    marginBottom: "16px",
    textShadow: "0 4px 24px rgba(0,0,0,0.4)",
    letterSpacing: "-1px",
  },
  headlineAccent: {
    background: "linear-gradient(90deg, #06b6d4, #7c3aed)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  subheadline: {
    fontSize: "15px",
    color: "rgba(255,255,255,0.8)",
    lineHeight: "1.6",
    marginBottom: "28px",
    maxWidth: "340px",
    marginLeft: "auto",
    marginRight: "auto",
    textShadow: "0 1px 4px rgba(0,0,0,0.3)",
  },
  statsRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    marginBottom: "24px",
    padding: "16px 12px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "20px",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    flex: 1,
  },
  statNumber: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#fff",
    textShadow: "0 2px 8px rgba(0,0,0,0.3)",
  },
  statLabel: {
    fontSize: "10px",
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statDivider: {
    width: "1px",
    height: "32px",
    background: "rgba(255,255,255,0.15)",
  },
  earnOptions: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "24px",
    maxWidth: "360px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  earnOption: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(13, 170, 101, 0.3)",
    borderRadius: "16px",
    padding: "14px 18px",
    backdropFilter: "blur(8px)",
  },
  earnOptionIcon: {
    fontSize: "22px",
  },
  earnOptionText: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#fff",
  },
  benefits: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginBottom: "28px",
    maxWidth: "360px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  benefit: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#fff",
    fontWeight: "600",
    padding: "12px",
    background: "rgba(255,255,255,0.08)",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(8px)",
    transition: "all 0.3s ease",
  },
  benefitIcon: {
    fontSize: "18px",
    flexShrink: 0,
  },
  benefitText: {
    textShadow: "0 1px 3px rgba(0,0,0,0.2)",
  },
  ctaButton: {
    background: "linear-gradient(135deg, #0DAA65 0%, #1a8d55 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "20px",
    padding: "20px 48px",
    fontSize: "18px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 8px 32px rgba(13, 170, 101, 0.5)",
    letterSpacing: "0.5px",
    width: "100%",
    maxWidth: "340px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    animation: "pulse-glow 3s ease-in-out infinite",
    transition: "transform 0.2s",
  },
  ctaArrow: {
    fontSize: "20px",
    fontWeight: "400",
  },
  ctaNote: {
    marginTop: "12px",
    fontSize: "12px",
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
    letterSpacing: "0.3px",
  },
  tapHint: {
    marginTop: "16px",
    fontSize: "11px",
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
    letterSpacing: "0.5px",
    animation: "fadeInUp 1s ease-out 0.5s both",
  },
  trustRow: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "24px",
  },
  trustItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
    padding: "6px 14px",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  trustIcon: {
    fontSize: "14px",
  },
};
