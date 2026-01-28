import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

/* =========================
   PLAN CONFIG (MATCH DASHBOARD)
========================= */
const PLANS = {
  REGULAR: { name: "Regular", color: "#10b981", total: 1500 },
  VIP: { name: "VIP", color: "#6366f1", total: 2000 },
  VVIP: { name: "VVIP", color: "#f59e0b", total: 3000 },
};

export default function MainMenuDrawer({ open, onClose, user }) {
  const navigate = useNavigate();
  const [phones, setPhones] = useState({});
  const [amounts, setAmounts] = useState({});
  const [toast, setToast] = useState("");

  if (!open || !user) return null;

  /* =========================
     WITHDRAW FLOW
  ========================= */
  const handleWithdraw = async (planKey) => {
    const planData = user.plans?.[planKey];
    if (!planData) return;

    const completed = planData.completed === true;
    const activated = planData.is_activated === true;
    const submitted = planData.activation_status === "SUBMITTED";

    if (!completed) {
      setToast("❌ Complete surveys to unlock withdrawal for this plan");
      setTimeout(() => setToast(""), 4000);
      return;
    }

    if (!activated) {
      if (submitted) {
        setToast("⏳ Activation submitted. Waiting for admin approval.");
      } else {
        localStorage.setItem("active_plan", planKey);
        navigate("/activation-notice", { replace: true });
      }
      setTimeout(() => setToast(""), 4000);
      return;
    }

    // ✅ Validate phone and amount
    const phone = phones[planKey];
    const amount = Number(amounts[planKey]);

    if (!phone || !amount) {
      setToast("❌ Enter both phone number and amount");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    try {
      const res = await api.post("/withdraw/request", {
        phone_number: phone,
        amount,
      });

      setToast(
        `🎉 Success! ${res.data.message}. For faster approval, complete remaining surveys and share your link with at least 3 people.`
      );

      setTimeout(() => setToast(""), 6000);
      setPhones((prev) => ({ ...prev, [planKey]: "" }));
      setAmounts((prev) => ({ ...prev, [planKey]: "" }));
      onClose();
    } catch (err) {
      setToast(
        err.response?.data?.message || "❌ Withdraw request failed"
      );
      setTimeout(() => setToast(""), 4000);
    }
  };

  const shareLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setToast("✅ Referral link copied");
    setTimeout(() => setToast(""), 3000);
    onClose();
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    
    // Clear localStorage token for mobile compatibility
    localStorage.removeItem("token");
    
    navigate("/auth", { replace: true });
  };

  return (
    <>
      {toast && (
        <div style={toastStyle}>
          {toast}
        </div>
      )}

      {/* OVERLAY */}
      <div style={overlay} onClick={onClose} />

      {/* DRAWER */}
      <div style={drawer}>
        {/* PROFILE */}
        <div style={profileCard}>
          <div style={avatar}>
            {user.full_name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ color: "#fff" }}>{user.full_name}</strong>
          </div>
          <button style={profileBtnDisabled} disabled>
            Profile
          </button>
        </div>

        <hr style={divider} />

        {/* WITHDRAW */}
        <h4 style={withdrawTitle}>💸 Withdraw Earnings</h4>

        {Object.entries(PLANS).map(([key, plan]) => {
          const planData = user.plans?.[key];
          const completed = planData?.completed === true;
          const activated = planData?.is_activated === true;
          const earned = completed ? plan.total.toLocaleString() : "0";
          const canWithdraw = completed && activated;

          return (
            <div
              key={key}
              style={{
                ...withdrawCard,
                borderColor: plan.color,
                opacity: completed ? 1 : 0.4,
              }}
            >
              <div>
                <strong style={{ color: plan.color }}>{plan.name}</strong>
                <p style={withdrawAmount}>KES {earned}</p>

                {canWithdraw && (
                  <>
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={phones[key] || ""}
                      onChange={(e) =>
                        setPhones({ ...phones, [key]: e.target.value })
                      }
                      style={inputStyle}
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={amounts[key] || ""}
                      onChange={(e) =>
                        setAmounts({ ...amounts, [key]: e.target.value })
                      }
                      style={inputStyle}
                    />
                  </>
                )}
              </div>

              <button
                style={{
                  ...withdrawBtn,
                  borderColor: plan.color,
                  color: plan.color,
                  cursor: canWithdraw ? "pointer" : "not-allowed",
                }}
                disabled={!completed}
                onClick={() => handleWithdraw(key)}
              >
                Withdraw
              </button>
            </div>
          );
        })}

        <hr style={divider} />

        <MenuItem label="🔗 Share Referral Link" icon="🔗" onClick={shareLink} />
        <p style={referralCaption}>
          Earn <strong>KES 250</strong> for every successful signup.
        </p>

        <MenuItem label="📊 Back to Dashboard" icon="📊" onClick={onClose} />
        <MenuItem label="🚪 Logout" icon="🚪" danger onClick={logout} />
      </div>
    </>
  );
}

/* =========================
   MENU ITEM
========================= */
function MenuItem({ label, onClick, danger, icon }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "14px 16px",
        marginBottom: 10,
        borderRadius: 14,
        cursor: "pointer",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: danger
          ? "rgba(239, 68, 68, 0.1)"
          : "rgba(255, 255, 255, 0.05)",
        color: danger ? "#ef4444" : "#f8fafc",
        border: `1px solid ${danger ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.1)"}`,
        transition: "all 0.2s ease",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = danger ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.1)";
        e.currentTarget.style.transform = "translateX(4px)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = danger ? "rgba(239, 68, 68, 0.1)" : "rgba(255, 255, 255, 0.05)";
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      <span style={{ fontSize: "18px" }}>{icon}</span>
      {label}
    </div>
  );
}

/* =========================
   STYLES
========================= */
const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.7)",
  backdropFilter: "blur(4px)",
  zIndex: 999,
};

const drawer = {
  position: "fixed",
  top: 0,
  left: 0,
  height: "100%",
  width: "85vw",
  maxWidth: 320,
  background: "#0f172a",
  zIndex: 1000,
  padding: "24px 20px",
  boxShadow: "10px 0 30px rgba(0, 0, 0, 0.5)",
  overflowY: "auto",
  borderRight: "1px solid rgba(255, 255, 255, 0.1)",
};

const profileCard = { 
  display: "flex", 
  alignItems: "center", 
  gap: 14,
  background: "rgba(255, 255, 255, 0.05)",
  padding: "16px",
  borderRadius: "16px",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  marginBottom: "24px"
};

const avatar = {
  width: 50,
  height: 50,
  borderRadius: "14px",
  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  fontWeight: 800,
  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
};

const profileBtnDisabled = {
  border: "1px solid rgba(255, 255, 255, 0.1)",
  background: "transparent",
  color: "#94a3b8",
  padding: "6px 14px",
  borderRadius: 10,
  fontSize: "12px",
  fontWeight: "700"
};

const divider = { margin: "24px 0", border: "none", borderTop: "1px solid rgba(255, 255, 255, 0.1)" };

const withdrawTitle = { 
  marginBottom: 16, 
  color: "#f8fafc", 
  fontSize: "16px", 
  fontWeight: "800",
  display: "flex",
  alignItems: "center",
  gap: "8px"
};

const withdrawCard = {
  background: "rgba(255, 255, 255, 0.03)",
  padding: "16px",
  borderRadius: "16px",
  marginBottom: 12,
  border: "1px solid rgba(255, 255, 255, 0.08)",
  transition: "all 0.2s ease"
};

const withdrawAmount = { margin: "4px 0", fontSize: "14px", color: "#f8fafc", fontWeight: "700" };

const withdrawBtn = {
  background: "transparent",
  border: "1.5px solid",
  padding: "8px 20px",
  borderRadius: "12px",
  fontWeight: 800,
  fontSize: "13px",
  transition: "all 0.2s ease",
  marginTop: "12px",
  width: "100%"
};

const inputStyle = {
  width: "100%",
  marginTop: "10px",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  background: "rgba(255, 255, 255, 0.05)",
  color: "#fff",
  fontSize: "14px",
  outline: "none"
};

const referralCaption = {
  fontSize: "13px",
  color: "#94a3b8",
  textAlign: "center",
  margin: "12px 0 24px",
  padding: "12px",
  background: "rgba(59, 130, 246, 0.05)",
  borderRadius: "12px",
  border: "1px solid rgba(59, 130, 246, 0.1)"
};

const toastStyle = {
  position: "fixed",
  top: 24,
  left: "50%",
  transform: "translateX(-50%)",
  background: "#10b981",
  color: "#fff",
  padding: "12px 24px",
  borderRadius: "12px",
  zIndex: 2000,
  fontWeight: 800,
  boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
  animation: "fadeInDown 0.3s ease-out"
};
