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
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const pollingStartTime = useRef(null);
  const transactionRequestIdRef = useRef(null); // Store the MegaPay transaction ID

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

  const startPolling = useCallback((transactionRequestId, isDirectFallback = false) => {
    pollingStartTime.current = Date.now();
    let pollCount = 0;

    console.log(`Polling started (mode: ${isDirectFallback ? 'direct-fallback' : 'backend'})`);

    const poll = async () => {
      pollCount++;

      // Try backend first
      try {
        const params = isDirectFallback ? { transaction_request_id: transactionRequestId } : {};
        const resp = await loginFeeApi.checkStatus(params);
        const data = resp.data;
        console.log("Backend status check:", data);

        if (data.success && data.paid) {
          clearInterval(intervalRef.current);
          clearTimeout(timeoutRef.current);
          setStatus("success");
          setMessage("✓ Payment confirmed! Redirecting...");
          if (data.token) localStorage.setItem("token", data.token);
          localStorage.setItem("lastLoginTime", Date.now().toString());
          localStorage.removeItem("pendingLoginUser");
          localStorage.removeItem("login_fee_verified_temp");
          localStorage.removeItem("login_fee_verified_at");
          setTimeout(() => {
            if (!data.user?.survey_onboarding_completed) {
              navigate("/onboarding", { replace: true });
            } else {
              navigate("/dashboard", { replace: true });
            }
          }, 1000);
          return;
        }
      } catch (err) {
        console.log("Backend check failed:", err.message);
      }

      // If using direct fallback, check MegaPay directly
      if (isDirectFallback) {
        try {
          const megapayStatus = await checkMegaPayStatusDirect(transactionRequestId);
          const resultCode = String(megapayStatus.ResultCode || "").trim();
          const transactionStatus = String(megapayStatus.TransactionStatus || "").toLowerCase().trim();

          if (resultCode === "200" && (transactionStatus === "completed" || transactionStatus === "complete")) {
            console.log("✅ Payment confirmed via MegaPay");
            clearInterval(intervalRef.current);
            clearTimeout(timeoutRef.current);
            setStatus("success");
            setMessage("✓ Payment confirmed! Redirecting...");

            // Set temp verification flag immediately
            try {
              localStorage.setItem("login_fee_verified_temp", "true");
              localStorage.setItem("login_fee_verified_at", Date.now());
              localStorage.setItem("lastLoginTime", Date.now().toString());
              localStorage.removeItem("pendingLoginUser");
              console.log("✅ Temp verification flag set");
            } catch (e) {
              console.error("Failed to set temp flag:", e);
            }

            // Background sync with backend (non-blocking)
            setTimeout(async () => {
              try {
                await loginFeeApi.checkStatus({ transaction_request_id: transactionRequestId });
                console.log("Backend sync complete – DB updated");
              } catch (syncErr) {
                console.log("Backend sync will retry");
              }
            }, 0);

            // Redirect after brief delay
            setTimeout(() => {
              navigate("/dashboard", { replace: true });
            }, 1000);
            return;
          }
        } catch (megapayErr) {
          console.error("MegaPay direct check error:", megapayErr);
        }
      }

      // Timeout check
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
  }, [navigate]);

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
      // Try backend endpoint first
      try {
        const response = await loginFeeApi.initiate(phone);
        const data = response.data;
        console.log("Backend initiate response:", data);

        if (data.success) {
          setStatus("waiting");
          setMessage(data.message || "STK Push sent! Check your phone and enter MPESA PIN.");
          transactionRequestIdRef.current = data.transaction_request_id || data.reference;
          console.log("Transaction reference:", transactionRequestIdRef.current);
          startPolling(transactionRequestIdRef.current, false);
          return;
        } else {
          throw new Error(data.message || "Backend initiation failed");
        }
      } catch (backendInitErr) {
        console.log("Backend initiation failed (expected if not redeployed):", backendInitErr.message);
        // Fallback to direct MegaPay
        const orderReference = `LOGIN_FEE_${userId || Date.now()}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const megapayResponse = await sendSTKPushDirect(phone, orderReference);

        if (megapayResponse.success === "200" || megapayResponse.httpStatus === 200) {
          setStatus("waiting");
          setMessage(megapayResponse.message || "STK Push sent! Check your phone and enter MPESA PIN.");
          transactionRequestIdRef.current = megapayResponse.transaction_request_id || orderReference;
          console.log("Transaction reference:", transactionRequestIdRef.current);
          startPolling(transactionRequestIdRef.current, true);
        } else {
          setStatus("error");
          setMessage(megapayResponse.message || megapayResponse.error || "Failed to send STK Push.");
        }
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
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
      padding: "20px"
    }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "56px", marginBottom: "12px" }}>💰</div>
          <h1 style={{ fontSize: "32px", fontWeight: "900", color: "#fff", margin: 0 }}>
            Survey<span style={{ color: "#22c55e" }}>Earn</span>
          </h1>
          <p style={{ fontSize: "15px", color: "#94a3b8", marginTop: "8px" }}>
            Kenya's Most Trusted Survey Platform
          </p>
        </div>

        {/* Payment Card */}
        <div style={{
          background: "#fff",
          borderRadius: "24px",
          padding: "32px 28px",
          boxShadow: "0 25px 80px rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          {/* Amount */}
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
              position: "absolute", top: "-50%", right: "-50%", width: "200%", height: "200%",
              background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
              animation: "spin 4s linear infinite"
            }}></div>
            <p style={{
              fontSize: "14px", color: "rgba(255,255,255,0.9)",
              margin: "0 0 8px 0", fontWeight: "600", position: "relative", zIndex: 1
            }}>
              One-time Login Fee
            </p>
            <div style={{ fontSize: "48px", fontWeight: "900", color: "#fff", position: "relative", zIndex: 1 }}>
              KES {LOGIN_FEE_AMOUNT}
            </div>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.8)", margin: "8px 0 0 0", position: "relative", zIndex: 1 }}>
              Pay via MPESA STK Push • Instant Activation
            </p>
          </div>

          {/* Value Proposition */}
          <div style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "24px"
          }}>
            <p style={{ fontSize: "13px", color: "#166534", margin: "0 0 10px 0", fontWeight: "700", textAlign: "center" }}>
              ✅ What You Get After Payment:
            </p>
            <ul style={{
              fontSize: "12px", color: "#15803d", margin: 0, paddingLeft: "16px", lineHeight: "1.6"
            }}>
              <li>Instant access to high-paying surveys (KES 150–300 each)</li>
              <li>Start earning within 2 minutes</li>
              <li>Unlock KES 1,200 welcome bonus*</li>
              <li>Withdraw directly to MPESA</li>
              <li>One-time payment – no monthly fees</li>
            </ul>
            <p style={{ fontSize: "10px", color: "#166534", margin: "8px 0 0 0", textAlign: "center", fontStyle: "italic" }}>
              *Welcome bonus requires separate activation
            </p>
          </div>

          {/* Trust Badges */}
          <div style={{
            display: "flex", justifyContent: "center", gap: "12px", marginBottom: "20px", flexWrap: "wrap"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#fef3c7", padding: "6px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", color: "#92400e" }}>
              <span>🛡️</span> Government Licensed
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#dbeafe", padding: "6px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", color: "#1e40af" }}>
              <span>🔒</span> Secure MPESA
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#dcfce7", padding: "6px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", color: "#166534" }}>
              <span>⚡</span> Instant Access
            </div>
          </div>

          {/* Form / Status */}
          {(status === "idle" || status === "error" || status === "initiating") ? (
            <form onSubmit={handleInitiatePayment}>
              <div style={{ position: "relative", marginBottom: "16px" }}>
                <span style={{
                  position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                  fontSize: "16px", zIndex: 1
                }}>📱</span>
                <input
                  type="tel"
                  placeholder="Phone Number (0712345678)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: "100%", padding: "16px 16px 16px 44px", borderRadius: "14px",
                    border: status === "error" ? "2px solid #ef4444" : "2px solid #e2e8f0",
                    background: "#f8fafc", color: "#1e293b", fontSize: "16px",
                    outline: "none", boxSizing: "border-box", transition: "border-color 0.2s"
                  }}
                  required disabled={loading} autoFocus
                />
              </div>

              {message && (
                <div style={{
                  padding: "12px", borderRadius: "10px", textAlign: "center",
                  fontSize: "13px", marginBottom: "16px",
                  background: status === "error" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                  color: status === "error" ? "#ef4444" : "#15803d",
                  border: `1px solid ${status === "error" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`
                }}>
                  {message}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                style={{
                  width: "100%", padding: "18px", borderRadius: "16px", border: "none",
                  background: loading ? "#94a3b8" : "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                  color: "#fff", fontSize: "17px", fontWeight: "800", cursor: loading ? "not-allowed" : "pointer",
                  marginTop: "12px", boxShadow: loading ? "none" : "0 6px 20px rgba(34,197,94,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "10px"
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      display: "inline-block", width: "18px", height: "18px",
                      border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                      borderRadius: "50%", animation: "spin 0.8s linear infinite"
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
              <div style={{
                width: "70px", height: "70px", border: "4px solid rgba(34,197,94,0.2)",
                borderTopColor: "#22c55e", borderRadius: "50%", margin: "0 auto 20px",
                animation: "spin 1s linear infinite"
              }}></div>

              <h3 style={{ fontSize: "20px", color: "#166534", margin: "0 0 8px 0", fontWeight: "700" }}>
                Waiting for Payment
              </h3>

              <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 20px 0", lineHeight: "1.6" }}>
                {message}
              </p>

              <div style={{
                background: "#f8fafc", borderRadius: "12px", padding: "16px",
                marginBottom: "20px", border: "1px solid #e2e8f0"
              }}>
                <p style={{
                  fontSize: "12px", color: "#475569", margin: "0 0 12px 0",
                  fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px"
                }}>
                  Follow these steps:
                </p>
                <ol style={{
                  fontSize: "13px", color: "#334155", margin: 0, paddingLeft: "18px",
                  textAlign: "left", lineHeight: "1.8"
                }}>
                  <li>Check your phone for <strong>MPESA payment prompt</strong></li>
                  <li>Enter your <strong>MPESA PIN</strong> to authorize KES {LOGIN_FEE_AMOUNT}</li>
                  <li>Wait for <strong>MPESA confirmation SMS</strong></li>
                  <li>This page will <strong>auto-redirect</strong> once payment is confirmed</li>
                </ol>
              </div>

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "8px", fontSize: "12px", color: "#94a3b8"
              }}>
                <span style={{
                  display: "inline-block", width: "8px", height: "8px",
                  borderRadius: "50%", background: "#22c55e", animation: "pulse 1.5s ease-in-out infinite"
                }}></span>
                Live verification active
              </div>
            </div>
          ) : status === "success" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%",
                background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", fontSize: "40px", color: "#fff", fontWeight: "bold",
                boxShadow: "0 10px 30px rgba(34,197,94,0.4)"
              }}>
                ✓
              </div>
              <h3 style={{ fontSize: "22px", color: "#166534", margin: "0 0 8px 0", fontWeight: "700" }}>
                Payment Successful!
              </h3>
              <p style={{ fontSize: "15px", color: "#64748b", margin: 0 }}>
                {message}
              </p>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: "8px 0 0 0" }}>
                Redirecting automatically...
              </p>
            </div>
          ) : status === "timeout" ? (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "80px", height: "80px", borderRadius: "50%", background: "#fee2e2",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", fontSize: "40px"
              }}>⏰</div>
              <h3 style={{ fontSize: "20px", color: "#991b1b", margin: "0 0 12px 0", fontWeight: "700" }}>
                Verification Timeout
              </h3>
              <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px", lineHeight: "1.6" }}>
                {message}
              </p>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>
                If you already paid, please wait a moment and refresh.
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  width: "100%", padding: "16px", borderRadius: "12px", border: "none",
                  background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  color: "#fff", fontSize: "15px", fontWeight: "700", cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(59,130,246,0.4)"
                }}
              >
                Try Again
              </button>
            </div>
          ) : null}
        </div>

        {/* Support */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
            Need help? Our support team is available 24/7
          </p>
          <button
            onClick={() => {
              const msg = encodeURIComponent(`Hello, I need help with login fee payment. Phone: ${phone}`);
              window.open(`https://wa.me/254794101450?text=${msg}`, "_blank");
            }}
            style={{
              background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
              border: "none", color: "#fff", padding: "12px 24px", borderRadius: "25px",
              fontSize: "14px", fontWeight: "700", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: "8px",
              boxShadow: "0 4px 15px rgba(37,211,102,0.4)"
            }}
          >
            <span style={{ fontSize: "16px" }}>💬</span> Chat with Support
          </button>
        </div>

        {/* Security Badge */}
        <div style={{ textAlign: "center", marginTop: "24px", padding: "12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <p style={{ fontSize: "10px", color: "#64748b", margin: 0, lineHeight: "1.5" }}>
            🔒 256-bit SSL Encrypted • Powered by MegaPay • Licensed by Kenya Government
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
