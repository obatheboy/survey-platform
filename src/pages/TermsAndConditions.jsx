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
        <div style={styles.content}>
          <section style={styles.section}>
            <p style={styles.paragraph}>
              Welcome to SurveyEarn, an innovative platform designed to connect individuals with market research opportunities that reward their valuable time and opinions. By registering for and using SurveyEarn, you agree to be bound by the terms and conditions outlined in this agreement. We encourage you to read this document carefully, as it contains important information regarding your rights, responsibilities, and the financial commitments associated with your participation on our platform.
            </p>

            <p style={styles.paragraph}>
              SurveyEarn operates as a legitimate survey compensation platform where members earn rewards by completing market research surveys. Our mission is to create a transparent, fair, and secure environment for both survey participants and our research partners. However, to maintain the integrity of our platform and ensure that all participants meet their obligations, we have established a set of clear and binding terms that govern the use of our services. These terms are designed to protect both your interests and the interests of our research partners while establishing clear expectations for all parties involved.
            </p>

            <p style={styles.paragraph}>
              One of the most critical policies you must understand before participating on SurveyEarn is our non-refundable funds policy. Any monetary compensation that you receive through our platform for completing surveys is absolutely non-refundable under any circumstances. Once funds are credited to your account as compensation for survey completion, they represent your earned rewards and cannot be returned, reversed, or refunded. This is a binding financial commitment that you acknowledge by registering with our platform. This policy exists to ensure fairness across all users and to maintain the integrity of our compensation system. Therefore, it is essential that you only pursue survey opportunities that you are genuinely interested in completing and that you fully understand the nature of the work involved before you begin.
            </p>

            <p style={styles.paragraph}>
              Participation on SurveyEarn requires a commitment to completing all surveys assigned to your account. We assign surveys to members based on their profile information, preferences, and suitability for specific research projects. When a survey is assigned to you, we expect you to complete it in its entirety. Failure to complete assigned surveys will result in serious consequences for your account, including potential suspension, removal from future survey opportunities, and the forfeiture of any earnings associated with incomplete surveys. We take survey completion very seriously because our research partners depend on high-quality data and reliable participants. By registering with SurveyEarn, you are committing to honor your obligations and complete the work you undertake.
            </p>

            <p style={styles.paragraph}>
              A fundamental requirement for all SurveyEarn members is the payment of an activation fee. This fee is mandatory and must be paid for your account to be activated and for you to become eligible to withdraw any earnings you accumulate through survey completion. The activation fee serves several important purposes: it verifies your commitment to the platform, helps us maintain a high-quality user base, and covers the costs associated with account verification and fraud prevention. Depending on your selected survey plan, additional activation fees may apply for premium survey tiers that offer higher-paying opportunities. These activation fees are non-refundable and are collected upfront before you can access certain survey opportunities or process any withdrawals. Without paying the required activation fee for your account or chosen survey plan, you will not be able to withdraw your earnings, regardless of how many surveys you complete or how much you have earned.
            </p>

            <p style={styles.paragraph}>
              The withdrawal of earnings on SurveyEarn is subject to strict conditions that you must meet before you can access your funds. To be eligible for withdrawal, you must have successfully completed all surveys assigned to your account, maintained good standing on the platform, paid all required activation fees, achieved the minimum balance threshold specified for your particular survey plan, and provided verified payment information for fund transfer. These requirements exist to ensure that we work only with committed and reliable participants who have demonstrated their ability to fulfill their obligations. Withdrawal requests are processed according to our established timelines, and all payments are made through verified banking channels to protect both you and our organization.
            </p>

            <p style={styles.paragraph}>
              As a member of SurveyEarn, you bear full responsibility for maintaining the confidentiality of your account credentials, including your username, password, and any authentication codes. You are responsible for all activities that occur under your account, whether they are authorized by you or not. SurveyEarn is not responsible for any unauthorized access to your account, data breaches resulting from your negligence, or any losses incurred due to compromised account security. We strongly recommend that you use a strong, unique password, enable any available security features, and immediately notify us of any suspicious account activity. By maintaining the security of your account, you protect your earnings and your personal information.
            </p>

            <p style={styles.paragraph}>
              By registering for SurveyEarn, you confirm and warrant that you are at least eighteen years of age, that you will provide accurate and truthful information in all fields of your registration, that you have the legal authority to enter into this agreement, and that you commit to complying with all terms and conditions outlined in this agreement. You further acknowledge that you understand the financial commitments involved in participation, including the non-refundable nature of payments and the necessity of activation fees, and that you have read and comprehend all the terms presented herein.
            </p>

            <p style={styles.paragraph}>
              SurveyEarn reserves the absolute right to modify, update, or amend these terms and conditions at any time and without prior notice. Your continued use of the SurveyEarn platform following any changes to these terms constitutes your acceptance of those changes. We therefore encourage you to periodically review this page to remain informed of any updates that may affect your participation on our platform. If you do not agree with any changes we make, your only recourse is to discontinue your use of our services.
            </p>

            <p style={styles.paragraph}>
              By clicking the "Accept & Continue" button and proceeding with your registration on SurveyEarn, you acknowledge that you have read this entire Terms and Conditions agreement, that you fully understand all of its provisions, and that you voluntarily agree to be bound by all of its terms. You understand that this is a binding legal agreement and that you are making a serious commitment to fulfill all obligations associated with your participation on our platform. Thank you for choosing SurveyEarn, and we look forward to working with you on rewarding survey opportunities.
            </p>
          </section>
        </div>

        <div style={styles.headerCard}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>✨ SURVEY APP ✨</h1>
            <p style={styles.subtitle}>Terms of Service & User Agreement</p>
            <p style={styles.description}>Earn real money by sharing your valuable opinions on products and services</p>
          </div>
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
              I have read and agree to all terms
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
              Go Back
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
  content: {
    flex: 1,
    padding: "30px 20px",
    overflowY: "auto",
    maxHeight: "calc(100vh - 300px)",
  },
  section: {
    marginBottom: "25px",
  },
  paragraph: {
    fontSize: "15px",
    lineHeight: "1.8",
    color: "#444",
    margin: "0 0 18px 0",
    textAlign: "justify",
  },
  headerCard: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "20px",
    borderTop: "1px solid rgba(255, 255, 255, 0.2)",
  },
  headerContent: {
    textAlign: "center",
    color: "white",
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    margin: "0 0 8px 0",
    letterSpacing: "1px",
  },
  subtitle: {
    fontSize: "13px",
    margin: "0 0 6px 0",
    opacity: 0.95,
    fontWeight: "600",
  },
  description: {
    fontSize: "12px",
    margin: 0,
    opacity: 0.85,
    fontStyle: "italic",
  },
  footer: {
    padding: "16px 18px",
    borderTop: "1px solid #e0e0e0",
    backgroundColor: "#f9f9f9",
  },
  checkboxContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
    padding: "10px 12px",
    backgroundColor: "rgba(102, 126, 234, 0.05)",
    borderRadius: "8px",
    border: "1px solid rgba(102, 126, 234, 0.15)",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    minWidth: "18px",
    cursor: "pointer",
    accentColor: "#667eea",
  },
  checkboxLabel: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#333",
    cursor: "pointer",
    margin: 0,
  },
  buttonContainer: {
    display: "flex",
    gap: "10px",
  },
  acceptButton: {
    flex: 1,
    padding: "12px 16px",
    backgroundColor: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 3px 10px rgba(102, 126, 234, 0.3)",
  },
  declineButton: {
    flex: 1,
    padding: "12px 16px",
    backgroundColor: "white",
    color: "#667eea",
    border: "2px solid #667eea",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
};
