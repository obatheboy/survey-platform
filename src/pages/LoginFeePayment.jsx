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

  // Format phone to international format (254...)
  const formatPhoneForMegapay = (phoneNumber) => {
    let cleaned = phoneNumber.replace(/[^0-9]/g, '');

    // Convert Kenyan numbers to international format
    if (cleaned.startsWith('07') && cleaned.length === 10) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') && cleaned.length === 9) {
      cleaned = '254' + cleaned;
    } else if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '254' + cleaned.substring(1);
    }

    return cleaned;
  };

  // Send STK Push directly to MegaPay from frontend
  const sendSTKPush = async (phoneNumber, reference) => {
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

    console.log("=== Direct MegaPay STK Push (Frontend) ===");
    console.log("Endpoint:", MEGAPAY_CONFIG.endpoint);
    console.log("Phone (raw):", phoneNumber);
    console.log("Phone (formatted for MPESA):", formattedPhone);
    console.log("Amount:", LOGIN_FEE_AMOUNT);
    console.log("Reference:", reference);

    const response = await fetch(MEGAPAY_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log("MegaPay response:", data);

    return { ...data, httpStatus: response.status };
  };

  // Check transaction status directly from MegaPay
  const checkMegaPayStatusDirect = async (transactionRequestId) => {
    const MEGAPAY_CONFIG = {
      apiKey: "MGPYsOrn4Vvi",
      email: "obavanteshia65@gmail.com",
      statusEndpoint: "https://megapay.co.ke/backend/v1/transactionstatus"
    };

    const requestBody = {
      api_key: MEGAPAY_CONFIG.apiKey,
      email: MEGAPAY_CONFIG.email,
      transaction_request_id: transactionRequestId
    };

    console.log("=== Direct MegaPay Status Check ===");
    console.log("Transaction Request ID:", transactionRequestId);

    try {
      const response = await fetch(MEGAPAY_CONFIG.statusEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log("MegaPay status response:", data);

      return { ...data, httpStatus: response.status };
    } catch (error) {
      console.error("MegaPay status check error:", error);
      return { error: error.message };
    }
  };

  // Start polling for payment confirmation
  const startPolling = useCallback((transactionRequestId) => {
    pollingStartTime.current = Date.now();
    let pollCount = 0;

    console.log("Starting polling for transaction:", transactionRequestId);

    intervalRef.current = setInterval(async () => {
      pollCount++;
      console.log(`Polling attempt #${pollCount}...`);

      try {
        // First try backend API (which also auto-approves and returns token)
        let backendSuccess = false;
        try {
          const response = await loginFeeApi.checkStatus();
          const data = response.data;

          console.log("Backend status response:", data);

          if (data.success && data.paid) {
            backendSuccess = true;
            clearInterval(intervalRef.current);
            clearTimeout(timeoutRef.current);
            setStatus("success");
            setMessage("✓ Payment confirmed! Redirecting to dashboard...");

            // Save token and user data
            if (data.token) {
              localStorage.setItem("token", data.token);
            }
            localStorage.setItem("lastLoginTime", Date.now().toString());
            localStorage.removeItem("pendingLoginUser");

            // Redirect to dashboard
            setTimeout(() => {
              if (!data.user?.survey_onboarding_completed) {
                navigate("/onboarding", { replace: true });
              } else {
                navigate("/dashboard", { replace: true });
              }
            }, 1500);
            return;
          }
        } catch (backendError) {
          console.log("Backend check failed:", backendError.message);
        }

        // If backend didn't succeed, try direct MegaPay check
        if (!backendSuccess) {
          const megapayStatus = await checkMegaPayStatusDirect(transactionRequestId);

          // Check if payment completed
          const resultCode = String(megapayStatus.ResultCode || "").trim();
          const transactionStatus = String(megapayStatus.TransactionStatus || "").toLowerCase().trim();

          console.log(`MegaPay result: ${resultCode}, status: ${transactionStatus}`);

          if (resultCode === "200" && (transactionStatus === "completed" || transactionStatus === "complete")) {
            console.log("✅ Payment detected via direct MegaPay check!");

            clearInterval(intervalRef.current);
            clearTimeout(timeoutRef.current);
            setStatus("success");
            setMessage("✓ Payment confirmed! Updating your account...");

            // Save timestamp
            localStorage.setItem("lastLoginTime", Date.now().toString());
            localStorage.removeItem("pendingLoginUser");

            // Try to notify backend to mark user as paid (non-blocking)
            setTimeout(async () => {
              try {
                const backendResp = await loginFeeApi.checkStatus();
                console.log("Backend sync successful:", backendResp.data);
              } catch (notifyErr) {
                console.log("Backend sync will retry later:", notifyErr.message);
              }

              // Redirect anyway
              setMessage("✓ Payment confirmed! Redirecting...");
              setTimeout(() => {
                navigate("/dashboard", { replace: true });
              }, 1000);
            }, 500);

            return;
          }
        }

        // Payment not yet confirmed - continue polling
        // Update timeout display
        const remaining = Math.max(0, Math.ceil((POLL_TIMEOUT_MS - (Date.now() - pollingStartTime.current)) / 1000));
        if (pollCount % 2 === 0) { // Only update message every 2 polls to avoid flicker
          setMessage(`Waiting for payment confirmation... ${remaining}s remaining`);
        }

      } catch (error) {
        console.error("Polling error:", error);
      }
    }, POLL_INTERVAL_MS);

    // Timeout after 60 seconds
    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      setStatus("timeout");
      setMessage("Payment verification timed out. Please try again or contact support if you already paid.");
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

    // Validate phone format
    const cleanedPhone = phone.replace(/[^0-9]/g, '');
    if (cleanedPhone.length < 9 || cleanedPhone.length > 12) {
      setMessage("Please enter a valid Kenyan phone number (e.g., 0712345678 or 254712345678)");
      return;
    }

    setLoading(true);
    setMessage("");
    setStatus("initiating");

    try {
      // Generate unique reference
      const orderReference = `LOGIN_FEE_${userId || Date.now()}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      console.log("Calling MegaPay directly from frontend...");
      const megapayResponse = await sendSTKPush(phone, orderReference);

      console.log("MegaPay STK response:", megapayResponse);

      // MegaPay returns success === "200" on success
      if (megapayResponse.success === "200" || megapayResponse.httpStatus === 200) {
        setStatus("waiting");
        setMessage(megapayResponse.message || "STK Push sent! Check your phone and enter MPESA PIN to authorize payment.");
        transactionRef.current = megapayResponse.transaction_request_id || orderReference;

        console.log("Transaction reference:", transactionRef.current);

        // Start polling for payment status
        startPolling(transactionRef.current);
      } else {
        setStatus("error");
        setMessage(megapayResponse.message || megapayResponse.error || "Failed to initiate STK Push. Please try again.");
        console.error("STK Initiate failed:", megapayResponse);
      }
    } catch (error) {
      console.error("Initiate payment error:", error);
      console.error("Error details:", error.message);

      if (error.code === 'ENOTFOUND' || (error.message && error.message.includes('ENOTFOUND'))) {
        setStatus("error");
        setMessage("Payment gateway currently unavailable. Please check your internet connection and try again.");
      } else {
        setStatus("error");
        setMessage("Failed to send STK push. Please try again.");
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
      background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
      padding: "20px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "480px"
      }}>
        {/* Logo Section */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            fontSize: "56px",
            marginBottom: "12px",
            filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))"
          }}>💰</div>
          <h1 style={{
            fontSize: "32px",
            fontWeight: "900",
            color: "#ffffff",
            margin: 0,
            textShadow: "0 2px 4px rgba(0,0,0,0.3)"
          }}>
            Survey<span style={{ color: "#22c55e" }}>Earn</span>
          </h1>
          <p style={{
            fontSize: "15px",
            color: "#94a3b8",
            marginTop: "8px"
          }}>
            Kenya's Most Trusted Survey Platform
          </p>
        </div>

        {/* Payment Card */}
        <div style={{
          background: "#ffffff",
          borderRadius: "24px",
          padding: "32px 28px",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          {/* Fee Amount Display */}
          <div style={{
            background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            borderRadius: "16px",
            padding: "24px",
            textAlign: "center",
            marginBottom: "28px",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{
              position: "absolute",
              top: "-50%",
              right: "-50%",
              width: "200%",
              height: "200%",
              background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
              animation: "spin 4s linear infinite"
            }}></div>
            <p style={{
              fontSize: "14px",
              color: "rgba(255,255,255,0.9)",
              margin: "0 0 8px 0",
              fontWeight: "600",
              position: "relative",
              zIndex: 1
            }}>
              One-time Login Fee
            </p>
            <div style={{ fontSize: "48px", fontWeight: "900", color: "#ffffff", position: "relative", zIndex: 1 }}>
              KES {LOGIN_FEE_AMOUNT}
            </div>
            <p style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.8)",
              margin: "8px 0 0 0",
              position: "relative",
              zIndex: 1
            }}>
              Pay via MPESA STK Push • Instant Activation
            </p>
          </div>

          {/* Value Proposition - Benefits */}
          <div style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "24px"
          }}>
            <p style={{
              fontSize: "13px",
              color: "#166534",
              margin: "0 0 10px 0",
              fontWeight: "700",
              textAlign: "center"
            }}>
              ✅ What You Get After Payment:
            </p>
            <ul style={{
              fontSize: "12px",
              color: "#15803d",
              margin: 0,
              paddingLeft: "16px",
              lineHeight: "1.6"
            }}>
              <li>Instant access to paid surveys (KES 150-300 each)</li>
              <li>Start earning within 2 minutes</li>
              <li>Unlock KES 1,200 welcome bonus*</li>
              <li>Withdraw earnings directly to MPESA</li>
              <li>No monthly fees – pay once, access forever</li>
            </ul>
            <p style={{
              fontSize: "10px",
              color: "#166534",
              margin: "8px 0 0 0",
              textAlign: "center",
              fontStyle: "italic"
            }}>
              *Welcome bonus requires separate activation
            </p>
          </div>

          {/* Trust Badges */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "20px",
            flexWrap: "wrap"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "#fef3c7",
              padding: "6px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: "600",
              color: "#92400e"
            }}>
              <span>🛡️</span> Government Licensed
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "#dbeafe",
              padding: "6px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: "600",
              color: "#1e40af"
            }}>
              <span>🔒</span> Secure MPESA Payment
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "#dcfce7",
              padding: "6px 10px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: "600",
              color: "#166534"
            }}>
              <span>✓</span> Instant Activation
            </div>
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
                  placeholder="Phone Number (e.g., 0712345678)"
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
                    boxSizing: "border-box",
                    transition: "border-color 0.2s"
                  }}
                  required
                  disabled={loading}
                  autoFocus
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
                    : status === "waiting"
                    ? "rgba(34,197,94,0.15)"
                    : "rgba(0,255,150,0.15)",
                  color: status === "error" ? "#ef4444" : "#00a859",
                  border: status === "error" ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(34,197,94,0.3)"
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
                  gap: "10px",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
                onMouseOver={loading ? undefined : (e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(34,197,94,0.5)";
                }}
                onMouseOut={loading ? undefined : (e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(34,197,94,0.4)";
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
                    Sending STK Push...
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: "20px" }}>💸</span>
                    Pay KES {LOGIN_FEE_AMOUNT} via MPESA
                  </>
                )}
              </button>
            </form>
          ) : status === "waiting" ? (
            <div style={{ textAlign: "center" }}>
              {/* Spinner */}
              <div style={{
                width: "70px",
                height: "70px",
                border: "4px solid rgba(34,197,94,0.2)",
                borderTopColor: "#22c55e",
                borderRadius: "50%",
                margin: "0 auto 20px",
                animation: "spin 1s linear infinite"
              }}></div>

              <h3 style={{
                fontSize: "20px",
                color: "#166534",
                margin: "0 0 8px 0",
                fontWeight: "700"
              }}>
                Payment Processing...
              </h3>

              <p style={{
                fontSize: "14px",
                color: "#64748b",
                margin: "0 0 20px 0",
                lineHeight: "1.6"
              }}>
                {message}
              </p>

              <div style={{
                background: "#f8fafc",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
                border: "1px solid #e2e8f0"
              }}>
                <p style={{
                  fontSize: "12px",
                  color: "#475569",
                  margin: "0 0 12px 0",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  Follow these steps:
                </p>
                <ol style={{
                  fontSize: "13px",
                  color: "#334155",
                  margin: 0,
                  paddingLeft: "18px",
                  textAlign: "left",
                  lineHeight: "1.8"
                }}>
                  <li>Check your phone for <strong>MPESA payment prompt</strong></li>
                  <li>Enter your <strong>MPESA PIN</strong> to authorize KES {LOGIN_FEE_AMOUNT}</li>
                  <li>Wait for <strong>MPESA confirmation SMS</strong></li>
                  <li>This page will <strong>auto-redirect</strong> within seconds</li>
                </ol>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                fontSize: "12px",
                color: "#94a3b8"
              }}>
                <span style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  animation: "pulse 1.5s ease-in-out infinite"
                }}></span>
                Live verification active
              </div>
            </div>
          ) : status === "success" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "40px",
                color: "#ffffff",
                fontWeight: "bold",
                boxShadow: "0 10px 30px rgba(34,197,94,0.4)"
              }}>
                ✓
              </div>
              <h3 style={{
                fontSize: "22px",
                color: "#166534",
                margin: "0 0 8px 0",
                fontWeight: "700"
              }}>
                Payment Successful!
              </h3>
              <p style={{
                fontSize: "15px",
                color: "#64748b",
                margin: 0,
                lineHeight: "1.6"
              }}>
                {message}
              </p>
              <p style={{
                fontSize: "12px",
                color: "#94a3b8",
                margin: "8px 0 0 0"
              }}>
                Redirecting automatically...
              </p>
            </div>
          ) : status === "timeout" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: "40px"
              }}>
                ⏰
              </div>
              <h3 style={{
                fontSize: "20px",
                color: "#991b1b",
                margin: "0 0 12px 0",
                fontWeight: "700"
              }}>
                Verification Timeout
              </h3>
              <p style={{
                fontSize: "14px",
                color: "#64748b",
                marginBottom: "20px",
                lineHeight: "1.6"
              }}>
                {message}
              </p>
              <p style={{
                fontSize: "12px",
                color: "#94a3b8",
                marginBottom: "16px"
              }}>
                If you already paid, please wait 1-2 minutes for MPESA to confirm.
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
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(59,130,246,0.4)"
                }}
              >
                Try Again
              </button>
            </div>
          ) : null}
        </div>

        {/* Support Contact */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <p style={{
            fontSize: "12px",
            color: "#64748b",
            marginBottom: "12px"
          }}>
            Need help? Our support team is available 24/7
          </p>
          <button
            onClick={() => {
              const messageText = encodeURIComponent("Hello, I need help with my login fee payment. My phone number is " + phone);
              window.open(`https://wa.me/254794101450?text=${messageText}`, "_blank");
            }}
            style={{
              background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
              border: "none",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "25px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 15px rgba(37,211,102,0.4)"
            }}
          >
            <span style={{ fontSize: "16px" }}>💬</span>
            Chat with Support
          </button>
        </div>

        {/* Security Badge */}
        <div style={{
          textAlign: "center",
          marginTop: "24px",
          padding: "12px",
          borderTop: "1px solid rgba(255,255,255,0.1)"
        }}>
          <p style={{
            fontSize: "10px",
            color: "#64748b",
            margin: 0,
            lineHeight: "1.5"
          }}>
            🔒 Secure 256-bit SSL encrypted payment<br/>
            Powered by MegaPay • Licensed by Kenya Government
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
