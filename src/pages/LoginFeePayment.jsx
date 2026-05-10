import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginFeeApi } from "../api/api";

export default function LoginFeePayment() {
  const navigate = useNavigate();
  const location = useLocation();

  const pendingUser = JSON.parse(localStorage.getItem("pendingLoginUser") || "{}");
  const userId = location.state?.userId || pendingUser.id;
  const phoneFromState = location.state?.phone || pendingUser.phone;

  const [phone, setPhone] = useState(phoneFromState || "");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | initiating | waiting | success | timeout | error
  const [message, setMessage] = useState("");
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const pollingStartTime = useRef(null);
  const transactionRef = useRef(null);

  const LOGIN_FEE_AMOUNT = 95;
  const POLL_INTERVAL_MS = 3000; // 3 seconds
  const POLL_TIMEOUT_MS = 60000; // 60 seconds

  // Clean up polling and timeout on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Start polling for payment confirmation
  const startPolling = useCallback((transactionRequestId) => {
    pollingStartTime.current = Date.now();

    intervalRef.current = setInterval(async () => {
      try {
        const response = await loginFeeApi.checkStatus();
        const data = response.data;

        console.log("Polling response:", data);

        if (data.success && data.paid) {
          // Payment confirmed!
          clearInterval(intervalRef.current);
          clearTimeout(timeoutRef.current);
          setStatus("success");
          setMessage("✓ Payment confirmed! Logging you in...");

          // Save token and user data
          if (data.token) {
            localStorage.setItem("token", data.token);
          }
          localStorage.setItem("lastLoginTime", Date.now().toString());
          localStorage.removeItem("pendingLoginUser");

          // Redirect to appropriate page
          setTimeout(() => {
            if (!data.user?.survey_onboarding_completed) {
              navigate("/onboarding", { replace: true });
            } else {
              navigate("/dashboard", { replace: true });
            }
          }, 1500);
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, POLL_INTERVAL_MS);

    // Timeout after 60 seconds
    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      setStatus("timeout");
      setMessage("Payment verification timed out. Please try again or contact support.");
    }, POLL_TIMEOUT_MS);
  }, [navigate]);

  // Handle payment initiation
  const handleInitiatePayment = async (e) => {
    e.preventDefault();

    console.log("=== PAY BUTTON CLICKED ===");
    console.log("Phone entered:", phone);
    console.log("Token from localStorage:", localStorage.getItem("token"));

    if (!phone.trim()) {
      setMessage("Please enter your phone number");
      return;
    }

    // Validate phone format (basic validation)
    const cleanedPhone = phone.replace(/[^0-9]/g, '');
    if (cleanedPhone.length < 9 || cleanedPhone.length > 12) {
      setMessage("Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)");
      return;
    }

    setLoading(true);
    setMessage("");
    setStatus("initiating");

    try {
      console.log("Calling loginFeeApi.initiate...");
      const response = await loginFeeApi.initiate(phone);
      const data = response.data;

      console.log("Initiate response:", data);

      if (data.success) {
        setStatus("waiting");
        setMessage(data.message || "STK Push sent! Check your phone and enter MPESA PIN.");
        transactionRef.current = data.transaction_request_id || data.reference;

        console.log("Transaction reference:", transactionRef.current);

        // Start polling for payment status
        startPolling(transactionRef.current);
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to initiate payment. Please try again.");
        console.error("STK Initiate failed:", data);
      }
    } catch (error) {
      console.error("Initiate payment error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      // Handle DNS/network errors specifically
      if (error.code === 'ENOTFOUND' || (error.message && error.message.includes('ENOTFOUND'))) {
        setStatus("error");
        setMessage("Payment gateway unavailable. Please check your internet connection and try again.");
      } else if (error.response?.status === 401) {
        setStatus("error");
        setMessage("Session expired. Please log in again.");
        setTimeout(() => navigate("/auth?mode=login"), 2000);
      } else {
        setStatus("error");
        setMessage(error.response?.data?.message || "Failed to initiate payment. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#1e293b"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "420px",
        padding: "24px"
      }}>
        {/* Logo Section */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>💰</div>
          <h1 style={{
            fontSize: "28px",
            fontWeight: "900",
            color: "#ffffff",
            margin: 0
          }}>
            Survey<span style={{ color: "#667eea" }}>Earn</span>
          </h1>
          <p style={{
            fontSize: "14px",
            color: "#94a3b8",
            marginTop: "8px"
          }}>
            One-time Login Fee Payment
          </p>
        </div>

        {/* Payment Card */}
        <div style={{
          background: "#ffffff",
          borderRadius: "24px",
          padding: "28px 24px",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.4)"
        }}>
          {/* Fee Amount Display */}
          <div style={{
            background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            borderRadius: "16px",
            padding: "20px",
            textAlign: "center",
            marginBottom: "24px"
          }}>
            <p style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.9)",
              margin: "0 0 8px 0",
              fontWeight: "600"
            }}>
              One-time Login Fee
            </p>
            <div style={{ fontSize: "42px", fontWeight: "900", color: "#ffffff" }}>
              KES {LOGIN_FEE_AMOUNT}
            </div>
            <p style={{
              fontSize: "11px",
              color: "rgba(255,255,255,0.8)",
              margin: "8px 0 0 0"
            }}>
              Pay via MPESA STK Push
            </p>
          </div>

          {/* Phone Input Form */}
          {(status === "idle" || status === "error" || status === "initiating") ? (
            <form onSubmit={handleInitiatePayment}>
              <div style={{
                position: "relative",
                marginBottom: "16px"
              }}>
                <span style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "16px",
                  zIndex: 1
                }}>
                  📱
                </span>
                <input
                  type="tel"
                  placeholder="Phone Number (0712345678)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "16px 16px 16px 44px",
                    borderRadius: "14px",
                    border: status === "error" ? "2px solid #ef4444" : "2px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#1e293b",
                    fontSize: "16px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                  required
                  disabled={loading}
                />
              </div>

              {message && (
                <div style={{
                  padding: "12px",
                  borderRadius: "10px",
                  textAlign: "center",
                  fontSize: "13px",
                  marginBottom: "16px",
                  background: status === "error"
                    ? "rgba(239,68,68,0.15)"
                    : "rgba(0,255,150,0.15)",
                  color: status === "error" ? "#ef4444" : "#00ff96"
                }}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "18px",
                  borderRadius: "16px",
                  border: "none",
                  background: loading
                    ? "#94a3b8"
                    : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  color: "#ffffff",
                  fontSize: "17px",
                  fontWeight: "800",
                  cursor: loading ? "not-allowed" : "pointer",
                  marginTop: "12px",
                  boxShadow: loading
                    ? "none"
                    : "0 6px 20px rgba(34,197,94,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px"
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      display: "inline-block",
                      width: "18px",
                      height: "18px",
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#ffffff",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite"
                    }}></span>
                    Processing...
                  </>
                ) : (
                  `Pay KES ${LOGIN_FEE_AMOUNT} via MPESA`
                )}
              </button>
            </form>
          ) : status === "waiting" ? (
            <div style={{ textAlign: "center" }}>
              {/* Spinner */}
              <div style={{
                width: "60px",
                height: "60px",
                border: "4px solid rgba(34,197,94,0.2)",
                borderTopColor: "#22c55e",
                borderRadius: "50%",
                margin: "0 auto 20px",
                animation: "spin 1s linear infinite"
              }}></div>

              <h3 style={{
                fontSize: "18px",
                color: "#1e293b",
                margin: "0 0 8px 0",
                fontWeight: "700"
              }}>
                Waiting for Payment
              </h3>

              <p style={{
                fontSize: "14px",
                color: "#64748b",
                margin: "0 0 16px 0",
                lineHeight: "1.5"
              }}>
                {message}
              </p>

              <div style={{
                background: "#f1f5f9",
                borderRadius: "12px",
                padding: "14px",
                marginBottom: "16px"
              }}>
                <p style={{
                  fontSize: "12px",
                  color: "#64748b",
                  margin: "0 0 6px 0",
                  fontWeight: "600"
                }}>
                  Instructions:
                </p>
                <ol style={{
                  fontSize: "12px",
                  color: "#475569",
                  margin: 0,
                  paddingLeft: "18px",
                  textAlign: "left"
                }}>
                  <li>Check your phone for MPESA prompt</li>
                  <li>Enter your MPESA PIN to authorize</li>
                  <li>Wait for confirmation SMS</li>
                  <li>This page will auto-redirect on success</li>
                </ol>
              </div>

              <p style={{
                fontSize: "12px",
                color: "#94a3b8",
                margin: 0
              }}>
                Timeout in {Math.max(0, Math.ceil((POLL_TIMEOUT_MS - (Date.now() - pollingStartTime.current)) / 1000))}s
              </p>
            </div>
          ) : status === "success" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "36px",
                color: "#ffffff",
                fontWeight: "bold",
                animation: "pulse 1.5s ease-in-out infinite"
              }}>
                ✓
              </div>
              <h3 style={{
                fontSize: "20px",
                color: "#1e293b",
                margin: "0 0 8px 0",
                fontWeight: "700"
              }}>
                Payment Confirmed!
              </h3>
              <p style={{
                fontSize: "14px",
                color: "#64748b",
                margin: 0
              }}>
                {message}
              </p>
            </div>
          ) : status === "timeout" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                background: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "36px"
              }}>
                ⏰
              </div>
              <h3 style={{
                fontSize: "18px",
                color: "#1e293b",
                margin: "0 0 12px 0",
                fontWeight: "700"
              }}>
                Verification Timed Out
              </h3>
              <p style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "20px",
                lineHeight: "1.5"
              }}>
                {message}
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                Try Again
              </button>
            </div>
          ) : null}
        </div>

        {/* Support Contact */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <button
            onClick={() => {
              const messageText = encodeURIComponent("Hello, I need help with login fee payment.");
              window.open(`https://wa.me/254794101450?text=${messageText}`, "_blank");
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: "13px",
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            Need help? Contact support
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
