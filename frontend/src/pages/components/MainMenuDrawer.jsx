import { useNavigate } from "react-router-dom";
import api from "../../api/api";

/* =========================
   PLAN CONFIG (DISPLAY ONLY)
========================= */
const PLANS = {
  REGULAR: { name: "Regular", color: "#29b6f6" },
  VIP: { name: "VIP", color: "#ab47bc" },
  VVIP: { name: "VVIP", color: "#ffb300" },
};

const TOTAL_SURVEYS = 10;

export default function MainMenuDrawer({ open, onClose, user }) {
  const navigate = useNavigate();

  if (!open || !user) return null;

  /* =========================
     ACTIVE PLAN (SOURCE OF TRUTH)
  ========================= */
  const activePlan = localStorage.getItem("active_plan");
  const planData = activePlan ? user.plans?.[activePlan] : null;

  const isCompleted =
    planData?.surveys_completed >= TOTAL_SURVEYS;

  const isActivated =
    planData?.is_activated === true;

  /* =========================
     WITHDRAW (MATCHES DASHBOARD)
  ========================= */
  const handleWithdraw = () => {
    onClose();

    if (!activePlan || !planData) {
      navigate("/dashboard", { replace: true });
      return;
    }

    if (!isCompleted) {
      alert("❌ Complete all surveys to withdraw.");
      return;
    }

    if (!isActivated) {
      navigate("/congratulations", { replace: true });
      return;
    }

    navigate("/withdraw");
  };

  const shareLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    alert("✅ Referral link copied");
    onClose();
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    navigate("/auth", { replace: true });
  };

  return (
    <>
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
            <strong style={{ color: "#fff" }}>
              {user.full_name}
            </strong>
          </div>

          <button
            style={profileBtnDisabled}
            disabled
            title="Profile information is read-only"
          >
            Profile
          </button>
        </div>

        <hr style={divider} />

        {/* WITHDRAW */}
        <h4 style={withdrawTitle}>💸 Withdraw Earnings</h4>

        {Object.entries(PLANS).map(([key, plan]) => {
          const isActive = key === activePlan;
          const earned =
            isActive && isCompleted
              ? Number(planData?.total_earned || 0).toLocaleString()
              : "0";

          return (
            <div
              key={key}
              style={{
                ...withdrawCard,
                borderColor: plan.color,
                opacity: isActive ? 1 : 0.35,
              }}
            >
              <div>
                <strong style={{ color: plan.color }}>
                  {plan.name}
                </strong>

                <p style={withdrawAmount}>
                  KES {earned}
                </p>
              </div>

              <button
                style={{
                  ...withdrawBtn,
                  borderColor: plan.color,
                  color: plan.color,
                  cursor: isActive ? "pointer" : "not-allowed",
                }}
                disabled={!isActive}
                onClick={handleWithdraw}
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

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
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
   STYLES (UNCHANGED)
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

const profileCard = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

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

const divider = {
  margin: "16px 0",
  opacity: 0.15,
};

const withdrawTitle = {
  marginBottom: 12,
  color: "#ce93d8",
};

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

const withdrawAmount = {
  margin: "4px 0",
  fontSize: 13,
  color: "#e3f2fd",
};

const withdrawBtn = {
  background: "transparent",
  border: "1px solid",
  padding: "6px 16px",
  borderRadius: 999,
  fontWeight: 700,
};

const referralCaption = {
  fontSize: 12,
  color: "#80deea",
  textAlign: "center",
  marginBottom: 16,
};
