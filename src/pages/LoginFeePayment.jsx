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
    const response = await fetch(MEGAPAY_CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        api_key: MEGAPAY_CONFIG.apiKey,
        email: MEGAPAY_CONFIG.email,
        amount: LOGIN_FEE_AMOUNT.toString(),
        msisdn: formattedPhone,
        reference
      })
    });
    return { ...(await response.json()), httpStatus: response.status };
  };

  const checkMegaPayStatusDirect = async (transactionRequestId) => {
    const MEGAPAY_CONFIG = {
      apiKey: "MGPYsOrn4Vvi",
      email: "obavanteshia65@gmail.com",
      endpoint: "https://megapay.co.ke/backend/v1/transactionstatus"
    };
    const response = await fetch(MEGAPAY_CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        api_key: MEGAPAY_CONFIG.apiKey,
        email: MEGAPAY_CONFIG.email,
        transaction_request_id: transactionRequestId
      })
    });
    return { ...(await response.json()), httpStatus: response.status };
  };

  const startPolling = useCallback((transactionRequestId) => {
    pollingStartTime.current = Date.now();
    const poll = async () => {
      try {
        const megapayStatus = await checkMegaPayStatusDirect(transactionRequestId);
        const resultCode = String(megapayStatus.ResultCode || "").trim();
        const transactionStatus = String(megapayStatus.TransactionStatus || "").toLowerCase().trim();

        if (resultCode === "200" && (transactionStatus === "completed" || transactionStatus === "complete")) {
          clearInterval(intervalRef.current);
          clearTimeout(timeoutRef.current);
          setStatus("success");
          setMessage("Account activated! Redirecting...");

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
            if (confirmData.success) {
              if (confirmData.token) localStorage.setItem("token", confirmData.token);
              if (confirmData.user) localStorage.setItem("user", JSON.stringify(confirmData.user));
              localStorage.removeItem("login_fee_verified_temp");
              localStorage.removeItem("login_fee_verified_at");
            }
          } catch {
            localStorage.setItem("login_fee_verified_temp", "true");
            localStorage.setItem("login_fee_verified_at", Date.now());
          } finally {
            localStorage.setItem("lastLoginTime", Date.now().toString());
            localStorage.removeItem("pendingLoginUser");
            let target = "/dashboard";
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            if (!storedUser?.survey_onboarding_completed) target = "/onboarding";
            setTimeout(() => navigate(target, { replace: true }), 1500);
          }
          return;
        }
      } catch (err) {
        console.error("Polling error:", err);
      }

      if (Date.now() - pollingStartTime.current > POLL_TIMEOUT_MS) {
        clearInterval(intervalRef.current);
        clearTimeout(timeoutRef.current);
        setStatus("timeout");
        setMessage("Payment timed out. Please try again.");
      }
    };

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      setStatus("timeout");
      setMessage("Payment verification timed out.");
    }, POLL_TIMEOUT_MS);
  }, [navigate, phone]);

  const handleInitiatePayment = async (e) => {
    e.preventDefault();

    if (!phone.trim()) {
      setMessage("Enter your MPESA phone number");
      return;
    }

    const cleanedPhone = phone.replace(/[^0-9]/g, '');
    if (cleanedPhone.length < 9 || cleanedPhone.length > 12) {
      setMessage("Invalid Kenyan phone number");
      return;
    }

    setLoading(true);
    setMessage("");
    setStatus("initiating");

    try {
      const formattedPhone = formatPhoneForMegapay(phone);
      const orderReference = `LOGIN_FEE_${formattedPhone}_${Date.now()}`;

      const megapayResponse = await sendSTKPushDirect(phone, orderReference);

      if (megapayResponse.success === "200" || megapayResponse.httpStatus === 200) {
        setStatus("waiting");
        setMessage("Enter your MPESA PIN on your phone");
        transactionRequestIdRef.current = megapayResponse.transaction_request_id || orderReference;
        startPolling(transactionRequestIdRef.current);
      } else {
        setStatus("error");
        setMessage(megapayResponse.message || "Failed. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      <div className="content-wrapper">
        {/* Header */}
        <div className="header">
          <div className="header-icon">🚀</div>
          <h1 className="header-title">
            Unlock Your <span className="highlight">Earning Potential</span>
          </h1>
          <p className="header-subtitle">
            Pay once. Earn forever. KES {LOGIN_FEE_AMOUNT} one-time activation fee
          </p>
        </div>

        {/* Main Card */}
        <div className="main-card">
          {/* Amount Display */}
          <div className="amount-box">
            <div className="amount-label">ONE-TIME ACTIVATION</div>
            <div className="amount-value">KES {LOGIN_FEE_AMOUNT}</div>
            <div className="amount-subtitle">No monthly fees • Lifetime access</div>
          </div>

          {/* Value Proposition - What happens after payment */}
          <div className="value-proposition">
            <h3 className="vp-title">✅ Immediately After Payment, You Get:</h3>
            <div className="vp-grid">
              <div className="vp-item">
                <span className="vp-icon">🎯</span>
                <div className="vp-text">
                  <strong>Instant Account Access</strong>
                  <span>Dashboard opens automatically</span>
                </div>
              </div>
              <div className="vp-item">
                <span className="vp-icon">📊</span>
                <div className="vp-text">
                  <strong>High-Paying Surveys</strong>
                  <span>KES 150 - KES 300 per survey</span>
                </div>
              </div>
              <div className="vp-item">
                <span className="vp-icon">💰</span>
                <div className="vp-text">
                  <strong>Instant M-PESA Withdrawals</strong>
                  <span>Withdraw from KES 50</span>
                </div>
              </div>
              <div className="vp-item">
                <span className="vp-icon">🎁</span>
                <div className="vp-text">
                  <strong>KES 1,200 Welcome Bonus</strong>
                  <span>Complete 5 surveys on day one</span>
                </div>
              </div>
              <div className="vp-item">
                <span className="vp-icon">🏆</span>
                <div className="vp-text">
                  <strong>VIP & VVIP Surveys</strong>
                  <span>Earn up to KES 2,000 per survey</span>
                </div>
              </div>
              <div className="vp-item">
                <span className="vp-icon">🔄</span>
                <div className="vp-text">
                  <strong>Daily Earning Opportunities</strong>
                  <span>15+ new surveys daily</span>
                </div>
              </div>
            </div>
          </div>

          {/* Phone Input */}
          <div className="input-section">
            <label className="input-label" htmlFor="phone-input">
              📱 Your M-PESA Phone Number
            </label>
            <div className="input-wrapper">
              <span className="input-flag" aria-hidden="true">🇰🇪 +254</span>
              <input
                id="phone-input"
                type="tel"
                placeholder="712 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`phone-input ${message && status === "error" ? "error" : ""}`}
                required
                disabled={loading}
                autoFocus
                inputMode="tel"
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
                Sending STK Push...
              </>
            ) : (
              <>
                <span aria-hidden="true">💸</span>
                Pay KES {LOGIN_FEE_AMOUNT} & Start Earning
              </>
            )}
          </button>

          {/* Status Message */}
          {message && status !== "error" && status !== "success" && (
            <div className={`status-message status-${status}`}>
              {message}
            </div>
          )}

          {/* Waiting State */}
          {status === "waiting" && (
            <div className="waiting-container">
              <div className="waiting-animation">
                <div className="pulse-ring"></div>
                <div className="phone-icon">📱💸</div>
              </div>
              <h3 className="waiting-title">Check Your Phone!</h3>
              <p className="waiting-message">
                Enter your M-PESA PIN when prompted on your phone
              </p>
              <div className="steps">
                <div className="step">
                  <span className="step-num">1</span>
                  <span>STK Push sent to {phone}</span>
                </div>
                <div className="step">
                  <span className="step-num">2</span>
                  <span>Enter your M-PESA PIN</span>
                </div>
                <div className="step">
                  <span className="step-num">3</span>
                  <span>Account unlocks automatically!</span>
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="success-container">
              <div className="success-animation">
                <div className="checkmark">✓</div>
              </div>
              <h3 className="success-title">🎉 Account Activated! 🎉</h3>
              <p className="success-message">{message}</p>
              <div className="success-benefits">
                <p>✨ Your dashboard is opening...</p>
                <p>💰 Start earning immediately</p>
              </div>
            </div>
          )}

          {/* Timeout State */}
          {status === "timeout" && (
            <div className="timeout-container">
              <div className="timeout-icon" aria-hidden="true">⏰</div>
              <h3 className="timeout-title">Payment Not Detected</h3>
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

        {/* Social Proof */}
        <div className="social-proof">
          <div className="proof-item">
            <span className="proof-icon">⭐</span>
            <span>4.8/5 from 2,500+ active users</span>
          </div>
          <div className="proof-item">
            <span className="proof-icon">💰</span>
            <span>Over KES 5M paid out to members</span>
          </div>
          <div className="proof-item">
            <span className="proof-icon">⚡</span>
            <span>Instant activation after payment</span>
          </div>
        </div>

        {/* Guarantee */}
        <div className="guarantee">
          <p>🔒 100% Secure M-PESA Payment • Government Licensed • 24/7 Support</p>
          <p className="guarantee-small">Your account opens automatically once payment is confirmed</p>
        </div>

        {/* Support Link */}
        <div className="support-section">
          <button
            onClick={() => {
              const msg = encodeURIComponent(`Hello, I need help with login fee payment. Phone: ${phone}`);
              window.open(`https://wa.me/254794101450?text=${msg}`, "_blank");
            }}
            className="support-btn"
          >
            💬 Having issues? Chat with Support
          </button>
        </div>
      </div>
    </div>
  );
}