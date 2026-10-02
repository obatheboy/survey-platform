import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "../contexts/CurrencyContext.jsx";

export default function MultiFunctionDashboard() {
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const EARNING_OPTIONS = [
    {
      id: "survey",
      title: "Do Surveys",
      subtitle: `${format(1200)} - ${format(6500)} daily`,
      icon: "📊",
      gradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
      route: "/dashboard",
      description: `Complete surveys and earn between ${format(1200)} and ${format(6500)} daily.`,
    },
    {
      id: "chat",
      title: "Chat Wazungu",
      subtitle: `${format(500)} - ${format(5500)} daily`,
      icon: "💬",
      gradient: "linear-gradient(135deg, #0DAA65 0%, #1a8d55 100%)",
      route: "/chatwazungu",
      description: `Unlock premium profiles for ${format(99)}, chat with AI, earn ${format(500)} per unlock.`,
    },
    {
      id: "affiliate",
      title: "Affiliate Program",
      subtitle: "Earn endless commissions",
      icon: "👥",
      gradient: "linear-gradient(135deg, #ea580c 0%, #FF6600 100%)",
      route: "/affiliate",
      description:
        "Refer friends and earn endless commissions on every unlock and survey.",
    },
  ];

  const handleOptionClick = (option) => {
    navigate(option.route);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #f0f4f8 0%, #ffffff 100%)",
        color: "#1f2937",
        padding: "16px 16px 20px",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif",
      }}
    >
      {/* Welcome Section */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "16px",
          padding: "4px 6px 0",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            margin: "0 0 6px",
            color: "#111827",
            letterSpacing: "-0.02em",
          }}
        >
          Welcome back, Champion!
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#6b7280",
            margin: 0,
            fontWeight: 500,
          }}
        >
          Select a task below to start earning today
        </p>
      </div>

      {/* Task Cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        {EARNING_OPTIONS.map((option) => {
          const isHovered = hoveredCard === option.id;
          return (
            <div
              key={option.id}
              onClick={() => handleOptionClick(option)}
              onMouseEnter={() => setHoveredCard(option.id)}
              onMouseLeave={() => setHoveredCard(null)}
              title={option.description}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                width: "100%",
                maxWidth: "480px",
                background: "#ffffff",
                borderRadius: "20px",
                padding: "16px 18px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                transform: isHovered ? "translateX(3px)" : "translateX(0)",
                boxShadow: isHovered
                  ? "0 12px 26px rgba(0,0,0,0.14)"
                  : "0 4px 12px rgba(0,0,0,0.06)",
                border: "1px solid #e5e7eb",
              }}
            >
              {/* Icon Circle */}
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  minWidth: "56px",
                  borderRadius: "50%",
                  background: option.gradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  boxShadow: isHovered
                    ? "0 8px 18px rgba(0,0,0,0.2)"
                    : "0 5px 12px rgba(0,0,0,0.1)",
                }}
              >
                {option.icon}
              </div>

              {/* Title + Subtitle + Description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    margin: 0,
                    color: "#111827",
                    lineHeight: 1.2,
                  }}
                >
                  {option.title}
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    margin: "3px 0 0",
                    color: "#4b5563",
                  }}
                >
                  {option.subtitle}
                </p>
                <p
                  style={{
                    fontSize: "11.5px",
                    color: "#6b7280",
                    lineHeight: 1.45,
                    margin: "3px 0 0",
                  }}
                >
                  {option.description}
                </p>
              </div>

              {/* Chevron */}
              <span
                style={{
                  color: "#9ca3af",
                  fontSize: "22px",
                  fontWeight: 800,
                  minWidth: "16px",
                  textAlign: "right",
                }}
              >
                ›
              </span>
            </div>
          );
        })}
      </div>

      {/* Bottom Stats Bar */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "14px 18px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          border: "1px solid #e5e7eb",
          maxWidth: "480px",
          margin: "0 auto",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 700,
            margin: "0 0 14px",
            textAlign: "center",
            color: "#111827",
          }}
        >
          Combined Daily Earning Potential
        </h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <StatRow
            label="Surveys"
            value={`${format(1200)} - ${format(6500)}`}
          />
          <StatRow
            label="Chat Wazungu (6 unlocks)"
            value={format(3000)}
          />
          <StatRow label="Affiliate" value="Unlimited" highlight />
          <TotalRow label="Max Potential" value={`${format(6500)}+`} />
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, highlight }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <span style={{ fontSize: "13px", color: "#6b7280" }}>{label}</span>
      <span
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: highlight ? "#0DAA65" : "#111827",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function TotalRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: "10px",
        marginTop: "2px",
        borderTop: "2px solid #06b6d4",
      }}
    >
      <span
        style={{
          fontSize: "14px",
          fontWeight: 800,
          color: "#111827",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "18px",
          fontWeight: 800,
          background: "linear-gradient(135deg, #06b6d4 0%, #ea580c 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {value}
      </span>
    </div>
  );
}
