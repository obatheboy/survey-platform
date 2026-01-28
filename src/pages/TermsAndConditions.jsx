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
          <h1 style={styles.title}>SURVEY APP</h1>
          <p style={styles.subtitle}>Terms and Conditions Agreement</p>
        </div>

        <div style={styles.content}>
          <p style={styles.paragraph}>
            By registering and using the Survey App platform, you acknowledge and agree to the following comprehensive terms and conditions that govern your participation and use of our services. These terms constitute a legally binding agreement between you and the Survey App platform, and your continued use of our services signifies your complete acceptance of all terms outlined herein. You understand and accept that any money credited to your account for completing surveys is non-refundable under any circumstances whatsoever, and once funds are transferred to your account as compensation for survey participation, you forfeit any right to request a refund or reversal of these transactions. Furthermore, you acknowledge the mandatory requirement to complete all surveys assigned to you in order to maintain your account in good standing, and failure to complete assigned surveys may result in account suspension, reduction in future survey opportunities, and forfeiture of pending earnings from any incomplete surveys. It is expressly understood and agreed that you must pay the activation fee required for your chosen survey plan in order to be eligible to withdraw any earnings from your account, and this activation fee is non-refundable and must be paid upfront before you can access withdrawal privileges or premium features. The activation fee requirement applies to all survey plans offered through our platform, and additional activation fees may apply for access to premium or exclusive survey categories. To successfully withdraw your earned funds from the Survey App platform, you must satisfy all conditions including but not limited to completing all assigned surveys within the specified timeframes, paying all required activation fees for your selected survey plan, maintaining a minimum account balance as specified in your particular plan tier, and providing verified and accurate payment information for the withdrawal transaction. You are solely responsible for maintaining the confidentiality and security of your account credentials, passwords, and personal information, and the Survey App platform assumes no responsibility for unauthorized access to your account resulting from your negligence in protecting your login information. By registering for an account with Survey App, you confirm that you are at least eighteen years of age, that all information provided during registration is accurate and truthful, that you will comply with all stated terms and conditions throughout your participation, and that you have read and fully understand all obligations and restrictions outlined in this agreement. The Survey App platform reserves the right to modify, update, or amend these terms and conditions at any time without prior notice, and your continued use of the platform following any such modifications constitutes your automatic acceptance of the revised terms. Additionally, Survey App maintains the right to suspend or terminate your account if you are found to be in violation of any of these terms, engaging in fraudulent activities, providing false information, or attempting to manipulate survey responses or the earnings calculation system. You agree to indemnify and hold Survey App harmless from any claims, damages, or liabilities arising from your use of the platform or your violation of these terms and conditions.
          </p>
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
    backgroundColor: "#f8fafc",
    padding: "20px",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    backgroundColor: "white",
    borderRadius: "24px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    minHeight: "90vh",
  },
  header: {
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "white",
    padding: "40px 20px",
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
    backgroundColor: "rgba(37, 99, 235, 0.05)",
    borderRadius: "16px",
    border: "1px solid rgba(37, 99, 235, 0.1)",
  },
  checkbox: {
    width: "20px",
    height: "20px",
    cursor: "pointer",
    accentColor: "#2563eb",
  },
  checkboxLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1e293b",
    cursor: "pointer",
    margin: 0,
  },
  buttonContainer: {
    display: "flex",
    gap: "12px",
  },
  acceptButton: {
    flex: 2,
    padding: "16px 20px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "16px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
  },
  declineButton: {
    flex: 1,
    padding: "16px 20px",
    backgroundColor: "white",
    color: "#64748b",
    border: "2px solid #e2e8f0",
    borderRadius: "16px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
};
