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
          <span style={styles.trustBadgeText}>3 Ways to Earn • KES 6,500/day</span>
        </div>

        {/* Logo */}
        <div style={styles.logoContainer}>
          <span style={styles.logoText}>CW</span>
        </div>

        {/* Main headline */}
        <h1 style={styles.headline}>
          LEGIT APP
          <br />
          <span style={styles.headlineAccent}>Multiple Ways to Earn</span>
        </h1>

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

        {/* Small enticing caption */}
        <p style={styles.subheadline}>
          Make up to KES 6,500 today by completing simple tasks:
          <br />
          📊 Complete surveys · 💬 Chat with wazungu · 👥 Refer friends
        </p>

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
            <span style={styles.statNumber}>⚡</span>
            <span style={styles.statLabel}>Instant Withdraw</span>
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

        {/* CTA - centered and bold */}
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
      </div>

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
    padding: "16px 14px 24px",
    position: "relative",
    zIndex: 2,
    textAlign: "center",
    animation: "fadeInUp 0.6s ease-out",
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "56px",
    height: "56px",
    margin: "0 auto 16px",
    background: "linear-gradient(135deg, #0DAA65 0%, #0A0A0A 100%)",
    borderRadius: "16px",
    boxShadow: "0 8px 32px rgba(13, 170, 101, 0.4)",
  },
  logoText: {
    fontSize: "24px",
    fontWeight: "900",
    color: "white",
    letterSpacing: "1px",
  },
  trustBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(13, 170, 101, 0.15)",
    border: "1px solid rgba(13, 170, 101, 0.3)",
    padding: "6px 16px",
    borderRadius: "24px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#c4b5fd",
    marginBottom: "10px",
    backdropFilter: "blur(10px)",
    letterSpacing: "0.3px",
  },
  trustBadgeText: {
    background: "linear-gradient(90deg, #c4b5fd, #67e8f9)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  headline: {
    fontSize: "26px",
    fontWeight: "900",
    color: "#fff",
    lineHeight: "1.1",
    marginBottom: "10px",
    textShadow: "0 2px 12px rgba(0,0,0,0.4)",
  },
  headlineAccent: {
    background: "linear-gradient(90deg, #06b6d4, #7c3aed)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  earnOptions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "16px",
    maxWidth: "360px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  earnOption: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(13, 170, 101, 0.25)",
    borderRadius: "12px",
    padding: "10px 14px",
    backdropFilter: "blur(6px)",
  },
  earnOptionIcon: {
    fontSize: "20px",
  },
  earnOptionText: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#fff",
  },
  subheadline: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.85)",
    lineHeight: "1.5",
    marginBottom: "18px",
    maxWidth: "360px",
    marginLeft: "auto",
    marginRight: "auto",
    textShadow: "0 1px 4px rgba(0,0,0,0.3)",
  },
  statsRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "6px",
    marginBottom: "18px",
    padding: "10px 8px",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "16px",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  statCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "2px",
    flex: 1,
  },
  statNumber: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#fff",
    textShadow: "0 2px 8px rgba(0,0,0,0.3)",
  },
  statLabel: {
    fontSize: "9px",
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  },
  statDivider: {
    width: "1px",
    height: "24px",
    background: "rgba(255,255,255,0.12)",
  },
  benefits: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  benefit: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: "#fff",
    fontWeight: "600",
    padding: "6px 12px",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(4px)",
  },
  benefitIcon: {
    fontSize: "14px",
    flexShrink: 0,
  },
  benefitText: {
    textShadow: "0 1px 3px rgba(0,0,0,0.2)",
  },
  ctaContainer: {
    textAlign: "center",
    margin: "16px 0",
  },
  ctaButton: {
    background: "linear-gradient(135deg, #FFE66D 0%, #f59e0b 100%)",
    color: "#0A0A0A",
    border: "none",
    borderRadius: "28px",
    padding: "16px 48px",
    fontSize: "18px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 8px 32px rgba(255, 230, 109, 0.4)",
    letterSpacing: "1px",
    animation: "pulse-glow 3s ease-in-out infinite",
    transition: "transform 0.2s",
  },
  ctaNote: {
    marginTop: "10px",
    fontSize: "11px",
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  tapHint: {
    marginTop: "12px",
    fontSize: "11px",
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
    letterSpacing: "0.5px",
    animation: "fadeInUp 1s ease-out 0.5s both",
  },
};
