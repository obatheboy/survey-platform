import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";

/* =========================
   PLAN CONFIG (MATCH DASHBOARD)
========================= */
const PLANS = {
  REGULAR: { name: "Regular", color: "#29b6f6", total: 1500 },
  VIP: { name: "VIP", color: "#ab47bc", total: 2000 },
  VVIP: { name: "VVIP", color: "#ffb300", total: 3000 },
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

        <MenuItem label="🔗 Share Referral Link" onClick={shareLink} />
        <p style={referralCaption}>
          Earn <strong>KES 250</strong> for every successful signup.
        </p>

        <MenuItem label="⬅ Back to Dashboard" onClick={onClose} />
        <MenuItem label="🚪 Logout" danger onClick={logout} />
      </div>
    </>
  );
}

/* =========================
   MENU ITEM
========================= */
function MenuItem({ label, onClick, danger }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "12px",
        marginBottom: 8,
        borderRadius: 12,
        cursor: "pointer",
        fontWeight: 700,
        textAlign: "center",
        background: danger
          ? "rgba(211,47,47,0.15)"
          : "rgba(255,255,255,0.08)",
        color: danger ? "#ff5252" : "#e3f2fd",
      }}
    >
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
  background: "rgba(0,0,0,0.55)",
  zIndex: 99,
};

const drawer = {
  position: "fixed",
  top: 0,
  left: 0,
  height: "100%",
  width: "80vw",
  maxWidth: 320,
  minWidth: 260,
  background: "linear-gradient(180deg, #0b1020, #1a237e)",
  zIndex: 100,
  padding: 20,
  animation: "slideIn 0.3s ease-out",
};

const profileCard = { display: "flex", alignItems: "center", gap: 12 };
const avatar = {
  width: 44,
  height: 44,
  borderRadius: "50%",
  background: "linear-gradient(135deg,#8e24aa,#d81b60)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
};
const profileBtnDisabled = {
  border: "none",
  background: "rgba(255,255,255,0.08)",
  color: "#aaa",
  padding: "6px 12px",
  borderRadius: 10,
  fontSize: 12,
};
const divider = { margin: "16px 0", opacity: 0.15 };
const withdrawTitle = { marginBottom: 12, color: "#ce93d8" };
const withdrawCard = {
  background: "rgba(255,255,255,0.08)",
  padding: 12,
  borderRadius: 14,
  marginBottom: 10,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  border: "1px solid",
};
const withdrawAmount = { margin: "4px 0", fontSize: 13, color: "#e3f2fd" };
const withdrawBtn = {
  background: "transparent",
  border: "1px solid",
  padding: "6px 16px",
  borderRadius: 999,
  fontWeight: 700,
};
const inputStyle = {
  width: "100%",
  margin: "4px 0",
  padding: "4px 8px",
  borderRadius: 6,
  border: "1px solid #ccc",
};
const referralCaption = {
  fontSize: 12,
  color: "#80deea",
  textAlign: "center",
  marginBottom: 16,
};
const toastStyle = {
  position: "fixed",
  top: 20,
  left: "50%",
  transform: "translateX(-50%)",
  background: "#4caf50",
  color: "#fff",
  padding: "8px 16px",
  borderRadius: 8,
  zIndex: 200,
  fontWeight: 700,
};
