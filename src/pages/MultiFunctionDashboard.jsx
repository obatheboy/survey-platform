import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MultiFunctionDashboard() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const EARNING_OPTIONS = [
    {
      id: "survey",
      title: "Do Surveys",
      subtitle: "Earn KES 1,200 - 3,500 daily",
      icon: "📊",
      gradient: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
      route: "/dashboard",
      description: "Complete quick surveys and earn cash instantly. Topics on finance, food, football and more.",
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
      id: "affiliate",
      title: "Affiliate Program",
      subtitle: "Make up to KES 3,600/day",
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
        background: "linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        color: "#f1f5f9",
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
            color: "#fbbf24",
            letterSpacing: "-0.03em",
            textShadow: "0 2px 12px rgba(251, 191, 36, 0.3)"
          }}
        >
          Welcome back, Champion!
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: "#94a3b8",
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
                background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
                borderRadius: "24px",
                padding: "18px 20px",
                cursor: "pointer",
                transition: "all 0.25s ease",
                transform: isHovered ? "translateX(6px)" : "translateX(0)",
                boxShadow: isHovered
                  ? "0 20px 40px rgba(0,0,0,0.5)"
                  : "0 6px 16px rgba(0,0,0,0.3)",
                border: "1px solid #475569",
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
                    ? "0 10px 24px rgba(0,0,0,0.4)"
                    : "0 6px 14px rgba(0,0,0,0.3)",
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
                    color: "#f1f5f9",
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
                    color: "#fbbf24",
                  }}
                >
                  {option.subtitle}
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
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

      <div
        style={{
          maxWidth: "520px",
          margin: "0 auto",
          padding: "16px",
          borderRadius: "20px",
          background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
          boxShadow: "0 8px 24px rgba(37, 211, 102, 0.3)",
          cursor: "pointer",
          transition: "all 0.3s ease",
        }}
        onClick={() => window.open("https://whatsapp.com/channel/0029Vb8a7kKElagpd2ZHlm3b", "_blank")}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            window.open("https://whatsapp.com/channel/0029Vb8a7kKElagpd2ZHlm3b", "_blank");
          }
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: 800,
            letterSpacing: "0.3px",
          }}
        >
          <span style={{ fontSize: "22px" }}>💬</span>
          <span>Join Our WhatsApp Channel</span>
        </div>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: "12px",
            color: "rgba(255,255,255,0.9)",
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          Get updates, tips, and support from our community
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
