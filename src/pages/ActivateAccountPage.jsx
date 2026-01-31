// src/pages/ActivateAccountPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/api";
import "./ActivateAccountPage.css";

export default function ActivateAccountPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, planData, redirectTo, redirectState } = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleActivate = async () => {
    if (!plan) {
      setError("No plan selected for activation");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      // Make API call to activate account - removed unused 'res' variable
      await api.post("/account/activate", { plan });
      
      setSuccess("Account activated successfully!");
      
      // Redirect after success
      setTimeout(() => {
        if (redirectTo) {
          navigate(redirectTo, { state: redirectState });
        } else {
          navigate("/withdraw", { state: { plan } });
        }
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.message || "Activation failed. Please try again.");
      console.error("Activation error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return (
      <div className="activate-page">
        <header className="page-header">
          <button className="back-btn" onClick={() => navigate("/withdraw")}>← Back</button>
          <h1>Activate Account</h1>
        </header>
        
        <div className="no-plan-container">
          <div className="no-plan-card">
            <h2>No Plan Selected</h2>
            <p>Please select a plan to activate first.</p>
            <button 
              className="back-to-withdraw-btn"
              onClick={() => navigate("/withdraw")}
            >
              Back to Withdraw Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="activate-page">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate("/withdraw")}>← Back</button>
        <h1>Activate Account</h1>
      </header>

      <div className="activate-container">
        <div className="activate-card">
          <div className="plan-summary">
            <div className="plan-icon-large">{planData?.icon || "⭐"}</div>
            <h2>{planData?.name || "Plan"} Account</h2>
            <p className="activation-amount">
              Activation Fee: <span className="fee">KES {planData?.activationFee?.toLocaleString() || "0"}</span>
            </p>
          </div>

          <div className="activation-details">
            <h3>What you get:</h3>
            <ul className="benefits-list">
              <li>✅ Withdraw up to KES {planData?.total?.toLocaleString() || "0"}</li>
              <li>✅ Priority withdrawal processing</li>
              <li>✅ Access to exclusive surveys</li>
              <li>✅ Higher earning rates</li>
              <li>✅ Premium customer support</li>
            </ul>

            <div className="payment-options">
              <h3>Payment Method</h3>
              <div className="payment-method">
                <input 
                  type="radio" 
                  id="mpesa" 
                  name="payment" 
                  defaultChecked 
                />
                <label htmlFor="mpesa">
                  <span className="payment-icon">📱</span>
                  M-Pesa
                </label>
                <p className="payment-note">
                  You'll receive an STK Push to complete payment
                </p>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}
            
            {success && (
              <div className="success-message">
                <span className="success-icon">✅</span>
                {success}
              </div>
            )}

            <div className="action-buttons">
              <button 
                className="activate-now-btn"
                onClick={handleActivate}
                disabled={loading || success}
                style={{ background: planData?.gradient || "linear-gradient(135deg, #10b981, #059669)" }}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : success ? (
                  <>
                    <span className="btn-icon">✅</span>
                    Activated Successfully!
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🔓</span>
                    Activate Now - KES {planData?.activationFee?.toLocaleString() || "0"}
                  </>
                )}
              </button>
              
              <button 
                className="cancel-btn"
                onClick={() => navigate("/withdraw")}
                disabled={loading}
              >
                Cancel
              </button>
            </div>

            <div className="terms">
              <p>
                <strong>Note:</strong> Activation fee is a one-time payment. 
                You'll be able to withdraw immediately after activation.
                All transactions are secure and encrypted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}