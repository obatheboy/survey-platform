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

export default function MainMenuDrawer({ open, onClose, user, onNavigate }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");

  if (!open || !user) return null;

  const openWhatsAppSupport = () => {
    const message = encodeURIComponent("Hello SurveyEarn Support, I need help with my survey account.");
    const whatsappUrl = `https://wa.me/254102074596?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const referralCode = user?.referral_code || user?.id;
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
  const shareMessage = `Hey! I'm earning real money by completing simple surveys on SurveyEarn. 💰\n\nJoin using my link and get a KES 1,200 welcome bonus! 🎁\n\n${referralLink}`;

  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const shareToSMS = () => {
    const smsUrl = `sms:?body=${encodeURIComponent(shareMessage)}`;
    window.open(smsUrl, '_blank');
    onClose();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setToast("✅ Referral link copied!");
    setTimeout(() => setToast(""), 3000);
  };

  const showAccountStats = () => {
    setToast("📊 Account stats coming soon!");
    setTimeout(() => setToast(""), 3000);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    
    // Clear localStorage token for mobile compatibility
    localStorage.removeItem("token");
    localStorage.removeItem("active_plan");
    
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
      <div className="drawer-overlay" style={overlay} onClick={onClose} />

      {/* DRAWER */}
      <div className="drawer-content" style={drawer}>
        {/* PROFILE */}
        <div style={profileCard}>
          <div style={avatar}>
            {user.full_name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ color: "#fff" }}>{user.full_name}</strong>
          </div>
          <button style={profileBtn} onClick={() => setToast("👤 Profile settings coming soon!")}>
            Profile
          </button>
        </div>

        <hr style={divider} />

        {/* NEW FEATURES */}
        <h4 style={withdrawTitle}>App Menu</h4>
        <MenuItem label="❓ FAQ & Help" icon="❓" onClick={() => onNavigate('/faq')} />
        <MenuItem label="📊 Account Stats" icon="📊" onClick={showAccountStats} />
        <MenuItem label="📞 Contact Support" icon="📞" onClick={openWhatsAppSupport} />

        <hr style={divider} />

        <h4 style={withdrawTitle}>💌 Invite & Earn</h4>
        <p style={referralCaption}>
          Earn <strong>KES 250</strong> for every friend who signs up and activates.
        </p>
        <div style={shareButtonsContainer}>
            <button style={{...shareBtn, background: '#25D366'}} onClick={shareToWhatsApp}>
                <span style={shareIconStyle}>💬</span> WhatsApp
            </button>
            <button style={{...shareBtn, background: '#3b82f6'}} onClick={shareToSMS}>
                <span style={shareIconStyle}>✉️</span> SMS
            </button>
            <button style={{...shareBtn, background: '#64748b'}} onClick={copyLink}>
                <span style={shareIconStyle}>🔗</span> Copy
            </button>
        </div>

        <hr style={divider} />
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
  background: "rgba(0, 0, 0, 0.85)",
  zIndex: 99998,
};

const drawer = {
  position: "fixed",
  top: 0,
  left: 0,
  height: "100%",
  width: "85vw",
  maxWidth: 320,
  background: "#1e293b",
  zIndex: 99999,
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

const profileBtn = {
  border: "1px solid rgba(255, 255, 255, 0.2)",
  background: "rgba(255, 255, 255, 0.1)",
  color: "#fff",
  padding: "6px 14px",
  borderRadius: 10,
  fontSize: "12px",
  fontWeight: "700",
  cursor: "pointer",
  transition: "all 0.2s ease"
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

const shareButtonsContainer = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '10px',
  marginBottom: '24px'
};

const shareBtn = {
  border: 'none',
  borderRadius: '12px',
  padding: '12px 8px',
  color: 'white',
  fontWeight: '700',
  fontSize: '12px',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  transition: 'transform 0.2s ease'
};

const shareIconStyle = {
  fontSize: '20px'
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
  zIndex: 100000,
  fontWeight: 800,
  boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
};