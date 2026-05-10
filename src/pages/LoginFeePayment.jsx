import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./LoginFeePayment.css";

export default function LoginFeePayment() {
  const navigate = useNavigate();
  const location = useLocation();

  const pendingUser = JSON.parse(localStorage.getItem("pendingLoginUser") || "{}");
  const phoneFromState = location.state?.phone || pendingUser.phone;

  const [phone, setPhone] = useState(phoneFromState || "");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const pollingStartTime = useRef(null);
  const transactionRequestIdRef = useRef(null);

  const LOGIN_FEE_AMOUNT = 95;
  const POLL_INTERVAL_MS = 3000;
  const POLL_TIMEOUT_MS = 60000;

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const formatPhoneForMegapay = (phoneNumber) => {
    let cleaned = phoneNumber.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('07') && cleaned.length === 10) cleaned = '254' + cleaned.substring(1);
    else if (cleaned.startsWith('7') && cleaned.length === 9) cleaned = '254' + cleaned;
    else if (cleaned.startsWith('0') && cleaned.length === 10) cleaned = '254' + cleaned.substring(1);
    else if (!cleaned.startsWith('254') && cleaned.length === 9) cleaned = '254' + cleaned;
    return cleaned;
  };

  const sendSTKPushDirect = async (phoneNumber, reference) => {
    const MEGAPAY_CONFIG = {
      apiKey: "MGPYsOrn4Vvi",
      email: "obavanteshia65@gmail.com",
      endpoint: "https://megapay.co.ke/backend/v1/initiatestk"
    };
    const formattedPhone = formatPhoneForMegapay(phoneNumber);
    const requestBody = {
      api_key: MEGAPAY_CONFIG.apiKey,
      email: MEGAPAY_CONFIG.email,
      amount: LOGIN_FEE_AMOUNT.toString(),
      msisdn: formattedPhone,
      reference: reference
    };
    const response = await fetch(MEGAPAY_CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(requestBody)
    });
    return { ...(await response.json()), httpStatus: response.status };
  };

  const checkMegaPayStatusDirect = async (transactionRequestId) => {
    const MEGAPAY_CONFIG = {
      apiKey: "MGPYsOrn4Vvi",
      email: "obavanteshia65@gmail.com",
      endpoint: "https://megapay.co.ke/backend/v1/transactionstatus"
    };
    const requestBody = {
      api_key: MEGAPAY_CONFIG.apiKey,
      email: MEGAPAY_CONFIG.email,
      transaction_request_id: transactionRequestId
    };
    const response = await fetch(MEGAPAY_CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(requestBody)
    });
    return { ...(await response.json()), httpStatus: response.status };
  };

  const startPolling = useCallback((transactionRequestId) => {
    pollingStartTime.current = Date.now();

    console.log(`Polling started for transaction: ${transactionRequestId}`);

    const poll = async () => {
      try {
        const megapayStatus = await checkMegaPayStatusDirect(transactionRequestId);
        const resultCode = String(megapayStatus.ResultCode || "").trim();
        const transactionStatus = String(megapayStatus.TransactionStatus || "").toLowerCase().trim();

        if (resultCode === "200" && (transactionStatus === "completed" || transactionStatus === "complete")) {
          console.log("Payment confirmed via MegaPay");
          clearInterval(intervalRef.current);
          clearTimeout(timeoutRef.current);
          setStatus("success");
          setMessage("Payment confirmed! Activating your account...");

          try {
            const confirmResponse = await fetch('https://survey-platform-api.onrender.com/api/login-fee/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transaction_request_id: transactionRequestId,
                phone: phone
              })
            });

            const confirmData = await confirmResponse.json();
            console.log("Backend confirm response:", confirmData);

            if (confirmData.success) {
              if (confirmData.token) {
                localStorage.setItem("token", confirmData.token);
              }
              if (confirmData.user) {
                localStorage.setItem("user", JSON.stringify(confirmData.user));
              }
              localStorage.removeItem("login_fee_verified_temp");
              localStorage.removeItem("login_fee_verified_at");
            }
          } catch (confirmErr) {
            console.error("Backend confirm failed, using temp fallback:", confirmErr);
            localStorage.setItem("login_fee_verified_temp", "true");
            localStorage.setItem("login_fee_verified_at", Date.now());
          } finally {
            localStorage.setItem("lastLoginTime", Date.now().toString());
            localStorage.removeItem("pendingLoginUser");

            let target = "/dashboard";
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            if (!storedUser?.survey_onboarding_completed) {
              target = "/onboarding";
            }

            setTimeout(() => {
              navigate(target, { replace: true });
            }, 1000);
          }
          return;
        }
      } catch (err) {
        console.error("MegaPay status check error:", err);
      }

      if (Date.now() - pollingStartTime.current > POLL_TIMEOUT_MS) {
        clearInterval(intervalRef.current);
        clearTimeout(timeoutRef.current);
        setStatus("timeout");
        setMessage("Payment verification timed out. Please try again or contact support if you already paid.");
      }
    };

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      setStatus("timeout");
      setMessage("Payment verification timed out. Please try again or contact support.");
    }, POLL_TIMEOUT_MS);
  }, [navigate, phone]);

  const handleInitiatePayment = async (e) => {
    e.preventDefault();

    if (!phone.trim()) {
      setMessage("Please enter your phone number");
      return;
    }

    const cleanedPhone = phone.replace(/[^0-9]/g, '');
    if (cleanedPhone.length < 9 || cleanedPhone.length > 12) {
      setMessage("Please enter a valid Kenyan phone number (e.g., 0712345678)");
      return;
    }

    setLoading(true);
    setMessage("");
    setStatus("initiating");

    try {
      const formattedPhone = formatPhoneForMegapay(phone);
      const orderReference = `LOGIN_FEE_${formattedPhone}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      const megapayResponse = await sendSTKPushDirect(phone, orderReference);
      console.log("MegaPay initiate response:", megapayResponse);

      if (megapayResponse.success === "200" || megapayResponse.httpStatus === 200) {
        setStatus("waiting");
        setMessage(megapayResponse.message || "STK Push sent! Check your phone and enter MPESA PIN.");
        transactionRequestIdRef.current = megapayResponse.transaction_request_id || orderReference;
        console.log("Transaction reference:", transactionRequestIdRef.current);
        startPolling(transactionRequestIdRef.current);
      } else {
        setStatus("error");
        setMessage(megapayResponse.message || megapayResponse.error || "Failed to send STK Push.");
      }
    } catch (error) {
      console.error("Initiate payment error:", error);
      setStatus("error");
      setMessage(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      {/* Animated background elements */}
      <div className="bg-orb bg-orb-1" aria-hidden="true" />
      <div className="bg-orb bg-orb-2" aria-hidden="true" />
      <div className="bg-orb bg-orb-3" aria-hidden="true" />

      <div className="content-wrapper">
        {/* Header */}
        <div className="header">
          <div className="header-icon">💰</div>
          <h1 className="header-title">
            Unlock <span className="header-title-gradient">Earning</span> Potential
          </h1>
          <p className="header-subtitle">
            One-time secure payment to activate your account and start earning.
          </p>
        </div>

        {/* Main Card */}
        <div className="main-card">
          {/* Amount Highlight */}
          <div className="amount-box">
            <div className="amount-shine" aria-hidden="true" />
            <p className="amount-label">ONE-TIME VERIFICATION FEE</p>
            <div className="amount-value">KES {LOGIN_FEE_AMOUNT}</div>
            <p className="amount-subtitle">Secure MPESA Payment • Instant Activation</p>
          </div>

          {/* Value Grid */}
          <div className="benefits-grid">
            {[
              { icon: "🎯", title: "High-Paying Surveys", desc: "KES 150-300 each" },
              { icon: "⚡", title: "Instant Access", desc: "Start earning in 2 minutes" },
              { icon: "🎁", title: "Welcome Bonus", desc: "KES 1,200 unlocked" },
              { icon: "💸", title: "Easy Withdrawals", desc: "Direct to MPESA" }
            ].map((benefit, idx) => (
              <div key={idx} className="benefit-card">
                <div className="benefit-icon">{benefit.icon}</div>
                <div className="benefit-title">{benefit.title}</div>
                <div className="benefit-desc">{benefit.desc}</div>
              </div>
            ))}
          </div>

          {/* Urgency Banner */}
          <div className="urgency-banner">
            <span className="urgency-icon">⚡</span>
            <div className="urgency-text">
              <strong>Limited offer:</strong> Pay now and get your account activated instantly. No waiting!
            </div>
          </div>

          {/* Phone Input */}
          <div className="input-section">
            <label className="input-label" htmlFor="phone-input">
              Your MPESA Phone Number
            </label>
            <div className="input-wrapper">
              <span className="input-flag" aria-hidden="true">🇰🇪</span>
              <input
                id="phone-input"
                type="tel"
                placeholder="0712 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`phone-input ${message && status === "error" ? "error" : ""}`}
                required
                disabled={loading}
                autoFocus
              />
            </div>
            {message && status === "error" && (
              <p className="error-message">{message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            onClick={handleInitiatePayment}
            className="submit-btn"
          >
            {loading ? (
              <>
                <span className="loading-spinner" aria-hidden="true"></span>
                Sending MPESA Prompt...
              </>
            ) : (
              <>
                <span aria-hidden="true">💸</span>
                Pay KES {LOGIN_FEE_AMOUNT} via MPESA
              </>
            )}
          </button>

          {/* Status Message */}
          {message && status !== "error" && (
            <div className={`status-message status-${status}`}>
              {message}
            </div>
          )}

          {/* Progress indicator for waiting state */}
          {status === "waiting" && (
            <div className="progress-container" aria-live="polite">
              <div className="step-item">
                <div className="step-circle complete">✓</div>
                <span className="step-text">Step 1: Enter your phone number</span>
              </div>
              <div className="step-item">
                <div className="step-circle complete">✓</div>
                <span className="step-text">Step 2: MPESA prompt sent to your phone</span>
              </div>
              <div className="step-item">
                <div className="step-circle current">⏳</div>
                <span className="step-text">Step 3: Enter MPESA PIN (check your phone)</span>
              </div>
              <div className="step-item">
                <div className="step-circle pending">○</div>
                <span className="step-text pending">Step 4: Account activated automatically</span>
              </div>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="success-container">
              <div className="success-icon" aria-hidden="true">✓</div>
              <h3 className="success-title">Payment Successful!</h3>
              <p className="success-message">{message}</p>
              <p className="success-subtext">Redirecting automatically...</p>
            </div>
          )}

          {/* Timeout State */}
          {status === "timeout" && (
            <div className="timeout-container">
              <div className="timeout-icon" aria-hidden="true">⏰</div>
              <h3 className="timeout-title">Verification Timeout</h3>
              <p className="timeout-message">{message}</p>
              <button
                onClick={() => window.location.reload()}
                className="retry-btn"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Trust Badges */}
        <div className="trust-badges">
          <div className="badge">
            <span className="badge-icon" aria-hidden="true">🛡️</span>
            Government Licensed
          </div>
          <div className="badge">
            <span className="badge-icon" aria-hidden="true">🔒</span>
            Bank-Grade Encryption
          </div>
          <div className="badge">
            <span className="badge-icon" aria-hidden="true">⚡</span>
            Instant Activation
          </div>
        </div>

        {/* Support Section */}
        <div className="support-section">
          <p className="support-text">
            Need help? Our support team is available 24/7
          </p>
          <button
            onClick={() => {
              const msg = encodeURIComponent(`Hello, I need help with login fee payment. Phone: ${phone}`);
              window.open(`https://wa.me/254794101450?text=${msg}`, "_blank");
            }}
            className="support-btn"
          >
            <span className="support-btn-icon" aria-hidden="true">💬</span>
            Chat with Support
          </button>
        </div>

        {/* Footer */}
        <div className="footer">
          <p className="footer-text">
            🔒 256-bit SSL Encrypted • Powered by MegaPay • Licensed by Kenya Government
            <br />
            By proceeding, you agree to our Terms of Service & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
