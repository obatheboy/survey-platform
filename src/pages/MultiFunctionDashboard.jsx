import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { chatWazunguApi } from "../api/api";

const CHATWAZUNGU_GREEN = "#0DAA65";
const CHATWAZUNGU_DARK = "#0A0A0A";
const CHATWAZUNGU_CARD_BG = "#1A1A1A";
const CHATWAZUNGU_ACCENT = "#FFE66D";
const CHATWAZUNGU_BLUE = "#06b6d4";

const EARNING_OPTIONS = [
  {
    id: "survey",
    title: "Do Surveys",
    subtitle: "Earn KES 1,200 - 6,500 daily",
    icon: "📊",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
    route: "/dashboard",
    description: "Complete surveys and earn between KES 1,200 and 6,500 daily.",
  },
  {
    id: "chat",
    title: "Chat Wazungu",
    subtitle: "Earn KES 500 - 5,500 daily",
    icon: "💬",
    gradient: "linear-gradient(135deg, #0DAA65 0%, #1a8d55 100%)",
    route: "/chatwazungu",
    description: "Unlock premium profiles for KES 99, chat with AI, earn KES 500 per unlock.",
  },
  {
    id: "affiliate",
    title: "Affiliate Program",
    subtitle: "Earn endless commissions",
    icon: "👥",
    gradient: "linear-gradient(135deg, #ea580c 0%, #FF6600 100%)",
    route: "/affiliate",
    description: "Refer friends and earn endless commissions on every unlock and survey.",
  },
];

export default function MultiFunctionDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total_unlocks: 0, wallet_balance: 0 });
  const [selectedDefaultOption, setSelectedDefaultOption] = useState("survey");

  useEffect(() => {
    loadUser();
    loadStats();
  }, []);

  const handleStartNow = () => {
    const option = EARNING_OPTIONS.find(o => o.id === selectedDefaultOption);
    if (option) handleOptionClick(option);
  };

  const loadUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch (err) {
      console.error("Failed to load user:", err);
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

  const handleOptionClick = (option) => {
    navigate(option.route);
  };

  return (
    <div className="multifunc-dashboard">
      <div className="multifunc-header">
        <div className="welcome-section">
          <h1 style={{ color: "#FFE66D", fontSize: "28px", fontWeight: "900", marginBottom: "8px" }}>
            💰
          </h1>
          <h2>Your Earnings Hub</h2>
          <p style={{ color: "#aaa", fontSize: "14px" }}>Select a task below to start earning</p>
        </div>
        <div className="quick-balance">
          <div className="balance-item">
            <span className="balance-label">ChatWazungu Wallet</span>
            <span className="balance-value">KSH {(stats.wallet_balance || 0).toLocaleString()}</span>
          </div>
          <div className="balance-item">
            <span className="balance-label">Unlocks</span>
            <span className="balance-value">{stats.total_unlocks}/6</span>
          </div>
        </div>
      </div>

      {/* Start Now Button */}
      <div className="start-now-container">
        <button className="start-now-btn" onClick={handleStartNow}>
          START NOW
        </button>
        <p className="start-now-note">Starting with surveys — KES 1,200 welcome bonus</p>
      </div>

      <div className="options-grid">
        {EARNING_OPTIONS.map((option) => (
          <div
            key={option.id}
            className="earning-option-card"
            onClick={() => handleOptionClick(option)}
          >
            <div className="option-icon" style={{ background: option.gradient }}>
              <span>{option.icon}</span>
            </div>
            <div className="option-content">
              <h3>{option.title}</h3>
              <p className="option-subtitle">{option.subtitle}</p>
              <p className="option-description">{option.description}</p>
            </div>
            <div className="option-arrow">→</div>
          </div>
        ))}
      </div>

      <div className="daily-potential">
        <h3>Combined Daily Earning Potential</h3>
        <div className="potential-breakdown">
          <div className="potential-item">
            <span>Surveys</span>
            <span>KES 1,200 - 6,500</span>
          </div>
          <div className="potential-item">
            <span>Chat Wazungu (6 unlocks)</span>
            <span>KES 3,000</span>
          </div>
          <div className="potential-item">
            <span>Affiliate</span>
            <span>Unlimited</span>
          </div>
          <div className="potential-total">
            <span>Max Potential</span>
            <span>KES 6,500+</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .multifunc-dashboard {
          min-height: 100vh;
          background: linear-gradient(180deg, ${CHATWAZUNGU_DARK} 0%, #121212 100%);
          color: white;
          padding: 20px;
          padding-bottom: 100px;
        }

        .multifunc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 16px;
          padding: 24px;
          background: linear-gradient(135deg, ${CHATWAZUNGU_GREEN} 0%, #0A8550 100%);
          border-radius: 20px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .welcome-section h1 {
          font-size: 28px;
          font-weight: 800;
          margin: 0 0 4px;
          color: ${CHATWAZUNGU_ACCENT};
        }

        .welcome-section h2 {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
          color: white;
        }

        .welcome-section p {
          font-size: 14px;
          opacity: 0.9;
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
        }

        .start-now-container {
          text-align: center;
          margin-bottom: 32px;
        }

        .start-now-btn {
          background: linear-gradient(135deg, ${CHATWAZUNGU_ACCENT} 0%, #f59e0b 100%);
          color: ${CHATWAZUNGU_DARK};
          border: none;
          border-radius: 28px;
          padding: 18px 56px;
          font-size: 20px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 8px 32px rgba(255, 230, 109, 0.4);
          letter-spacing: 2px;
          transition: all 0.2s;
          animation: pulse-glow 2s ease-in-out infinite;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .start-now-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 12px 40px rgba(255, 230, 109, 0.6);
        }

        .start-now-note {
          margin-top: 12px;
          font-size: 13px;
          color: #aaa;
          font-weight: 600;
        }

        .quick-balance {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .balance-item {
          background-color: rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 12px 20px;
          text-align: center;
          min-width: 80px;
          backdrop-filter: blur(8px);
        }

        .balance-label {
          display: block;
          font-size: 11px;
          opacity: 0.8;
          margin-bottom: 4px;
        }

        .balance-value {
          display: block;
          font-size: 18px;
          font-weight: 800;
          color: white;
        }

        .options-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          margin-bottom: 32px;
        }

        .earning-option-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background-color: ${CHATWAZUNGU_CARD_BG};
          border: 1px solid #333;
          border-left: 4px solid ${CHATWAZUNGU_GREEN};
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
          color: inherit;
          text-decoration: none;
        }

        .earning-option-card:hover {
          transform: translateX(4px);
          border-color: ${CHATWAZUNGU_GREEN};
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        .option-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        .option-content h3 {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 2px;
          color: white;
        }

        .option-subtitle {
          font-size: 12px;
          color: ${CHATWAZUNGU_ACCENT};
          font-weight: 700;
          margin: 0 0 4px;
        }

        .option-description {
          font-size: 12px;
          color: #aaa;
          margin: 0;
          line-height: 1.4;
        }

        .option-arrow {
          margin-left: auto;
          font-size: 24px;
          color: #666;
          transition: transform 0.2s;
        }

        .earning-option-card:hover .option-arrow {
          transform: translateX(4px);
          color: white;
        }

        .daily-potential {
          background-color: ${CHATWAZUNGU_CARD_BG};
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #333;
        }

        .daily-potential h3 {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 16px;
          text-align: center;
          color: white;
        }

        .potential-breakdown {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .potential-item,
        .potential-total {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #333;
        }

        .potential-total {
          margin-top: 8px;
          padding-top: 12px;
          border-top: 2px solid ${CHATWAZUNGU_GREEN};
          font-weight: 800;
        }

        .potential-item span:first-child {
          color: #aaa;
          font-size: 13px;
        }

        .potential-item span:last-child {
          color: ${CHATWAZUNGU_ACCENT};
          font-weight: 700;
          font-size: 14px;
        }

        .potential-total span:last-child {
          color: ${CHATWAZUNGU_GREEN};
          font-size: 18px;
        }
        `}</style>
    </div>
  );
}
