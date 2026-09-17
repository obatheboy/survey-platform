import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { chatWazunguApi } from "../api/api";
import { toast } from "react-hot-toast";
import ChatWindow from "../components/ChatWindow";
import UnlockPaymentModal from "../components/UnlockPaymentModal";

const CHATWAZUNGU_GREEN = "#0DAA65";
const CHATWAZUNGU_DARK = "#0A0A0A";
const CHATWAZUNGU_CARD_BG = "#1A1A1A";
const CHATWAZUNGU_ACCENT = "#FFE66D";

export default function ChatWazunguDashboard() {
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
    toast.success("Profile unlocked! You earned KES 500");
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
          src={profile.avatar || `https://i.pravatar.cc/80?img=${Math.floor(Math.random() * 70) + 1}`}
          alt={profile.name}
          className="profile-avatar"
        />
        {!profile.is_unlocked && (
          <div className="profile-lock-overlay">
            <div className="profile-lock-icon">🔒</div>
            <span className="profile-lock-text">KSH 99</span>
          </div>
        )}
      </div>
      <div className="profile-info">
        <h3 className="profile-name">{profile.name}, {profile.age}</h3>
        <p className="profile-location">{profile.location}</p>
        <p className="profile-description">{profile.description.substring(0, 80)}...</p>
        <div className="profile-interests">
          {profile.interests.slice(0, 3).map((interest, idx) => (
            <span key={idx} className="profile-interest-tag">{interest}</span>
          ))}
        </div>
        {!profile.is_unlocked && (
          <button
            className="profile-unlock-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleUnlock(profile);
            }}
          >
            Unlock for KSH 99
          </button>
        )}
        {profile.is_unlocked && (
          <button
            className="profile-chat-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleChat(profile);
            }}
          >
            Chat Now
          </button>
        )}
      </div>
    </div>
  ));

  return (
    <div className="chatwazungu-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">ChatWazungu</h1>
          <div className="dashboard-wallet">
            <span className="wallet-label">Wallet</span>
            <span className="wallet-amount">KSH {stats.wallet_balance.toLocaleString()}</span>
          </div>
          <div className="dashboard-unlocks">
            <span className="unlocks-label">Unlocks</span>
            <span className="unlocks-count">{stats.total_unlocks} / 6</span>
            {stats.total_unlocks >= 6 && (
              <span className="unlocks-ready">✓ Ready to withdraw</span>
            )}
          </div>
        </div>
      </div>

      <div className="search-bar-container">
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
            <div className="no-results">No profiles match your search</div>
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
            Withdraw Earnings (Min: KSH 500, 6+ unlocks)
          </button>
          <button
            className="affiliate-btn"
            onClick={() => navigate("/affiliate")}
          >
            Affiliate Dashboard
          </button>
        </div>
      </div>

      <style jsx>{`
        .chatwazungu-dashboard {
          min-height: 100vh;
          background: linear-gradient(180deg, ${CHATWAZUNGU_DARK} 0%, #121212 100%);
          color: white;
          padding: 20px;
          padding-bottom: 80px;
        }

        .dashboard-header {
          background: linear-gradient(135deg, ${CHATWAZUNGU_GREEN} 0%, #0A8550 100%);
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .dashboard-title {
          font-size: 28px;
          font-weight: 800;
          margin: 0;
          letter-spacing: 1px;
        }

        .dashboard-wallet,
        .dashboard-unlocks {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: rgba(255, 255, 255, 0.1);
          padding: 8px 16px;
          border-radius: 20px;
        }

        .wallet-label,
        .unlocks-label {
          font-size: 13px;
          opacity: 0.8;
        }

        .wallet-amount,
        .unlocks-count {
          font-size: 16px;
          font-weight: 700;
        }

        .unlocks-ready {
          font-size: 11px;
          background-color: ${CHATWAZUNGU_ACCENT};
          color: ${CHATWAZUNGU_DARK};
          padding: 2px 8px;
          border-radius: 10px;
          font-weight: 700;
        }

        .search-bar-container {
          margin-bottom: 20px;
        }

        .search-input {
          width: 100%;
          padding: 12px 20px;
          border-radius: 24px;
          border: none;
          background-color: #2A2A2A;
          color: white;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }

        .search-input:focus {
          background-color: #333;
          box-shadow: 0 0 0 2px ${CHATWAZUNGU_GREEN};
        }

        .profiles-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .profile-card {
          background-color: ${CHATWAZUNGU_CARD_BG};
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid #333;
          padding: 16px;
        }

        .profile-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          border-color: ${CHATWAZUNGU_GREEN};
        }

        .profile-avatar-container {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 12px;
        }

        .profile-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid ${CHATWAZUNGU_GREEN};
        }

        .profile-lock-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .profile-lock-icon {
          font-size: 20px;
        }

        .profile-lock-text {
          font-size: 12px;
          color: ${CHATWAZUNGU_ACCENT};
          font-weight: 700;
        }

        .profile-info h3 {
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 600;
        }

        .profile-name {
          color: white;
        }

        .profile-location {
          color: #aaa;
          font-size: 13px;
          margin: 0 0 8px;
        }

        .profile-description {
          color: #ccc;
          font-size: 12px;
          line-height: 1.4;
          margin: 0 0 10px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .profile-interests {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 10px;
        }

        .profile-interest-tag {
          background-color: #2A2A2A;
          color: #aaa;
          font-size: 11px;
          padding: 2px 10px;
          border-radius: 10px;
        }

        .profile-unlock-btn,
        .profile-chat-btn {
          width: 100%;
          padding: 8px;
          border-radius: 20px;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .profile-unlock-btn {
          background-color: ${CHATWAZUNGU_GREEN};
          color: white;
        }

        .profile-unlock-btn:hover {
          background-color: #1a8d55;
        }

        .profile-chat-btn {
          background-color: #333;
          color: white;
        }

        .profile-chat-btn:hover {
          background-color: #444;
        }

        .loading-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }

        .profile-skeleton {
          background-color: #2A2A2A;
          border-radius: 12px;
          height: 240px;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        .no-results {
          text-align: center;
          padding: 40px 20px;
          color: #888;
          grid-column: 1 / -1;
        }

        .dashboard-footer {
          position: sticky;
          bottom: 20px;
          margin-top: 20px;
        }

        .dashboard-actions {
          display: flex;
          gap: 12px;
        }

        .withdraw-btn {
          flex: 1;
          padding: 16px;
          background-color: ${CHATWAZUNGU_ACCENT};
          color: ${CHATWAZUNGU_DARK};
          border: none;
          border-radius: 24px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .affiliate-btn {
          flex: 1;
          padding: 16px;
          background-color: transparent;
          color: white;
          border: 2px solid ${CHATWAZUNGU_GREEN};
          border-radius: 24px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .affiliate-btn:hover {
          background-color: ${CHATWAZUNGU_GREEN};
        }

        .withdraw-btn:hover:not(:disabled) {
          background-color: #ffd700;
          transform: scale(1.02);
        }

        .withdraw-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
