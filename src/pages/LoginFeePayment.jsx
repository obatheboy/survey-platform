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
            }
          } catch {
            localStorage.setItem("login_fee_verified_temp", "true");
          } finally {
            localStorage.removeItem("pendingLoginUser");
            setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
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
        setMessage("Payment not received. Please try again.");
      }
    };

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      setStatus("timeout");
      setMessage("Payment not received. Please try again.");
    }, POLL_TIMEOUT_MS);
  }, [navigate, phone]);

  const handleInitiatePayment = async (e) => {
    e.preventDefault();

    if (!phone.trim()) {
      setMessage("Enter your M-PESA phone number");
      return;
    }

    const cleanedPhone = phone.replace(/[^0-9]/g, '');
    if (cleanedPhone.length < 9 || cleanedPhone.length > 12) {
      setMessage("Enter a valid Kenyan phone number (e.g., 0712345678)");
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
        setMessage("Check your phone. Enter M-PESA PIN to complete payment.");
        transactionRequestIdRef.current = megapayResponse.transaction_request_id || orderReference;
        startPolling(transactionRequestIdRef.current);
      } else {
        setStatus("error");
        setMessage("Payment failed. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      <div className="content-wrapper">
        {/* Header */}
        <div className="header">
          <h1 className="header-title">🔓 Activate Account</h1>
          <p className="header-subtitle">
            Pay KES {LOGIN_FEE_AMOUNT} once and start earning up to <strong>KES 5,000 daily</strong>
          </p>
        </div>

        {/* Main Card */}
        <div className="main-card">
          {/* Amount */}
          <div className="amount-box">
            <div className="amount-value">KES {LOGIN_FEE_AMOUNT}</div>
            <div className="amount-label">One-time fee • Lifetime access</div>
          </div>

          {/* Phone Input - Right below amount */}
          <div className="input-section">
            <label className="input-label">📱 Your M-PESA Phone Number</label>
            <div className="input-wrapper">
              <span className="input-flag">🇰🇪 +254</span>
              <input
                type="tel"
                placeholder="712 345 678"
                value={phone.replace(/^254/, '').replace(/^0/, '')}
                onChange={(e) => {
                  let val = e.target.value.replace(/[^0-9]/g, '');
                  if (val.startsWith('0')) val = val.substring(1);
                  if (val.length > 9) val = val.substring(0, 9);
                  setPhone(val);
                }}
                className={`phone-input ${message && status === "error" ? "error" : ""}`}
                disabled={loading}
                autoFocus
              />
            </div>
            <p className="input-hint">Enter the number you use for M-PESA</p>
            {message && status === "error" && <p className="error-message">{message}</p>}
          </div>

          {/* Pay Button */}
          <button
            onClick={handleInitiatePayment}
            disabled={loading}
            className="pay-btn"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Sending...
              </>
            ) : (
              "💰 Tap to Pay KES 95"
            )}
          </button>

          {/* Status Messages - Simple and clear */}
          {status === "waiting" && (
            <div className="status-box waiting">
              <p>📲 {message}</p>
              <p className="status-small">Waiting for your PIN input...</p>
            </div>
          )}

          {status === "success" && (
            <div className="status-box success">
              <p>✅ Account Activated!</p>
              <p className="status-small">Redirecting you to dashboard...</p>
            </div>
          )}

          {status === "timeout" && (
            <div className="status-box timeout">
              <p>⏰ Payment not received</p>
              <button onClick={() => window.location.reload()} className="retry-link">
                Tap to try again
              </button>
            </div>
          )}

          {/* What you get */}
          <div className="benefits">
            <p className="benefits-title">✅ After payment, you get:</p>
            <ul>
              <li>🗳️ Access to all paid surveys</li>
              <li>💰 Get 1200 welcome bonus</li>
              <li>💰 Earn KES 150 - 500 per each survey</li>
              <li>⚡ Instant M-PESA withdrawals</li>
              <li>🏆 Unlock VIP & VVIP surveys</li>
            </ul>
          </div>
        </div>

        {/* Support */}
        <div className="support">
          <p className="support-text">Any Problem? <button onClick={() => window.open("https://wa.me/254118468826", "_blank")} className="support-link">Chat with support</button></p>
        </div>
      </div>
    </div>
  );
}