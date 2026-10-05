import { useState, useRef } from "react";
import { chatWazunguApi } from "../api/api";
import { toast } from "react-hot-toast";
import { useCurrency } from "../contexts/CurrencyContext.jsx";
import "./UnlockPaymentModal.css";

export default function UnlockPaymentModal({ profile, userPhone, onSuccess, onClose }) {
  const { format, isUganda } = useCurrency();
  const [step, setStep] = useState("phone");
  const [phoneNumber, setPhoneNumber] = useState(userPhone || "");
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [smsText, setSmsText] = useState("");
  const pollRef = useRef(null);
  const fallbackRef = useRef(null);

  const startPaymentPolling = (txId) => {
    let attempts = 0;
    const maxAttempts = 40;
    const POLL_INTERVAL_MS = 3000;
    const INITIAL_DELAY_MS = 8000;

    const stop = (errorMsg) => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      if (fallbackRef.current) { clearTimeout(fallbackRef.current); fallbackRef.current = null; }
      setPolling(false);
      if (errorMsg) {
        toast.error(errorMsg);
      }
    };

    const doPoll = async () => {
      attempts++;
      try {
        const res = await chatWazunguApi.confirmUnlock(profile.id, {
          transaction_request_id: txId
        });

        if (res.data.is_unlocked) {
          stop();
          toast.success("Profile unlocked! You earned " + format(500));
          onSuccess();
          return;
        }

        if (!res.data.is_unlocked && attempts < maxAttempts) {
          console.log(`⏳ Poll ${attempts}: not confirmed yet, continuing...`);
          return;
        }

        if (attempts >= maxAttempts) {
          stop("Payment verification timeout. Please check your M-Pesa and try again.");
        }
      } catch (err) {
        console.error(`Poll attempt ${attempts} error:`, err);
        if (attempts >= maxAttempts) {
          stop("Payment verification timeout. Please try again or contact support.");
        }
      }
    };

    const schedulePoll = () => {
      pollRef.current = setInterval(doPoll, POLL_INTERVAL_MS);
      fallbackRef.current = setTimeout(() => {
        stop("Payment not confirmed. Please check your M-Pesa and try again.");
      }, 120000); // 2 minute total window
    };

    setTimeout(schedulePoll, INITIAL_DELAY_MS);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber) return;

    if (isUganda) {
      setStep("polling");
      setPolling(false);
      return;
    }

    const normalizedPhone = phoneNumber.replace(/^0/, "254").replace("+", "");

    setLoading(true);
    try {
      const res = await chatWazunguApi.unlockProfile(profile.id, normalizedPhone);
      setTransactionId(res.data.transaction_request_id);
      setStep("polling");
      setPolling(true);
      toast.success("STK push sent! Enter your M-Pesa PIN");
      startPaymentPolling(res.data.transaction_request_id);
    } catch (err) {
      console.error("Unlock payment failed:", err);
      toast.error("Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (fallbackRef.current) { clearTimeout(fallbackRef.current); fallbackRef.current = null; }
    setPolling(false);
  };

  const handleClose = () => {
    stopPolling();
    onClose();
  };

  const handlePhoneNumberChange = (e) => {
    let value = e.target.value.replace(/\s/g, "");
    if (value.length > 12) return;
    setPhoneNumber(value);
  };

  const formatPhoneNumber = (phone) => {
    if (phone.length <= 3) return phone;
    if (phone.length <= 6) return `${phone.slice(0, 3)}-${phone.slice(3)}`;
    if (phone.length <= 9) return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
    return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
  };

  const handleSmsSubmit = async (e) => {
    e.preventDefault();
    if (!smsText.trim()) {
      toast.error("Please paste your SMS confirmation");
      return;
    }
    setLoading(true);
    try {
      const res = await chatWazunguApi.confirmUnlock(profile.id, {
        sms_confirmation: smsText,
        phone: phoneNumber,
      });
      if (res.data?.is_unlocked) {
        toast.success("Profile unlocked! You earned " + format(500));
        onSuccess();
        onClose();
      } else {
        toast.error("Payment not confirmed. Check your SMS and try again.");
      }
    } catch (err) {
      console.error("SMS confirmation failed:", err);
      toast.error("Failed to verify payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="unlock-modal-overlay">
      <div className="unlock-modal">
        <div className="unlock-header">
          <h2>Unlock {profile.name}</h2>
          <button className="unlock-close" onClick={handleClose}>✕</button>
        </div>

        <div className="unlock-body">
          {step === "phone" && (
            <>
              <div className="unlock-amount">{format(99)}</div>
              {isUganda ? (
                <div style={{ marginTop: "8px", textAlign: "left" }}>
                  <p style={{ color: "#4ade80", marginBottom: "12px", fontWeight: 700, fontSize: "14px", textAlign: "center" }}>
                    ⚠ Use MTN or Airtel International Transfer to send money to Kenya (Safaricom/M-Pesa)
                  </p>
                  <div className="activate-step-box" style={{ borderLeft: "4px solid #16a34a", marginBottom: "12px" }} >
                    <span className="step-number">1</span>
                    <div>
                      <strong style={{ color: "#86efac", fontWeight: 900, display: "block", marginBottom: "4px", fontSize: "14px" }}>📱 UGANDA MTN PAYMENT</strong>
                      <div style={{ fontSize: "12px", color: "#bbf7d0", lineHeight: "1.7" }}>
                        <strong>Dial:</strong> *165#<br/>
                        <strong>Select:</strong> Send Money<br/>
                        <strong>Choose:</strong> International Transfer<br/>
                        <strong>Select:</strong> Kenya (Safaricom/M-Pesa)<br/>
                        <strong>Recipient:</strong> 254794101450<br/>
                        <strong>Name:</strong> OBADIAH NYAKUNDI OTOKI<br/>
                        <strong>Amount:</strong> {format(99)}<br/>
                        <strong>Reason:</strong> ChatWazungu Unlock
                      </div>
                    </div>
                  </div>
                  <div className="activate-step-box" style={{ borderLeft: "4px solid #ea580c", marginBottom: "20px" }} >
                    <span className="step-number" style={{ background: "#ea580c" }}>2</span>
                    <div>
                      <strong style={{ color: "#fed7aa", fontWeight: 900, display: "block", marginBottom: "4px", fontSize: "14px" }}>📱 UGANDA AIRTEL PAYMENT</strong>
                      <div style={{ fontSize: "12px", color: "#fdba74", lineHeight: "1.7" }}>
                        <strong>Dial:</strong> *185#<br/>
                        <strong>Select:</strong> Send Money<br/>
                        <strong>Choose:</strong> International Transfer<br/>
                        <strong>Select:</strong> Kenya (Safaricom/M-Pesa)<br/>
                        <strong>Recipient:</strong> 254794101450<br/>
                        <strong>Name:</strong> OBADIAH NYAKUNDI OTOKI<br/>
                        <strong>Amount:</strong> {format(99)}<br/>
                        <strong>Reason:</strong> ChatWazungu Unlock
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="unlock-instructions">
                  Unlock this profile now and start chatting instantly. You will also earn <strong>{format(500)}</strong> as a reward for unlocking.
                </p>
              )}
              <form onSubmit={handleSubmit}>
                <div className="phone-input-wrapper">
                  <span className="phone-prefix">+254</span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneNumberChange}
                    placeholder="700 000 000"
                    className="phone-input"
                    maxLength={12}
                  />
                </div>
                <button
                  type="submit"
                  className="pay-btn"
                  disabled={loading || !phoneNumber}
                >
                  {loading ? "Processing…" : isUganda ? "I've Paid - Unlock Profile" : `Unlock & Chat Now — ${format(99)}`}
                </button>
              </form>
            </>
          )}

          {step === "polling" && (
            <>
              <div className="unlock-amount">{format(99)}</div>
              <div className="payment-instructions">
              {isUganda ? (
                <>
                  <p>✅ Payment sent to {formatPhoneNumber(phoneNumber)}</p>
                  <p>📋 Paste your MTN/Airtel SMS confirmation below</p>
                  <p>💰 Reference: {transactionId || "Manual"}</p>
                  <p>🎁 You'll earn <strong style={{ color: "#fbbf24" }}>{format(500)}</strong> instantly after verification</p>
                </>
              ) : (
                <>
                  <p>✅ STK push sent to {formatPhoneNumber(phoneNumber)}</p>
                  <p>💳 Enter your M-Pesa PIN to complete payment</p>
                  <p>💰 Reference: {transactionId}</p>
                  <p>🎁 You'll earn <strong style={{ color: "#fbbf24" }}>{format(500)}</strong> instantly after verification</p>
                </>
              )}
              </div>

              {isUganda ? (
                <form onSubmit={handleSmsSubmit}>
                  <textarea
                    value={smsText}
                    onChange={(e) => setSmsText(e.target.value)}
                    placeholder="Paste your MTN/Airtel SMS confirmation here..."
                    rows={4}
                    className="sms-input"
                  />
                  <button
                    type="submit"
                    className="pay-btn"
                    disabled={loading || !smsText.trim()}
                  >
                    {loading ? "Verifying..." : "Submit SMS Confirmation"}
                  </button>
                </form>
              ) : (
                <div style={{ margin: "16px 0", color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>
                  {polling ? "⏳ Verifying payment..." : "✅ Payment confirmed!"}
                </div>
              )}

              <p className="retry-note">
                {isUganda ? "Paste your SMS confirmation above" : "Didn't receive the STK push? Close and try again."}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
