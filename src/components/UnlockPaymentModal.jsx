import React, { useState } from "react";
import { chatWazunguApi } from "../api/api";
import { toast } from "react-hot-toast";

const CHATWAZUNGU_GREEN = "#0DAA65";
const CHATWAZUNGU_DARK = "#0A0A0A";

export default function UnlockPaymentModal({ profile, onSuccess, onClose }) {
  const [step, setStep] = useState("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber) return;

    const normalizedPhone = phoneNumber.replace(/^0/, "254").replace("+", "");

    setLoading(true);
    try {
      const res = await chatWazunguApi.unlockProfile(profile.id, normalizedPhone);
      setPaymentRef(res.data.payment_reference);
      setStep("instructions");
      toast.success("STK push sent! Enter your M-Pesa PIN");
    } catch (err) {
      console.error("Unlock payment failed:", err);
      toast.error("Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      await chatWazunguApi.confirmUnlock(profile.id, {
        payment_reference: paymentRef,
        result_code: "200"
      });
      toast.success("Profile unlocked! You earned KES 500");
      onSuccess();
    } catch (err) {
      console.error("Payment confirmation failed:", err);
      toast.error("Could not confirm unlock. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="unlock-modal-overlay">
      <div className="unlock-modal">
        <div className="unlock-header">
          <h2>Unlock {profile.name}</h2>
          <button className="unlock-close" onClick={onClose}>✕</button>
        </div>

        <div className="unlock-body">
          {step === "phone" && (
            <>
              <div className="unlock-amount">KSH 99</div>
              <p className="unlock-instructions">
                Enter your phone number to pay KSH 99 via M-Pesa
              </p>
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
                  {loading ? "Processing…" : "Pay KSH 99"}
                </button>
              </form>
            </>
          )}

          {step === "instructions" && (
            <>
              <div className="unlock-amount">KSH 99</div>
              <div className="payment-instructions">
                <p>✅ STK push sent to {formatPhoneNumber(phoneNumber)}</p>
                <p>💳 Enter your M-Pesa PIN to complete payment</p>
                <p>💰 Reference: {paymentRef}</p>
                <p>🎁 You'll earn KSH 500 after successful payment</p>
              </div>
              <button
                className="confirm-btn"
                onClick={handleConfirmPayment}
                disabled={loading}
              >
                {loading ? "Confirming…" : "I've Paid - Confirm Unlock"}
              </button>
              <p className="retry-note">
                Didn't receive the STK push? Close and try again.
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
            border-radius: 16px;
            width: 100%;
            max-width: 400px;
            border: 1px solid #333;
            overflow: hidden;
          }

          .unlock-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background-color: #1A1A1A;
            color: white;
          }

          .unlock-header h2 {
            margin: 0;
            font-size: 18px;
          }

          .unlock-close {
            background: none;
            border: none;
            color: #aaa;
            font-size: 20px;
            cursor: pointer;
            padding: 6px 10px;
            border-radius: 6px;
            transition: all 0.2s;
          }

          .unlock-close:hover {
            color: white;
            background-color: #333;
          }

          .unlock-body {
            padding: 24px;
            text-align: center;
            color: white;
          }

          .unlock-amount {
            font-size: 36px;
            font-weight: 800;
            color: ${CHATWAZUNGU_GREEN};
            margin-bottom: 16px;
          }

          .unlock-instructions {
            color: #aaa;
            font-size: 14px;
            margin-bottom: 20px;
          }

          .phone-input-wrapper {
            display: flex;
            background-color: #2A2A2A;
            border-radius: 12px;
            padding: 4px 12px;
            margin-bottom: 20px;
            border: 1px solid #444;
          }

          .phone-prefix {
            color: #888;
            font-size: 16px;
            margin-right: 8px;
            padding-top: 8px;
          }

          .phone-input {
            flex: 1;
            background: none;
            border: none;
            color: white;
            font-size: 16px;
            outline: none;
            padding: 8px 0;
          }

          .pay-btn, .confirm-btn {
            width: 100%;
            padding: 14px;
            background-color: ${CHATWAZUNGU_GREEN};
            color: white;
            border: none;
            border-radius: 24px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            margin-bottom: 12px;
            transition: all 0.2s;
          }

          .pay-btn:hover:not(:disabled),
          .confirm-btn:hover:not(:disabled) {
            background-color: #1a8d55;
          }

          .pay-btn:disabled,
          .confirm-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .payment-instructions {
            text-align: left;
            background-color: #2A2A2A;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
          }

          .payment-instructions p {
            margin: 8px 0;
            font-size: 13px;
            color: #ccc;
          }

          .payment-instructions p:first-child {
            color: ${CHATWAZUNGU_GREEN};
            font-weight: 600;
          }

          .retry-note {
            font-size: 12px;
            color: #888;
            margin-top: 12px;
          }
        `}</style>
      </div>
    </div>
  );
}
