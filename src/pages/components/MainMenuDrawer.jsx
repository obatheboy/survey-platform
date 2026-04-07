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

export default function MainMenuDrawer({ open, onClose, user, onNavigate, goToSurveys }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState("");

  if (!open || !user) return null;

  const openWhatsAppSupport = () => {
    const message = encodeURIComponent("Hello OpinionVault Support, I need help with my survey account.");
    const whatsappUrl = `https://wa.me/254769945306?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const referralCode = user?.referral_code || user?.id;
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
  const shareMessage = `Hey! I'm earning rewards by completing simple surveys on OpinionVault.\n\nJoin using my link and get started!\n\n${referralLink}`;

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
    } catch (error) {
      // Log for debugging but don't prevent logout
      console.warn("Logout API failed, proceeding with client-side logout:", error);
    }
    
    // Always clear localStorage and redirect even if API fails
    localStorage.removeItem("token");
    localStorage.removeItem("active_plan");
    localStorage.removeItem("cachedUser");
    localStorage.removeItem("user");
    
    // Use replace: true to prevent going back
    navigate("/auth", { replace: true });
    onClose();
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
            <strong style={{ color: "#ffffff" }}>{user.full_name}</strong>
          </div>
          <button style={profileBtn} onClick={() => setToast("Profile settings coming soon!")}>
            Profile
          </button>
        </div>

        <hr style={divider} />

        {/* NEW FEATURES */}
        <h4 style={withdrawTitle}>Quick Navigation</h4>
        <MenuItem label="Home" icon="home" onClick={() => { onClose(); }} />
        <MenuItem label="Surveys" icon="survey" onClick={() => { onClose(); onNavigate('/surveys'); }} />
        <MenuItem label="Affiliate" icon="affiliate" onClick={() => onNavigate('/affiliate')} />
        <MenuItem label="Withdraw" icon="withdraw" onClick={() => onNavigate('/withdraw-form')} />

        <hr style={divider} />

        <h4 style={withdrawTitle}>App Menu</h4>
        <MenuItem label="FAQ & Help" icon="help" onClick={() => onNavigate('/faq')} />
        <MenuItem label="Account Stats" icon="stats" onClick={showAccountStats} />
        <MenuItem label="Contact Support" icon="support" onClick={openWhatsAppSupport} />

        <hr style={divider} />

        <h4 style={withdrawTitle}>Invite & Earn</h4>
        <p style={referralCaption}>
          Earn <strong>KES 250</strong> for every friend who signs up and activates.
        </p>
        <div style={shareButtonsContainer}>
            <button style={{...shareBtn, background: '#25D366'}} onClick={shareToWhatsApp}>
                <span style={shareIconStyle}>WhatsApp</span>
            </button>
            <button style={{...shareBtn, background: '#3b82f6'}} onClick={shareToSMS}>
                <span style={shareIconStyle}>SMS</span>
            </button>
            <button style={{...shareBtn, background: '#64748b'}} onClick={copyLink}>
                <span style={shareIconStyle}>Copy</span>
            </button>
        </div>

        <hr style={divider} />
        <MenuItem label="Back to Dashboard" icon="dashboard" onClick={onClose} />
        <MenuItem label="Logout" icon="logout" danger onClick={logout} />
      </div>
    </>
  );
}

/* =========================
   MENU ITEM
========================= */
function MenuItem({ label, onClick, danger, icon }) {
  const getIcon = () => {
    const iconMap = {
      home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
      survey: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
      affiliate: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>,
      withdraw: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
      help: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
      stats: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
      support: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>,
      dashboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
      logout: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
    };
    return iconMap[icon] || null;
  };

  return (
    <div
      onClick={onClick}
      style={{
        padding: "14px 16px",
        marginBottom: 10,
        borderRadius: 12,
        cursor: "pointer",
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        background: danger
          ? "rgba(239, 68, 68, 0.1)"
          : "rgba(255, 255, 255, 0.08)",
        color: danger ? "#ef4444" : "#ffffff",
        border: `1px solid ${danger ? "rgba(239, 68, 68, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
        transition: "all 0.2s ease",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = danger ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.12)";
        e.currentTarget.style.transform = "translateX(4px)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = danger ? "rgba(239, 68, 68, 0.1)" : "rgba(255, 255, 255, 0.08)";
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      <span style={{ fontSize: "18px", display: 'flex' }}>{getIcon()}</span>
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
  background: "#1e3a8a",
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
  background: "rgba(255, 255, 255, 0.15)",
  padding: "16px",
  borderRadius: "16px",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  marginBottom: "24px"
};

const avatar = {
  width: 50,
  height: 50,
  borderRadius: "14px",
  background: "linear-gradient(135deg, #1f7405, #3cb308)",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "20px",
  fontWeight: 800,
  boxShadow: "0 4px 20px rgba(31, 116, 5, 0.5)",
};

const profileBtn = {
  border: "1px solid rgba(255, 255, 255, 0.4)",
  background: "rgba(255, 255, 255, 0.15)",
  color: "#ffffff",
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
  color: "#ffffff", 
  fontSize: "16px", 
  fontWeight: "800",
  display: "flex",
  alignItems: "center",
  gap: "8px"
};

const referralCaption = {
  fontSize: "13px",
  color: "#e6ffe6",
  textAlign: "center",
  margin: "12px 0 24px",
  padding: "12px",
  background: "rgba(255, 255, 255, 0.1)",
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