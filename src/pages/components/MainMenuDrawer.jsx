import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import { refreshApp } from "../../utils/cache";
import "./MainMenuDrawer.css";

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
    const message = encodeURIComponent("Hello Survey App Kenya Support, I need help with my survey account.");
    const whatsappUrl = `https://wa.me/254106926547?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const referralCode = user?.referral_code || user?.id;
  const referralLink = `${window.location.origin}/auth?ref=${referralCode}`;
  const shareMessage = `Hey! I'm earning rewards by completing simple surveys on Survey App Kenya.\n\nJoin using my link and get started!\n\n${referralLink}`;

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

  const handleRefreshApp = () => {
    setToast("🔄 Refreshing app...");
    setTimeout(() => setToast(""), 2000);
    onClose();
    setTimeout(() => {
      refreshApp();
    }, 300);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.warn("Logout API failed, proceeding with client-side logout:", error);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("active_plan");
    localStorage.removeItem("cachedUser");
    localStorage.removeItem("user");

    navigate("/auth", { replace: true });
    onClose();
  };

  return (
    <>
      {toast && (
        <div className="drawer-toast">
          {toast}
        </div>
      )}

      {/* OVERLAY */}
      <div className="drawer-overlay" onClick={onClose} />

      {/* DRAWER */}
      <div className="drawer-content">
        {/* PROFILE */}
        <div className="drawer-profile">
          <div className="drawer-avatar">
            {user.full_name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="drawer-user-info">
            <p className="drawer-user-name">{user.full_name}</p>
          </div>
          <button className="drawer-profile-btn" onClick={() => setToast("Profile settings coming soon!")}>
            Profile
          </button>
        </div>

        <hr className="drawer-divider" />

        {/* NEW FEATURES */}
        <h4 className="drawer-section-title">Quick Navigation</h4>
        <MenuItem label="Home" icon="home" onClick={() => { onClose(); }} />
        <button
          onClick={() => {
            onClose();
            if (goToSurveys) {
              goToSurveys();
            } else {
              navigate('/dashboard#surveys-section');
            }
          }}
          className="drawer-menu-item"
        >
          <span className="drawer-menu-icon">📋</span>
          <span>Surveys</span>
        </button>
        <MenuItem label="Affiliate" icon="affiliate" onClick={() => onNavigate('/affiliate')} />
        <MenuItem label="Withdraw" icon="withdraw" onClick={() => onNavigate('/withdraw-form')} />
        <MenuItem label="Activate" icon="activate" onClick={() => { onClose(); navigate('/activate'); }} />

        <hr className="drawer-divider" />

        <h4 className="drawer-section-title">App Menu</h4>
        <MenuItem label="FAQ & Help" icon="help" onClick={() => onNavigate('/faq')} />
        <MenuItem label="Account Stats" icon="stats" onClick={showAccountStats} />
        <MenuItem label="Contact Support" icon="support" onClick={openWhatsAppSupport} />
        <MenuItem label="Refresh App" icon="refresh" onClick={handleRefreshApp} />

        <hr className="drawer-divider" />

        <h4 className="drawer-section-title">Invite & Earn</h4>
        <p className="drawer-referral-caption">
          Earn <strong>KES 250</strong> for every friend who signs up and activates.
        </p>
        <div className="drawer-share-buttons">
          <button className="drawer-share-btn drawer-share-whatsapp" onClick={shareToWhatsApp}>
            <span className="drawer-share-icon">📱</span>
            <span>WhatsApp</span>
          </button>
          <button className="drawer-share-btn drawer-share-sms" onClick={shareToSMS}>
            <span className="drawer-share-icon">💬</span>
            <span>SMS</span>
          </button>
          <button className="drawer-share-btn drawer-share-copy" onClick={copyLink}>
            <span className="drawer-share-icon">🔗</span>
            <span>Copy</span>
          </button>
        </div>

        <hr className="drawer-divider" />
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
      activate: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>,
      refresh: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>,
    };
    return iconMap[icon] || null;
  };

  return (
    <button
      onClick={onClick}
      className={`drawer-menu-item ${danger ? 'danger' : ''}`}
    >
      <span className="drawer-menu-icon">{getIcon()}</span>
      {label}
    </button>
  );
}

/* =========================
   STYLES - REMOVED: Using CSS classes instead
========================= */
// Inline styles removed, CSS classes defined in MainMenuDrawer.css