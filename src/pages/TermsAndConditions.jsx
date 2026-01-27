import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TermsAndConditions() {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  const handleAccept = () => {
    if (accepted) {
      localStorage.setItem("termsAccepted", "true");
      navigate("/auth?mode=register");
    }
  };

  const handleDecline = () => {
    navigate("/auth?mode=register");
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Terms and Conditions</h1>
          <p style={styles.subtitle}>Please read carefully before signing up</p>
        </div>

        <div style={styles.content}>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>1. Important Terms</h2>
            <div style={styles.sectionContent}>
              <p style={styles.paragraph}>
                By registering and using SurveyEarn, you agree to the following terms and conditions:
              </p>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>2. Money Cannot Be Returned</h2>
            <div style={styles.sectionContent}>
              <p style={styles.paragraph}>
                <strong>Non-Refundable Policy:</strong> Any money sent to your account for completing surveys is non-refundable. Once funds are credited to your account as compensation for survey completion, they cannot be returned or refunded under any circumstances. This is a binding financial commitment.
              </p>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>3. Survey Completion Requirements</h2>
            <div style={styles.sectionContent}>
              <p style={styles.paragraph}>
                <strong>Mandatory Completion:</strong> You must complete all surveys assigned to you to maintain your account in good standing. Failure to complete surveys may result in:
              </p>
              <ul style={styles.bulletList}>
                <li>Account suspension</li>
                <li>Reduction in future survey opportunities</li>
                <li>Forfeiture of pending earnings from incomplete surveys</li>
              </ul>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>4. Activation Fee Requirement</h2>
            <div style={styles.sectionContent}>
              <p style={styles.paragraph}>
                <strong>Activation Fee Mandatory:</strong> You must pay the activation fee for all survey plans in order to be eligible to withdraw your earnings. This includes:
              </p>
              <ul style={styles.bulletList}>
                <li>One-time activation fee required for account activation</li>
                <li>Separate activation fees may apply for premium survey plans</li>
                <li>Without payment of the activation fee, you cannot withdraw any earnings</li>
                <li>Activation fees are non-refundable and must be paid upfront</li>
              </ul>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>5. Withdrawal Policy</h2>
            <div style={styles.sectionContent}>
              <p style={styles.paragraph}>
                To withdraw your earnings, you must meet the following conditions:
              </p>
              <ul style={styles.bulletList}>
                <li>Complete all assigned surveys</li>
                <li>Pay the activation fee for your survey plan</li>
                <li>Have a minimum balance as specified in your plan</li>
                <li>Provide verified payment information</li>
              </ul>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>6. Account Responsibility</h2>
            <div style={styles.sectionContent}>
              <p style={styles.paragraph}>
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. SurveyEarn is not responsible for unauthorized access to your account.
              </p>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>7. Eligibility</h2>
            <div style={styles.sectionContent}>
              <p style={styles.paragraph}>
                By registering, you confirm that:
              </p>
              <ul style={styles.bulletList}>
                <li>You are at least 18 years of age</li>
                <li>You provide accurate and truthful information</li>
                <li>You will comply with all terms and conditions</li>
              </ul>
            </div>
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>8. Amendment</h2>
            <div style={styles.sectionContent}>
              <p style={styles.paragraph}>
                SurveyEarn reserves the right to modify these terms and conditions at any time. Your continued use of the platform constitutes acceptance of any changes.
              </p>
            </div>
          </section>
        </div>

        <div style={styles.footer}>
          <div style={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="termsAccepted"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              style={styles.checkbox}
            />
            <label htmlFor="termsAccepted" style={styles.checkboxLabel}>
              I have read and agree to the Terms and Conditions
            </label>
          </div>

          <div style={styles.buttonContainer}>
            <button
              style={styles.acceptButton}
              onClick={handleAccept}
              disabled={!accepted}
            >
              Accept & Continue
            </button>
            <button
              style={styles.declineButton}
              onClick={handleDecline}
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f7fa",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  header: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "30px 20px",
    textAlign: "center",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    margin: 0,
    marginBottom: "10px",
  },
  subtitle: {
    fontSize: "14px",
    margin: 0,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: "30px 20px",
    overflowY: "auto",
    maxHeight: "calc(100vh - 300px)",
  },
  section: {
    marginBottom: "25px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#333",
    marginBottom: "12px",
    marginTop: 0,
  },
  sectionContent: {
    marginLeft: "10px",
  },
  paragraph: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#555",
    margin: "0 0 12px 0",
  },
  bulletList: {
    fontSize: "14px",
    lineHeight: "1.8",
    color: "#555",
    marginLeft: "20px",
    marginTop: "10px",
    marginBottom: "10px",
  },
  footer: {
    padding: "20px",
    borderTop: "1px solid #e0e0e0",
    backgroundColor: "#f9f9f9",
  },
  checkboxContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
    padding: "15px",
    backgroundColor: "#f0f3ff",
    borderRadius: "12px",
    border: "1px solid #e0e0e0",
  },
  checkbox: {
    width: "20px",
    height: "20px",
    cursor: "pointer",
    accentColor: "#667eea",
  },
  checkboxLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#333",
    cursor: "pointer",
    margin: 0,
  },
  buttonContainer: {
    display: "flex",
    gap: "12px",
  },
  acceptButton: {
    flex: 1,
    padding: "14px 20px",
    backgroundColor: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
  },
  declineButton: {
    flex: 1,
    padding: "14px 20px",
    backgroundColor: "white",
    color: "#667eea",
    border: "2px solid #667eea",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
};
