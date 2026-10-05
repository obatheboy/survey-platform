import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { chatWazunguApi } from "../api/api";
import { toast } from "react-hot-toast";
import api from "../api/api";
import ChatWindow from "../components/ChatWindow";
import UnlockPaymentModal from "../components/UnlockPaymentModal";
import { useCurrency } from "../contexts/CurrencyContext.jsx";
import "./ChatWazunguDashboard.css";

const getWhiteAvatar = (profileId) => {
  const id = Number(profileId) || 1;
  const num = (Math.abs(id) % 50) + 1;
  const gender = Math.abs(id) % 2 === 0 ? "men" : "women";
  return `https://randomuser.me/api/portraits/${gender}/${num}.jpg`;
};

export default function ChatWazunguDashboard() {
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [stats, setStats] = useState({ total_unlocks: 0, wallet_balance: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [userPhone, setUserPhone] = useState("");

  useEffect(() => {
    loadProfiles();
    loadStats();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUserPhone(res.data.phone || "");
    } catch (err) {
      console.error("Failed to load user:", err);
    }
  };

  const loadProfiles = async () => {
    try {
      const res = await chatWazunguApi.getProfiles();
      setProfiles(res.data.profiles || []);
      setStats({
        total_unlocks: res.data.total_unlocks || 0,
        wallet_balance: res.data.wallet_balance || 0
      });
    } catch (err) {
      console.error("Failed to load profiles:", err);
      toast.error("Failed to load profiles");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await chatWazunguApi.getUserStats();
      setStats({
        total_unlocks: res.data.total_unlocks || 0,
        wallet_balance: res.data.wallet_balance || 0
      });
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  const handleUnlock = async (profile) => {
    setSelectedProfile(profile);
    setShowUnlockModal(true);
  };

  const handlePaymentSuccess = async () => {
    setShowUnlockModal(false);
    await loadProfiles();
    await loadStats();

    if (selectedProfile) {
      const updatedProfile = (await chatWazunguApi.getProfile(selectedProfile.id)).data;
      setActiveChat(updatedProfile);
    }
    setSelectedProfile(null);
    toast.success(`Profile unlocked! You earned ${format(500)}`);
  };

  const handleChat = (profile) => {
    if (!profile.is_unlocked) {
      handleUnlock(profile);
      return;
    }
    setActiveChat(profile);
  };

  const handleCloseChat = () => {
    setActiveChat(null);
  };

  const handleCloseUnlock = () => {
    setShowUnlockModal(false);
    setSelectedProfile(null);
  };

  const filteredProfiles = profiles.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const profileCards = filteredProfiles.map((profile) => (
    <div
      key={profile.id}
      className="profile-card"
      onClick={() => handleChat(profile)}
    >
      <div className="profile-avatar-container">
        <img
          src={profile.avatar || getWhiteAvatar(profile.id)}
          alt={profile.name}
          className="profile-avatar"
        />
        {!profile.is_unlocked && (
          <div className="profile-lock-overlay">
            <div className="profile-lock-icon">🔒</div>
            <span className="profile-lock-text">{format(99)}</span>
          </div>
        )}
      </div>
      <div className="profile-info">
        <h3 className="profile-name">{profile.name}, {profile.age}</h3>
        <p className="profile-location">📍 {profile.location}</p>
        <p className="profile-description">{profile.description.substring(0, 80)}...</p>
        <div className="profile-interests">
          {profile.interests.slice(0, 3).map((interest, idx) => (
            <span key={idx} className="profile-interest-tag">{interest}</span>
          ))}
        </div>
        {!profile.is_unlocked ? (
          <button
            className="profile-unlock-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleUnlock(profile);
            }}
          >
            🔓 Unlock for {format(99)}
          </button>
        ) : (
          <button
            className="profile-chat-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleChat(profile);
            }}
          >
            💬 Chat Now
          </button>
        )}
      </div>
    </div>
  ));

  return (
    <div className="chatwazungu-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">💬 ChatWazungu</h1>
          <div className="header-stats">
            <div className="stat-badge">
              <span className="stat-icon">💰</span>
              <div>
                <div className="stat-label">Wallet</div>
                <div className="stat-value">{format(stats.wallet_balance)}</div>
              </div>
            </div>
            <div className="stat-badge">
              <span className="stat-icon">🔓</span>
              <div>
                <div className="stat-label">Unlocks</div>
                <div className="stat-value">
                  {stats.total_unlocks} / 6
                  {stats.total_unlocks >= 6 && (
                    <span className="stat-ready">✓ Ready</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="search-bar-container">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search profiles by name or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <div className="loading-grid">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="profile-skeleton"></div>
          ))}
        </div>
      ) : (
        <div className="profiles-grid">
          {profileCards.length > 0 ? (
            profileCards
          ) : (
            <div className="no-results">
              <div className="no-results-icon">😕</div>
              <div>No profiles match your search</div>
            </div>
          )}
        </div>
      )}

      {activeChat && (
        <ChatWindow
          profile={activeChat}
          onClose={handleCloseChat}
        />
      )}

      {showUnlockModal && selectedProfile && (
        <UnlockPaymentModal
          profile={selectedProfile}
          userPhone={userPhone}
          onSuccess={handlePaymentSuccess}
          onClose={handleCloseUnlock}
        />
      )}

      <div className="dashboard-footer">
        <div className="dashboard-actions">
          <button
            className="withdraw-btn"
            onClick={() => navigate("/withdrawal")}
            disabled={stats.total_unlocks < 6 || stats.wallet_balance < 500}
          >
            💸 Withdraw Earnings
          </button>
          <button
            className="affiliate-btn"
            onClick={() => navigate("/affiliate")}
          >
            👥 Affiliate
          </button>
        </div>
      </div>
    </div>
  );
}
