import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function MultiFunctionDashboard() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showWhatsAppPopup, setShowWhatsAppPopup] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("whatsapp_popup_dismissed") === "true") {
      return;
    }
    const timer = setTimeout(() => {
      setShowWhatsAppPopup(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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

      {showWhatsAppPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            animation: "fadeIn 0.3s ease-out",
          }}
          onClick={() => setShowWhatsAppPopup(false)}
        >
          <div
            style={{
              maxWidth: "420px",
              width: "100%",
              background: "linear-gradient(180deg, #075E54 0%, #128C7E 100%)",
              borderRadius: "24px",
              padding: "32px 24px",
              textAlign: "center",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
              animation: "slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                sessionStorage.setItem("whatsapp_popup_dismissed", "true");
                setShowWhatsAppPopup(false);
              }}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                color: "white",
                fontSize: "20px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
              }}
            >
              ✕
            </button>

            <div
              style={{
                fontSize: "64px",
                marginBottom: "16px",
                animation: "bounce 2s ease-in-out infinite",
              }}
            >
              💬
            </div>

            <h2
              style={{
                fontSize: "24px",
                fontWeight: 900,
                color: "white",
                margin: "0 0 12px",
                textShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              Join Our WhatsApp Channel!
            </h2>

            <p
              style={{
                fontSize: "15px",
                color: "rgba(255,255,255,0.95)",
                lineHeight: 1.6,
                margin: "0 0 24px",
                fontWeight: 500,
              }}
            >
              Follow our WhatsApp channel for <strong>free teachings, tips, and updates</strong> to help you maximize your earnings!
            </p>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "20px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
                📚 Learn strategies to earn more
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
                💡 Get exclusive tips and tricks
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
                🎯 Stay updated with new opportunities
              </p>
            </div>

            <button
              onClick={() => window.open("https://whatsapp.com/channel/0029Vb8a7kKElagpd2ZHlm3b", "_blank")}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "16px",
                border: "none",
                background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                color: "white",
                fontSize: "16px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 8px 20px rgba(37, 211, 102, 0.4)",
                transition: "all 0.3s ease",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              💬 Join WhatsApp Channel
            </button>

            <button
              onClick={() => {
                sessionStorage.setItem("whatsapp_popup_dismissed", "true");
                setShowWhatsAppPopup(false);
              }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                background: "transparent",
                color: "white",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                marginTop: "10px",
                transition: "all 0.2s ease",
              }}
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

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
