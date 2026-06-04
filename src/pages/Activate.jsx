import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { planPaymentApi } from "../api/api";

const ALL_PLANS = [
  { key: "WELCOME_BONUS", label: "Welcome Bonus", fee: 100, earnings: 1200, icon: "🎁", color: "#10b981" },
  { key: "REGULAR", label: "Regular", fee: 100, earnings: 1500, icon: "⭐", color: "#6366f1" },
  { key: "VIP", label: "VIP", fee: 200, earnings: 2000, icon: "💎", color: "#8b5cf6" },
  { key: "VVIP", label: "VVIP", fee: 300, earnings: 3000, icon: "👑", color: "#f59e0b" },
];

const POLL_INTERVAL = 3000;
const POLL_TIMEOUT = 60000;

const MEGAPAY_STATUS_URL = "https://megapay.co.ke/backend/v1/transactionstatus";

const checkMegaPayStatus = async (txId) => {
  const res = await fetch(MEGAPAY_STATUS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      api_key: "MGPYsOrn4Vvi",
      email: "obavanteshia65@gmail.com",
      transaction_request_id: txId
    })
  });
  return { ...(await res.json()), httpStatus: res.status };
};

export default function Activate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [plansStatus, setPlansStatus] = useState([]);
  const [paidCount, setPaidCount] = useState(0);
  const [allCompleted, setAllCompleted] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [paymentState, setPaymentState] = useState("idle");
  const [message, setMessage] = useState("");
  const [congratsData, setCongratsData] = useState(null);
  const [showWelcomeIntro, setShowWelcomeIntro] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const phoneTouchedRef = useRef(false);
  const phoneInputRef = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const [userRes, plansRes] = await Promise.all([
        api.get("/auth/me?_t=" + Date.now()),
        planPaymentApi.getStatus()
      ]);
      setUser(userRes.data);
      if (plansRes.data.success) {
        setPlansStatus(plansRes.data.plans);
        setPaidCount(plansRes.data.paid_count);
        setAllCompleted(plansRes.data.all_plans_completed);
      }
    } catch (err) {
      console.error("Failed to load:", err);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const location = useLocation();
  useEffect(() => {
    if (location.state?.congrats && !congratsData) {
      setCongratsData(location.state);
    }
  }, [location.state, congratsData]);

  useEffect(() => {
    if (selectedPlan && phoneInputRef.current) {
      setTimeout(() => {
        phoneInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [selectedPlan]);

  useEffect(() => {
    if (showWelcomeIntro) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  }, [showWelcomeIntro]);

  useEffect(() => {
    if (user?.phone && !phone && !phoneTouchedRef.current) {
      setPhone(user.phone);
    }
  }, [user, phone]);

  const getNextUnpaidPlan = () => {
    return ALL_PLANS.find(p => !plansStatus.find(s => s.plan === p.key)?.paid) || null;
  };

  const handleSelectPlan = (planKey) => {
    const planData = plansStatus.find(p => p.plan === planKey);
    if (planData?.paid) return;

    if (planKey === "WELCOME_BONUS") {
      setCongratsData(null);
      setSelectedPlan(null);
      setShowWelcomeIntro(true);
      return;
    }

    setCongratsData(null);
    setShowWelcomeIntro(false);
    setSelectedPlan(planKey);
    setPaymentState("idle");
    setMessage("");
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!selectedPlan || !phone.trim()) {
      setMessage("Please enter your phone number");
      return;
    }
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.length < 9 || cleaned.length > 12) {
      setMessage("Enter a valid Kenyan phone number (07XXXXXXXX or 2547XXXXXXXX)");
      return;
    }

    setPaying(true);
    setPaymentState("initiating");
    setMessage("Sending payment request...");

    try {
      const res = await planPaymentApi.initiate(selectedPlan, phone);
      const apiMessage = (res.data.message || "").toLowerCase();

      if (res.data.success) {
        setPaymentState("waiting");
        setMessage("Check your M-Pesa and enter your PIN to complete payment.");
        startPolling(res.data.transaction_request_id);
      } else if (apiMessage.includes("pin") || apiMessage.includes("stk") || apiMessage.includes("check") || apiMessage.includes("sent") || apiMessage.includes("phone")) {
        setPaymentState("waiting");
        setMessage("Check your M-Pesa and enter your PIN to complete payment.");
        startPolling(res.data.transaction_request_id);
      } else {
        setPaymentState("error");
        setMessage(res.data.message || "Payment initiation failed");
      }
    } catch (_payErr) {
      const errMsg = (_payErr.response?.data?.message || "").toLowerCase();
      if (errMsg.includes("pin") || errMsg.includes("stk") || errMsg.includes("check") || errMsg.includes("sent") || errMsg.includes("phone")) {
        setPaymentState("waiting");
        setMessage("Check your M-Pesa and enter your PIN to complete payment.");
      } else if (_payErr.code === "ENOTFOUND") {
        setPaymentState("error");
        setMessage("Payment gateway unavailable. Please try again later.");
      } else if (_payErr.response?.data?.message) {
        setPaymentState("error");
        setMessage(_payErr.response.data.message);
      } else {
        setPaymentState("error");
        setMessage("Network error. Please try again.");
      }
    } finally {
      setPaying(false);
    }
  };

  const startPolling = useCallback((txId) => {
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
    const startTime = Date.now();

    const poll = async () => {
      try {
        const megapayStatus = await checkMegaPayStatus(txId);
        const resultCode = String(megapayStatus.ResultCode || megapayStatus.resultCode || megapayStatus.result_code || "").trim();
        const txStatus = String(megapayStatus.TransactionStatus || megapayStatus.status || megapayStatus.transaction_status || "").toLowerCase().trim();

        console.log("🔵 Polling MegaPay:", { resultCode, txStatus, raw: megapayStatus });

        if ((resultCode === "200" || resultCode === "0") && (txStatus === "completed" || txStatus === "complete" || txStatus === "success" || txStatus === "paid")) {
          clearInterval(intervalRef.current);
          clearTimeout(timeoutRef.current);
          setPaymentState("confirming");
          setMessage("Payment detected! Confirming...");

          try {
            const confirmRes = await planPaymentApi.confirm({
              transaction_request_id: txId,
              phone: phone,
              plan: selectedPlan
            });

            if (confirmRes.data.success) {
              setPaymentState("success");
              setMessage(confirmRes.data.message || "Plan activated!");
              if (confirmRes.data.token) localStorage.setItem("token", confirmRes.data.token);
              await fetchStatus();
            } else {
              setPaymentState("error");
              setMessage(confirmRes.data.message || "Confirmation failed");
            }
          } catch {
            setPaymentState("error");
            setMessage("Failed to confirm payment. Please contact support.");
          }
          return;
        }
      } catch {
        // Silently retry on poll error
      }

      if (Date.now() - startTime > POLL_TIMEOUT) {
        clearInterval(intervalRef.current);
        clearTimeout(timeoutRef.current);
        setPaymentState("timeout");
        setMessage("Payment not received within the timeout period. Please try again.");
      }
    };

    intervalRef.current = setInterval(poll, POLL_INTERVAL);
    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      if (paymentState === "waiting" || paymentState === "confirming") {
        setPaymentState("timeout");
        setMessage("Payment not received. Please try again.");
      }
    }, POLL_TIMEOUT);
  }, [selectedPlan, phone, fetchStatus, paymentState]);

  const handleContinueToNext = () => {
    const next = getNextUnpaidPlan();
    if (next) {
      setSelectedPlan(next.key);
      setPaymentState("idle");
      setMessage("");
    }
  };

  const resetSelection = () => {
    setSelectedPlan(null);
    setPaymentState("idle");
    setMessage("");
    clearInterval(intervalRef.current);
    clearTimeout(timeoutRef.current);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#1e293b", color: "#e2e8f0", fontFamily: "'Inter', sans-serif", gap: "12px" }}>
        <div style={{ width: "36px", height: "36px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#00ff99", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
        <p>Loading plans...</p>
      </div>
    );
  }

  const progressPercent = (paidCount / 4) * 100;
  const currentPlanInfo = ALL_PLANS.find(p => p.key === selectedPlan);
  const nextUnpaid = getNextUnpaidPlan();
  const isWaitingOrConfirming = paymentState === "waiting" || paymentState === "confirming";

  return (
    <div style={{ minHeight: "100vh", background: "#1e293b", padding: "16px", fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Header with Progress */}
      <div style={{ width: "100%", maxWidth: "600px", marginBottom: "24px", textAlign: "center" }}>
        <h1 style={{ color: "#ffffff", fontSize: "24px", fontWeight: 800, margin: "0 0 8px" }}>
          💳 Activate Your Plans
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0 0 20px" }}>
          Pay KES 100–300 per plan to unlock your earnings
        </p>
        <div style={{ background: "#0f172a", borderRadius: "12px", padding: "16px", border: "1px solid #334155" }}>
          <div style={{ width: "100%", height: "10px", background: "#334155", borderRadius: "8px", overflow: "hidden", marginBottom: "10px" }}>
            <div style={{ width: `${progressPercent}%`, height: "100%", background: "linear-gradient(90deg, #10b981, #6366f1)", borderRadius: "8px", transition: "width 0.5s ease" }}></div>
          </div>
          <p style={{ color: "#e2e8f0", fontSize: "14px", fontWeight: 700, margin: 0 }}>
            {paidCount}/4 plans completed
            {allCompleted && " — All done! ✅"}
          </p>
        </div>
      </div>

      {/* 🎉 Congratulations Screen - shown after completing 10 surveys */}
      {congratsData && !allCompleted && !selectedPlan && (
        <div style={{ width: "100%", maxWidth: "600px", background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(99,102,241,0.15))", border: "2px solid #10b981", borderRadius: "20px", padding: "28px", textAlign: "center", marginBottom: "24px", boxShadow: "0 0 40px rgba(16,185,129,0.15)" }}>
          <div style={{ fontSize: "56px", marginBottom: "12px" }}>🎉</div>
          <h2 style={{ color: "#10b981", fontSize: "24px", fontWeight: 800, margin: "0 0 6px" }}>
            Amazing Work!
          </h2>
          <p style={{ color: "#fbbf24", fontSize: "16px", fontWeight: 700, margin: "0 0 16px" }}>
            You completed all 10 surveys for <strong>{ALL_PLANS.find(p => p.key === (congratsData.planKey || user?.active_plan))?.label || "your plan"}</strong>!
          </p>

          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "14px", padding: "18px", marginBottom: "18px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p style={{ color: "#94a3b8", fontSize: "13px", margin: "0 0 6px" }}>💰 Amount Earned</p>
            <p style={{ color: "#ffffff", fontSize: "32px", fontWeight: 900, margin: "0 0 10px" }}>
              KES {(congratsData.amount || 0).toLocaleString()}
            </p>
            <p style={{ color: "#10b981", fontSize: "14px", fontWeight: 600, margin: 0 }}>
              ✅ {congratsData.totalCompleted || 10}/10 surveys completed
            </p>
          </div>

          <div style={{ textAlign: "left", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
            <p style={{ color: "#fbbf24", fontWeight: 700, fontSize: "14px", margin: "0 0 10px" }}>⚠️ To withdraw your earnings, you need to:</p>
            <ul style={{ color: "#e2e8f0", fontSize: "14px", margin: 0, paddingLeft: "20px", lineHeight: 1.8 }}>
              <li>Pay the one-time <strong>activation fee</strong> for this plan</li>
              <li>This unlocks your <strong>KES {(congratsData.amount || 0).toLocaleString()}</strong> for withdrawal</li>
              <li>You can then withdraw instantly via M-Pesa</li>
            </ul>
          </div>

          <button
            onClick={() => {
              const planKey = congratsData?.planKey || user?.active_plan;
              if (planKey) handleSelectPlan(planKey);
            }}
            style={{ width: "100%", padding: "16px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "#ffffff", fontWeight: 800, fontSize: "16px", cursor: "pointer", boxShadow: "0 6px 20px rgba(16,185,129,0.35)", marginBottom: "10px" }}
          >
            🔓 Activate & Withdraw My Earnings
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "2px solid #334155", background: "transparent", color: "#94a3b8", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
          >
            Back to Dashboard
          </button>
        </div>
      )}

      {/* All Completed Banner */}
      {allCompleted && (
        <div style={{ width: "100%", maxWidth: "600px", background: "rgba(16,185,129,0.1)", border: "2px solid #10b981", borderRadius: "16px", padding: "24px", textAlign: "center", marginBottom: "24px" }}>
          <span style={{ fontSize: "32px" }}>🎉</span>
          <h2 style={{ color: "#10b981", fontSize: "22px", fontWeight: 800, margin: "8px 0" }}>All Plans Activated!</h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0 0 20px" }}>You can now withdraw your earnings.</p>
          <button style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "#10b981", color: "#ffffff", fontWeight: 700, fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }} onClick={() => navigate("/withdraw-form")}>
            💸 Go to Withdraw
          </button>
        </div>
      )}

      {/* 🎁 Welcome Bonus Intro Screen */}
      {showWelcomeIntro && !allCompleted && (
        <div style={{ width: "100%", maxWidth: "500px", background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.15))", border: "2px solid #10b981", borderRadius: "20px", padding: "28px", textAlign: "center", marginBottom: "24px", boxShadow: "0 0 40px rgba(16,185,129,0.15)" }}>
          <div style={{ fontSize: "56px", marginBottom: "12px" }}>🎁</div>
          <h2 style={{ color: "#10b981", fontSize: "24px", fontWeight: 800, margin: "0 0 6px" }}>
            Welcome Bonus Plan
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0 0 18px", lineHeight: 1.5 }}>
            Unlock your <strong>KES 1,200</strong> welcome bonus earnings!<br />
            This is the first step to activating your account.
          </p>

          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "14px", padding: "18px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ color: "#94a3b8", fontSize: "14px" }}>Activation Fee</span>
              <span style={{ color: "#ffffff", fontSize: "16px", fontWeight: 700 }}>KES 100</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ color: "#94a3b8", fontSize: "14px" }}>You'll Earn</span>
              <span style={{ color: "#10b981", fontSize: "16px", fontWeight: 700 }}>KES 1,200</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8", fontSize: "14px" }}>Payment Method</span>
              <span style={{ color: "#fbbf24", fontSize: "14px", fontWeight: 600 }}>📱 M-Pesa STK Push</span>
            </div>
          </div>

          <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: "12px", padding: "14px", marginBottom: "20px", textAlign: "left" }}>
            <p style={{ color: "#fbbf24", fontWeight: 700, fontSize: "13px", margin: "0 0 6px" }}>💡 How it works:</p>
            <p style={{ color: "#e2e8f0", fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
              1. Tap "Pay Now" below<br />
              2. Enter your M-Pesa number<br />
              3. Approve the STK Push on your phone<br />
              4. Your <strong>KES 1,200</strong> bonus is unlocked instantly!
            </p>
          </div>

          <button
            onClick={() => {
              setShowWelcomeIntro(false);
              setSelectedPlan("WELCOME_BONUS");
              setPaymentState("idle");
              setMessage("");
            }}
            style={{ width: "100%", padding: "16px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #10b981, #059669)", color: "#ffffff", fontWeight: 800, fontSize: "16px", cursor: "pointer", boxShadow: "0 6px 20px rgba(16,185,129,0.35)", marginBottom: "10px" }}
          >
            🎁 Pay KES 100 — Unlock Welcome Bonus
          </button>

          <button
            onClick={() => setShowWelcomeIntro(false)}
            style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "2px solid #334155", background: "transparent", color: "#94a3b8", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
          >
            Maybe Later
          </button>
        </div>
      )}

      {/* Payment Success Card */}
      {paymentState === "success" && !allCompleted && (
        <div style={{ width: "100%", maxWidth: "500px", background: "rgba(16,185,129,0.08)", border: "2px solid #10b981", borderRadius: "16px", padding: "24px", textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
          <h2 style={{ color: "#10b981", marginBottom: "8px" }}>{currentPlanInfo?.label} Paid!</h2>
          <p style={{ color: "#94a3b8", marginBottom: "12px", lineHeight: 1.5 }}>
            You have successfully paid for <strong>{currentPlanInfo?.label}</strong> plan!
          </p>
          <p style={{ color: "#e2e8f0", marginBottom: "16px", fontWeight: 600 }}>
            📋 Plans remaining: {4 - paidCount - 1}
          </p>
          {nextUnpaid ? (
            <button style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "#2563eb", color: "#ffffff", fontWeight: 700, fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 12px rgba(37,99,235,0.3)" }} onClick={handleContinueToNext}>
              Continue to {nextUnpaid.label} Plan →
            </button>
          ) : (
            <button style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "#10b981", color: "#ffffff", fontWeight: 700, fontSize: "15px", cursor: "pointer" }} onClick={() => navigate("/withdraw-form")}>
              💸 Go to Withdraw
            </button>
          )}
          <button style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "2px solid #334155", background: "transparent", color: "#94a3b8", fontWeight: 600, fontSize: "13px", cursor: "pointer", marginTop: "8px" }} onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      )}

      {/* Payment Form */}
      {selectedPlan && !allCompleted && paymentState !== "success" && (
        <div style={{ width: "100%", maxWidth: "500px", background: "#0f172a", border: "1px solid #334155", borderRadius: "16px", padding: "20px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderRadius: "12px", border: `2px solid ${currentPlanInfo?.color}`, marginBottom: "20px" }}>
            <span style={{ fontSize: "28px" }}>{currentPlanInfo?.icon}</span>
            <div>
              <h2 style={{ color: currentPlanInfo?.color, margin: 0, fontSize: "18px" }}>
                Pay {currentPlanInfo?.label} Plan
              </h2>
              <p style={{ color: "#94a3b8", margin: "4px 0 0", fontSize: "13px" }}>
                Fee: KES {currentPlanInfo?.fee} → Earn: KES {currentPlanInfo?.earnings}
              </p>
            </div>
          </div>

          <form onSubmit={handlePay} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "14px" }}>📱 M-Pesa Phone Number</label>
              <input
                ref={phoneInputRef}
                type="tel"
                value={phone}
                onChange={(e) => { phoneTouchedRef.current = true; setPhone(e.target.value); }}
                placeholder="2547XXXXXXXX or 07XXXXXXXX"
                style={{ width: "100%", padding: "14px 16px", borderRadius: "10px", border: "2px solid #334155", background: "#1e293b", color: "#ffffff", fontSize: "16px", fontWeight: 600, boxSizing: "border-box", outline: "none" }}
                disabled={paying || isWaitingOrConfirming}
              />
            </div>

            {isWaitingOrConfirming && (
              <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                <p style={{ color: "#10b981", fontWeight: 600, marginBottom: "8px" }}>✅ STK Push Sent!</p>
                <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "12px" }}>Check your M-Pesa and enter your PIN to complete payment.</p>
                {paymentState === "confirming" && (
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }}></div>
                    <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "6px" }}>Confirming payment...</p>
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button type="button" disabled={paymentState === "confirming"} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: paymentState === "confirming" ? "#475569" : "#10b981", color: "#ffffff", fontWeight: 700, fontSize: "14px", cursor: paymentState === "confirming" ? "not-allowed" : "pointer", opacity: paymentState === "confirming" ? 0.6 : 1 }}>
                    {paymentState === "confirming" ? "Confirming..." : "✅ I Paid — Confirm"}
                  </button>
                  <button type="button" onClick={resetSelection} style={{ flex: 1, padding: "12px", borderRadius: "10px", border: "none", background: "#475569", color: "#ffffff", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {paymentState === "error" && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                <p style={{ color: "#fca5a5" }}>❌ {message}</p>
                <button type="button" onClick={resetSelection} style={{ marginTop: "8px", padding: "8px 20px", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                  Try Again
                </button>
              </div>
            )}

            {paymentState === "timeout" && (
              <div style={{ background: "rgba(245,158,11,0.1)", border: "1px solid #f59e0b", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                <p style={{ color: "#fcd34d" }}>⏰ {message}</p>
                <button type="button" onClick={resetSelection} style={{ marginTop: "8px", padding: "8px 20px", borderRadius: "8px", border: "none", background: "#f59e0b", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
                  Try Again
                </button>
              </div>
            )}

            {paymentState === "idle" && (
              <button
                type="submit"
                disabled={paying}
                style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "none", background: paying ? "#475569" : `linear-gradient(135deg, ${currentPlanInfo?.color}, ${currentPlanInfo?.color}dd)`, color: "#ffffff", fontWeight: 800, fontSize: "15px", cursor: paying ? "not-allowed" : "pointer", opacity: paying ? 0.6 : 1, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
              >
                {paying ? "Sending..." : `📱 Pay KES ${currentPlanInfo?.fee} via STK Push`}
              </button>
            )}

            {paymentState === "initiating" && (
              <div style={{ textAlign: "center", padding: "12px" }}>
                <div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#00ff99", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }}></div>
                <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "8px" }}>Sending payment request...</p>
              </div>
            )}

            <button type="button" onClick={resetSelection} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "2px solid #334155", background: "transparent", color: "#94a3b8", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
              ← Back to Plans
            </button>
          </form>
        </div>
      )}

      {/* Plan Grid */}
      {!selectedPlan && (
        <div style={{ width: "100%", maxWidth: "600px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {plansStatus.map((plan) => {
            const config = ALL_PLANS.find(p => p.key === plan.plan);
            return (
              <div key={plan.plan} style={{ border: `2px solid ${config?.color || "#334155"}`, borderRadius: "16px", padding: "20px", background: plan.paid ? "rgba(16,185,129,0.08)" : "#0f172a", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "24px" }}>{config?.icon}</span>
                  <div>
                    <h3 style={{ color: config?.color, margin: 0, fontSize: "16px" }}>{plan.label}</h3>
                    <p style={{ color: "#94a3b8", margin: "2px 0 0", fontSize: "12px" }}>{plan.paid ? "✅ Paid" : "Unpaid"}</p>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "13px" }}>
                  <span style={{ color: "#e2e8f0" }}>Fee: <strong>KES {plan.fee}</strong></span>
                  <span style={{ color: "#10b981" }}>Earn: <strong>KES {plan.earnings}</strong></span>
                </div>
                {plan.paid ? (
                  <div style={{ padding: "10px", borderRadius: "10px", textAlign: "center", fontWeight: 700, fontSize: "14px", background: "rgba(16,185,129,0.2)", color: "#10b981" }}>
                    ✓ Activated
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(plan.plan)}
                    style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: `linear-gradient(135deg, ${config?.color}, ${config?.color}dd)`, color: "#ffffff", fontWeight: 800, fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}
                  >
                    Pay Now — KES {plan.fee}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Back to dashboard */}
      {!selectedPlan && (
        <button onClick={() => navigate("/dashboard")} style={{ padding: "12px 32px", borderRadius: "12px", border: "2px solid #334155", background: "transparent", color: "#94a3b8", fontWeight: 700, fontSize: "14px", cursor: "pointer", marginBottom: "16px" }}>
          ← Back to Dashboard
        </button>
      )}

      {/* Support */}
      <button onClick={() => window.open("tel:0140834185", "_blank")} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", background: "#3b82f6", color: "#ffffff", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
        📞 Call Support: 0140834185
      </button>
    </div>
  );
}
