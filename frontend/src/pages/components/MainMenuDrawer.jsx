import { useNavigate } from "react-router-dom";
import api from "../../api/api";

/* =========================
   PLAN CONFIG
========================= */
const PLANS = {
  REGULAR: { name: "Regular", perSurvey: 150, color: "#29b6f6" },
  VIP: { name: "VIP", perSurvey: 200, color: "#ab47bc" },
  VVIP: { name: "VVIP", perSurvey: 300, color: "#ffb300" },
};

export default function MainMenuDrawer({ open, onClose, user }) {
  const navigate = useNavigate();

  /* HELPERS */
  const getSurveysDone = (key) =>
    Number(localStorage.getItem(`surveysDone_${key}`) || 0);

  const getEarned = (key) =>
    getSurveysDone(key) * PLANS[key].perSurvey;

  /* ACTIONS */
  const handleWithdraw = (planKey) => {
    const earned = getEarned(planKey);

    if (earned === 0) {
      alert("❌ You have no earnings for this plan.");
      return;
    }

    localStorage.setItem("selectedPlan", planKey);
    onClose();

    if (user.status !== "ACTIVE") {
      navigate("/activation-notice", {
        state: { reason: "withdraw" },
      });
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

  if (!open || !user) return null;

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
            <span style={statusBadge}>
              {user.status}
            </span>
          </div>

          {/* READ-ONLY PROFILE BUTTON */}
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

        {Object.entries(PLANS).map(([key, plan]) => (
          <div
            key={key}
            style={{
              ...withdrawCard,
              borderColor: plan.color,
            }}
          >
            <div>
              <strong style={{ color: plan.color }}>
                {plan.name}
              </strong>
              <p style={withdrawAmount}>
                KES {getEarned(key).toLocaleString()}
              </p>
            </div>

            <button
              style={{
                ...withdrawBtn,
                borderColor: plan.color,
                color: plan.color,
              }}
              onClick={() => handleWithdraw(key)}
            >
              Withdraw
            </button>
          </div>
        ))}

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
        transition: "all 0.25s ease",
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
  background:
    "linear-gradient(180deg, #0b1020, #1a237e)",
  zIndex: 100,
  padding: 20,
  animation: "slideIn 0.3s ease-out",
  boxShadow: "4px 0 30px rgba(0,0,0,0.6)",
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
  background:
    "linear-gradient(135deg,#8e24aa,#d81b60)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  boxShadow: "0 0 18px rgba(216,27,96,0.6)",
};

const statusBadge = {
  display: "inline-block",
  marginTop: 4,
  fontSize: 11,
  padding: "2px 10px",
  borderRadius: 999,
  background: "rgba(0,255,200,0.15)",
  color: "#00e5ff",
};

const profileBtnDisabled = {
  border: "none",
  background: "rgba(255,255,255,0.08)",
  color: "#aaa",
  padding: "6px 12px",
  borderRadius: 10,
  fontSize: 12,
  cursor: "not-allowed",
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
  cursor: "pointer",
};

const referralCaption = {
  fontSize: 12,
  color: "#80deea",
  textAlign: "center",
  marginBottom: 16,
};
