import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MultiFunctionDashboard() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const EARNING_OPTIONS = [
    {
      id: "survey",
      title: "Do Surveys",
      subtitle: "Available now",
      icon: "📊",
      gradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
      route: "/dashboard",
      description: "Complete surveys on topics like Safaricom, Equity Bank, food, football and more.",
    },
    {
      id: "chat",
      title: "Chat Wazungu",
      subtitle: "Available now",
      icon: "💬",
      gradient: "linear-gradient(135deg, #0DAA65 0%, #1a8d55 100%)",
      route: "/chatwazungu",
      description: "Unlock premium profiles and chat with new people.",
    },
    {
      id: "work",
      title: "Work Tasks",
      subtitle: "Available now",
      icon: "💼",
      gradient: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
      route: "/work",
      description: "Write articles, train AI, transcribe audio, or write academic pieces.",
    },
    {
      id: "affiliate",
      title: "Affiliate Program",
      subtitle: "Available now",
      icon: "👥",
      gradient: "linear-gradient(135deg, #ea580c 0%, #FF6600 100%)",
      route: "/affiliate",
      description: "Invite friends and earn commissions on every unlock and survey.",
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
          marginBottom: "20px",
          padding: "4px 6px 0",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 900,
            margin: "0 0 8px",
            color: "#111827",
            letterSpacing: "-0.03em",
          }}
        >
          Welcome back, Champion!
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: "#6b7280",
            margin: 0,
            fontWeight: 600,
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
          gap: "16px",
          alignItems: "center",
          marginBottom: "20px",
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
                gap: "16px",
                width: "100%",
                maxWidth: "520px",
                background: "#ffffff",
                borderRadius: "24px",
                padding: "18px 20px",
                cursor: "pointer",
                transition: "all 0.25s ease",
                transform: isHovered ? "translateX(6px)" : "translateX(0)",
                boxShadow: isHovered
                  ? "0 20px 40px rgba(0,0,0,0.18)"
                  : "0 6px 16px rgba(0,0,0,0.06)",
                border: "1px solid #e5e7eb",
              }}
            >
              {/* Icon Circle */}
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  minWidth: "60px",
                  borderRadius: "50%",
                  background: option.gradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "30px",
                  boxShadow: isHovered
                    ? "0 10px 24px rgba(0,0,0,0.25)"
                    : "0 6px 14px rgba(0,0,0,0.12)",
                }}
              >
                {option.icon}
              </div>

              {/* Title + Subtitle + Description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  style={{
                    fontSize: "17px",
                    fontWeight: 900,
                    margin: 0,
                    color: "#111827",
                    lineHeight: 1.2,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {option.title}
                </h2>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    margin: "4px 0 0",
                    color: "#4b5563",
                  }}
                >
                  {option.subtitle}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    lineHeight: 1.5,
                    margin: "4px 0 0",
                  }}
                >
                  {option.description}
                </p>
              </div>

              {/* Chevron */}
              <span
                style={{
                  color: "#9ca3af",
                  fontSize: "24px",
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
    </div>
  );
}
