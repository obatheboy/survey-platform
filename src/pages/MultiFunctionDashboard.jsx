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
      earnHighlight: `${format(1200)} - ${format(6500)}`,
    },
    {
      id: "work",
      title: "Work Tasks",
      subtitle: `${format(40)} - ${format(300)} per task`,
      icon: "💼",
      gradient: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
      route: "/work",
      description: "Write articles, train AI, transcribe audio, or write academic pieces.",
      earnHighlight: `${format(40)} - ${format(300)}`,
    },
    {
      id: "chat",
      title: "Chat Wazungu",
      subtitle: `${format(500)} - ${format(5500)} daily`,
      icon: "💬",
      gradient: "linear-gradient(135deg, #0DAA65 0%, #1a8d55 100%)",
      route: "/chatwazungu",
      description: `Unlock premium profiles for ${format(99)}, chat with AI, earn ${format(500)} per unlock.`,
      earnHighlight: `${format(500)} - ${format(5500)}`,
    },
    {
      id: "affiliate",
      title: "Affiliate Program",
      subtitle: "Endless commissions",
      icon: "👥",
      gradient: "linear-gradient(135deg, #ea580c 0%, #FF6600 100%)",
      route: "/affiliate",
      description:
        "Refer friends and earn endless commissions on every unlock and survey.",
      earnHighlight: "∞",
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
            fontSize: "30px",
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
            fontSize: "15px",
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
                    fontSize: "20px",
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
                    fontSize: "14px",
                    fontWeight: 800,
                    margin: "4px 0 0",
                    color: "#4b5563",
                  }}
                >
                  {option.subtitle}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    lineHeight: 1.5,
                    margin: "4px 0 0",
                  }}
                >
                  {option.description}
                </p>
              </div>

              {/* Earn Highlight */}
              <div
                style={{
                  minWidth: "64px",
                  textAlign: "right",
                }}
              >
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 900,
                    background: option.gradient,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    lineHeight: 1.2,
                  }}
                >
                  {option.earnHighlight}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#6b7280",
                    marginTop: "2px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {option.id === "affiliate" ? "EARN" : option.id === "work" ? "PER TASK" : "DAILY"}
                </div>
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

      {/* Bottom Stats Bar */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "24px",
          padding: "18px 20px",
          boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
          border: "1px solid #e5e7eb",
          maxWidth: "520px",
          margin: "0 auto",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: 800,
            margin: "0 0 16px",
            textAlign: "center",
            color: "#111827",
            letterSpacing: "-0.01em",
          }}
        >
          Combined Daily Earning Potential
        </h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <StatRow
            label="Surveys"
            value={`${format(1200)} - ${format(6500)}`}
          />
          <StatRow
            label="Work Tasks"
            value={`${format(40)} - ${format(300)}`}
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
        padding: "8px 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <span style={{ fontSize: "14px", color: "#6b7280", fontWeight: 600 }}>{label}</span>
      <span
        style={{
          fontSize: "16px",
          fontWeight: 900,
          color: highlight ? "#0DAA65" : "#111827",
          letterSpacing: "-0.01em",
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
        paddingTop: "12px",
        marginTop: "4px",
        borderTop: "2px solid #06b6d4",
      }}
    >
      <span
        style={{
          fontSize: "15px",
          fontWeight: 900,
          color: "#111827",
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "20px",
          fontWeight: 900,
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
