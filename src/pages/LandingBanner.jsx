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
        <img
          src="https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&h=600&fit=crop"
          alt="Survey Earnings"
          style={styles.image}
        />
        
        <div style={styles.overlay}>
          <div style={styles.badge}>
            <span style={styles.badgeIcon}>🇰🇪</span>
            <span>Kenya's #1 Survey Platform</span>
          </div>

          <h1 style={styles.headline}>
            Earn KES 1,200 - KES 6,500 Daily
          </h1>

          <p style={styles.subheadline}>
            Complete simple surveys from your phone. Get paid instantly via M-Pesa. Join 50,000+ Kenyans earning extra income!
          </p>

          <div style={styles.stats}>
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

          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>✓</span>
              <span>Instant M-Pesa Payments</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>✓</span>
              <span>KES 1,200 Welcome Bonus</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>✓</span>
              <span>No Hidden Fees</span>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureIcon}>✓</span>
              <span>24/7 Support Available</span>
            </div>
          </div>

          <div style={styles.ctaSection}>
            <button style={styles.ctaButton} onClick={handleStart}>
              START NOW
            </button>
            <p style={styles.ctaNote}>
              Tap anywhere to continue →
            </p>
          </div>

          <div style={styles.trust}>
            <div style={styles.trustItem}>
              <span style={styles.trustIcon}>🛡️</span>
              <span>Government Verified</span>
            </div>
            <div style={styles.trustItem}>
              <span style={styles.trustIcon}>🔒</span>
              <span>100% Secure</span>
            </div>
            <div style={styles.trustItem}>
              <span style={styles.trustIcon}>⚡</span>
              <span>Fast Payouts</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; width: 100%; margin: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    height: "100vh",
    background: "#000",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
  },
  content: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.9) 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: "24px 20px 40px 20px",
  },
  badge: {
    position: "absolute",
    top: "60px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    padding: "10px 20px",
    borderRadius: "30px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    fontWeight: "700",
    color: "#fff",
    boxShadow: "0 4px 20px rgba(34, 197, 94, 0.4)",
    whiteSpace: "nowrap",
  },
  badgeIcon: {
    fontSize: "16px",
  },
  headline: {
    fontSize: "32px",
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    lineHeight: "1.2",
    marginBottom: "12px",
    textShadow: "0 2px 10px rgba(0,0,0,0.5)",
  },
  subheadline: {
    fontSize: "15px",
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: "1.5",
    marginBottom: "20px",
    maxWidth: "340px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  stats: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    marginBottom: "20px",
    padding: "16px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "16px",
    backdropFilter: "blur(10px)",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  statNumber: {
    fontSize: "18px",
    fontWeight: "800",
    color: "#fff",
  },
  statLabel: {
    fontSize: "10px",
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  statDivider: {
    width: "1px",
    height: "30px",
    background: "rgba(255,255,255,0.2)",
  },
  features: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "24px",
    maxWidth: "320px",
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
  },
  featureIcon: {
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    background: "#22c55e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "bold",
  },
  ctaSection: {
    textAlign: "center",
    marginBottom: "20px",
  },
  ctaButton: {
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "#fff",
    border: "none",
    borderRadius: "16px",
    padding: "18px 48px",
    fontSize: "20px",
    fontWeight: "900",
    cursor: "pointer",
    boxShadow: "0 8px 30px rgba(245, 158, 11, 0.5)",
    letterSpacing: "1px",
    width: "100%",
    maxWidth: "300px",
  },
  ctaNote: {
    marginTop: "12px",
    fontSize: "12px",
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  trust: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    flexWrap: "wrap",
  },
  trustItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  trustIcon: {
    fontSize: "14px",
  },
};