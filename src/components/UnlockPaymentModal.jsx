import React, { useState, useRef } from "react";
import { chatWazunguApi } from "../api/api";
import { toast } from "react-hot-toast";
import { useCurrency } from "../contexts/CurrencyContext.jsx";

const CHATWAZUNGU_GREEN = "#0DAA65";
const CHATWAZUNGU_DARK = "#0A0A0A";

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

  const styles = {
    stepBox: {
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
      padding: "10px 12px",
      background: "rgba(255,255,255,0.04)",
      borderRadius: "8px",
      marginBottom: "8px",
      border: "1px solid rgba(255,255,255,0.08)",
    },
    stepNumber: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "22px",
      height: "22px",
      borderRadius: "50%",
      background: "#16a34a",
      color: "white",
      fontSize: "11px",
      fontWeight: "800",
      flexShrink: 0,
    },
  };

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

    // Uganda: manual payment - just move to SMS submission step
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
                <div style={{ marginTop: "8px" }}>
                  <p style={{ ...styles.caption, color: "#16a34a", marginBottom: "8px" }}>
                    ⚠ Use MTN or Airtel International Transfer to send money to Kenya (Safaricom/M-Pesa)
                  </p>
                  <div className="activate-step-box" style={{...styles.stepBox, borderLeft: "4px solid #16a34a", marginBottom: "8px"}} >
                    <span style={{...styles.stepNumber, background: "#16a34a"}}>1</span>
                    <strong style={{color: "#166534", fontWeight: 900, display: "block", marginBottom: "4px" }}>📱 UGANDA MTN PAYMENT</strong>
                    <div style={{ fontSize: "12px", color: "#15803d", lineHeight: "1.6" }}>
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
                  <div className="activate-step-box" style={{...styles.stepBox, borderLeft: "4px solid #ea580c", marginBottom: "16px"}} >
                    <span style={{...styles.stepNumber, background: "#ea580c"}}>2</span>
                    <strong style={{color: "#9a3412", fontWeight: 900, display: "block", marginBottom: "4px" }}>📱 UGANDA AIRTEL PAYMENT</strong>
                    <div style={{ fontSize: "12px", color: "#9a3412", lineHeight: "1.6" }}>
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
              ) : (
                <p className="unlock-instructions">
                  Enter your phone number to pay {format(99)} via M-Pesa
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
                  {loading ? "Processing…" : isUganda ? "I've Paid - Submit SMS" : `Pay ${format(99)}`}
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
                    <p>🎁 You'll earn {format(500)} after successful payment</p>
                  </>
                ) : (
                  <>
                    <p>✅ STK push sent to {formatPhoneNumber(phoneNumber)}</p>
                    <p>💳 Enter your M-Pesa PIN to complete payment</p>
                    <p>💰 Reference: {transactionId}</p>
                    <p>🎁 You'll earn {format(500)} after successful payment</p>
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
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      border: "2px solid #444",
                      background: "#2A2A2A",
                      color: "#fff",
                      fontSize: "13px",
                      fontFamily: "inherit",
                      resize: "vertical",
                      marginBottom: "14px",
                      boxSizing: "border-box",
                    }}
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
                <div style={{ margin: "16px 0", color: "#888", fontSize: "13px" }}>
                  {polling ? "⏳ Verifying payment..." : "✅ Payment confirmed!"}
                </div>
              )}

              <p className="retry-note">
                {isUganda ? "Paste your SMS confirmation above" : "Didn't receive the STK push? Close and try again."}
              </p>
            </>
          )}
        </div>

        <style jsx>{`
          .unlock-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            z-index: 1100;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
          }

.unlock-modal {
            background-color: ${CHATWAZUNGU_DARK};
            border-radius: 20px;
            width: 100%;
            max-width: 440px;
            border: 1px solid #333;
            overflow: hidden;
          }

          .unlock-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px;
            background-color: #1A1A1A;
            color: white;
          }

          .unlock-header h2 {
            margin: 0;
            font-size: 20px;
          }

          .unlock-close {
            background: none;
            border: none;
            color: #aaa;
            font-size: 24px;
            cursor: pointer;
            padding: 8px 12px;
            border-radius: 6px;
            transition: all 0.2s;
          }

          .unlock-close:hover {
            color: white;
            background-color: #333;
          }

          .unlock-body {
            padding: 28px;
            text-align: center;
            color: white;
          }

          .unlock-amount {
            font-size: 42px;
            font-weight: 800;
            color: ${CHATWAZUNGU_GREEN};
            margin-bottom: 20px;
            letterSpacing: "-1px";
          }

          .unlock-instructions {
            color: #aaa;
            font-size: 15px;
            margin-bottom: 24px;
            lineHeight: 1.5;
          }

          .phone-input-wrapper {
            display: flex;
            background-color: #2A2A2A;
            border-radius: 14px;
            padding: 6px 16px;
            margin-bottom: 24px;
            border: 1px solid #444;
          }

          .phone-prefix {
            color: #888;
            font-size: 18px;
            margin-right: 12px;
            padding-top: 4px;
          }

          .phone-input {
            flex: 1;
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            outline: none;
            padding: 10px 0;
          }

          .pay-btn {
            width: 100%;
            padding: 18px;
            background-color: ${CHATWAZUNGU_GREEN};
            color: white;
            border: none;
            border-radius: 28px;
            font-size: 17px;
            font-weight: 700;
            cursor: pointer;
            margin-bottom: 14px;
            transition: all 0.2s;
          }

          .pay-btn:hover:not(:disabled) {
            background-color: #1a8d55;
            transform: translateY(-1px);
          }

          .pay-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .payment-instructions {
            text-align: left;
            background-color: #2A2A2A;
            border-radius: 14px;
            padding: 20px;
            margin-bottom: 24px;
          }

          .payment-instructions p {
            margin: 10px 0;
            font-size: 14px;
            color: #ccc;
            lineHeight: 1.5;
          }

          .payment-instructions p:first-child {
            color: ${CHATWAZUNGU_GREEN};
            font-weight: 700;
            fontSize: 15px;
            marginBottom: 12px;
          }

          .retry-note {
            font-size: 13px;
            color: #888;
            margin-top: 16px;
            lineHeight: 1.4;
          }

          .activate-step-box {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 14px 16px;
            background: rgba(255,255,255,0.04);
            border-radius: 10px;
            margin-bottom: 10px;
            border: 1px solid rgba(255,255,255,0.08);
          }

          .stepNumber {
            display: flex;
            align-items: center;
            justifyContent: center;
            width: 26px;
            height: 26px;
            borderRadius: 50%;
            background: #16a34a;
            color: white;
            fontSize: 13px,
            fontWeight: 800,
            flexShrink: 0,
          }
        `}</style>
      </div>
    </div>
  );
}
