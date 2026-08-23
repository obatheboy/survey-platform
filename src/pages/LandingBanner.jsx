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
      <div style={styles.content}>
        {/* Top badge */}
        <div style={styles.topBadge}>
          <span style={styles.badgeIcon}>🇰🇪</span>
          <span>Kenya's #1 Survey Platform</span>
        </div>

        {/* Hero headline with accent line */}
        <div style={styles.headlineWrap}>
          <div style={styles.accentLine}></div>
          <h1 style={styles.headline}>
            Earn KES 1,200<br />
            <span style={styles.headlineAccent}>- KES 6,500</span><br />
            Daily
          </h1>
        </div>

        <p style={styles.subheadline}>
          Complete simple surveys from your phone. Get paid instantly via M-Pesa. Join 50,000+ Kenyans earning extra income!
        </p>

        {/* Stats bar */}
        <div style={styles.statsBar}>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>KES 12M+</span>
            <span style={styles.statLabel}>Paid Out</span>
          </div>
          <div style={styles.statDivider}></div>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>50K+</span>
            <span style={styles.statLabel}>Active Users</span>
          </div>
          <div style={styles.statDivider}></div>
          <div style={styles.statItem}>
            <span style={styles.statNumber}>4.9★</span>
            <span style={styles.statLabel}>Rating</span>
          </div>
        </div>

        {/* Features grid */}
        <div style={styles.features}>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>⚡</span>
            <span>Instant M-Pesa Payments</span>
          </div>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>🎁</span>
            <span>KES 1,200 Welcome Bonus</span>
          </div>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>🔒</span>
            <span>No Hidden Fees</span>
          </div>
          <div style={styles.feature}>
            <span style={styles.featureIcon}>💬</span>
            <span>24/7 Support Available</span>
          </div>
        </div>

        {/* CTA */}
        <div style={styles.ctaSection}>
          <button style={styles.ctaButton} onClick={handleStart}>
            START NOW
            <span style={styles.ctaArrow}>→</span>
          </button>
          <p style={styles.ctaNote}>
            Tap anywhere to continue
          </p>
        </div>

        {/* Trust row */}
        <div style={styles.trust}>
          <div style={styles.trustItem}>
            <span style={styles.trustIcon}>🏆</span>
            <span>Best Survey App</span>
          </div>
          <div style={styles.trustItem}>
            <span style={styles.trustIcon}>✅</span>
            <span>100% Secure</span>
          </div>
          <div style={styles.trustItem}>
            <span style={styles.trustIcon}>💸</span>
            <span>Fast Payouts</span>
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; width: 100%; margin: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,0,110,0.4); }
          50% { box-shadow: 0 0 40px rgba(131,56,236,0.6); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    height: "100vh",
    background: "linear-gradient(135deg, #ff006e 0%, #8338ec 40%, #3a86ff 100%)",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    width: "100%",
    maxWidth: "420px",
    padding: "24px 20px 40px",
    position: "relative",
    zIndex: 2,
    textAlign: "center",
    animation: "slideInUp 0.6s ease-out",
  },
  topBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(10px)",
    padding: "10px 20px",
    borderRadius: "30px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "20px",
    border: "1px solid rgba(255,255,255,0.25)",
  },
  badgeIcon: {
    fontSize: "16px",
  },
  headlineWrap: {
    marginBottom: "16px",
    position: "relative",
  },
  accentLine: {
    width: "60px",
    height: "4px",
    background: "linear-gradient(90deg, #ff006e, #8338ec)",
    borderRadius: "2px",
    margin: "0 auto 16px",
  },
  headline: {
    fontSize: "36px",
    fontWeight: "900",
    color: "#fff",
    lineHeight: "1.15",
    textShadow: "0 4px 20px rgba(0,0,0,0.3)",
    letterSpacing: "-1px",
  },
  headlineAccent: {
    background: "linear-gradient(90deg, #ff006e, #ffbe0b)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  subheadline: {
    fontSize: "15px",
    color: "rgba(255,255,255,0.9)",
    lineHeight: "1.5",
    marginBottom: "24px",
    maxWidth: "340px",
    marginLeft: "auto",
    marginRight: "auto",
    textShadow: "0 1px 4px rgba(0,0,0,0.2)",
  },
  statsBar: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
    padding: "18px 16px",
    background: "rgba(255,255,255,0.12)",
    borderRadius: "20px",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.2)",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
    flex: 1,
  },
  statNumber: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#fff",
    textShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  statLabel: {
    fontSize: "10px",
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statDivider: {
    width: "1px",
    height: "32px",
    background: "rgba(255,255,255,0.25)",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "28px",
    maxWidth: "340px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  feature: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#fff",
    fontWeight: "600",
    padding: "10px 12px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.15)",
    backdropFilter: "blur(4px)",
  },
  featureIcon: {
    fontSize: "16px",
    flexShrink: 0,
  },
  ctaSection: {
    textAlign: "center",
    marginBottom: "24px",
  },
  ctaButton: {
    background: "linear-gradient(135deg, #ffbe0b 0%, #ff006e 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "20px",
    padding: "20px 48px",
    fontSize: "20px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 8px 32px rgba(255, 0, 110, 0.5)",
    letterSpacing: "0.5px",
    width: "100%",
    maxWidth: "320px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    animation: "pulse-glow 2s ease-in-out infinite",
    transition: "transform 0.2s",
  },
  ctaArrow: {
    fontSize: "22px",
    fontWeight: "400",
  },
  ctaNote: {
    marginTop: "12px",
    fontSize: "12px",
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  trust: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  trustItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
    padding: "6px 12px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.15)",
  },
  trustIcon: {
    fontSize: "14px",
  },
};
