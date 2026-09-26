import { useNavigate } from "react-router-dom";

const CHATWAZUNGU_GREEN = "#0DAA65";
const CHATWAZUNGU_DARK = "#0A0A0A";
const CHATWAZUNGU_CARD_BG = "#1A1A1A";
const CHATWAZUNGU_ACCENT = "#FFE66D";

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

  const handleOptionClick = (option) => {
    navigate(option.route);
  };

  return (
    <div className="multifunc-dashboard">
      <div className="multifunc-header">
        <div className="welcome-section">
          <h2>Your Earnings Hub</h2>
          <p>Select a task below to start earning</p>
        </div>
      </div>

      {/* Earning Options */}
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
          text-align: center;
          padding: 20px 16px 12px;
          margin-bottom: 20px;
        }

        .welcome-section h2 {
          font-size: 22px;
          font-weight: 800;
          margin: 0 0 4px;
          color: white;
        }

        .welcome-section p {
          font-size: 14px;
          color: #aaa;
          margin: 0;
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
