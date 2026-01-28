// ========================= Dashboard.jsx =========================
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import MainMenuDrawer from "./components/MainMenuDrawer.jsx";
import LiveWithdrawalFeed from "./components/LiveWithdrawalFeed.jsx";
import Notifications from "./components/Notifications.jsx";
import Testimonials from "../components/Testimonials.jsx";
import "./Dashboard.css";
import "./Dashboard-Enhanced.css";

/* =========================
   PLAN CONFIG
========================= */
const PLANS = {
  REGULAR: { 
    name: "Regular", 
    icon: "⭐", 
    total: 1500, 
    perSurvey: 150,
    color: "#4ade80",
    gradient: "linear-gradient(135deg, #4ade80, #22c55e)",
    borderColor: "rgba(74, 222, 128, 0.4)",
    bgColor: "rgba(74, 222, 128, 0.1)",
    description: "Perfect for beginners"
  },
  VIP: { 
    name: "VIP", 
    icon: "💎", 
    total: 2000, 
    perSurvey: 200,
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    borderColor: "rgba(59, 130, 246, 0.4)",
    bgColor: "rgba(59, 130, 246, 0.1)",
    description: "For active earners"
  },
  VVIP: { 
    name: "VVIP", 
    icon: "👑", 
    total: 3000, 
    perSurvey: 300,
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    borderColor: "rgba(245, 158, 11, 0.4)",
    bgColor: "rgba(245, 158, 11, 0.1)",
    description: "Maximum earnings"
  },
};

const TOTAL_SURVEYS = 10;

export default function Dashboard() {
  const navigate = useNavigate();

  const surveyRef = useRef(null);
  const welcomeRef = useRef(null);
  const dashboardRef = useRef(null);

  /* =========================
     UI STATE
  ========================= */
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarned: 0,
    availableBalance: 0,
    totalSurveysCompleted: 0,
    totalWithdrawals: 0
  });

  /* =========================
     WHATSAPP CAPTION BLINKING EFFECT - FASTER
  ========================= */
  const [showCaption, setShowCaption] = useState(true);
  const [showScrollReminder, setShowScrollReminder] = useState(false);
  const [reminderShown, setReminderShown] = useState(false);

  /* =========================
     WELCOME BONUS MODAL STATE
  ========================= */
  const [showWelcomeBonusModal, setShowWelcomeBonusModal] = useState(false);

  /* =========================
     DATA STATE
  ========================= */
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState({});
  const [quickActions, setQuickActions] = useState([
    { id: 1, label: "Complete Profile", icon: "👤", completed: false },
    { id: 2, label: "Verify Email", icon: "📧", completed: false },
    { id: 3, label: "Invite Friends", icon: "👥", completed: false },
  ]);

  /* =========================
     WITHDRAW STATE - SIMPLIFIED
  ========================= */
  const [pendingWithdrawals, setPendingWithdrawals] = useState({});
  const [fullScreenNotification, setFullScreenNotification] = useState(null);

  /* =========================
     LOAD DASHBOARD
  ========================= */
  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const resUser = await api.get("/auth/me");
        if (!alive) return;

        setUser(resUser.data);
        setPlans(resUser.data.plans || {});
        
        // Calculate stats
        const totalEarned = Number(resUser.data.total_earned || 0);
        const totalSurveys = Object.values(resUser.data.plans || {}).reduce(
          (sum, plan) => sum + (plan.surveys_completed || 0), 0
        );
        
        setStats({
          totalEarned,
          availableBalance: totalEarned,
          totalSurveysCompleted: totalSurveys,
          totalWithdrawals: resUser.data.total_withdrawals || 0
        });

        // Load pending withdrawals
        loadPendingWithdrawals();

        localStorage.setItem("cachedUser", JSON.stringify(resUser.data));
      } catch (err) {
        console.error("Dashboard load failed:", err);
        if (!navigator.onLine) {
          const cachedUser = localStorage.getItem("cachedUser");
          if (cachedUser) {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
            setPlans(parsedUser.plans || {});
          }
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 30000);
    window.addEventListener("focus", load);

    return () => {
      alive = false;
      clearInterval(interval);
      window.removeEventListener("focus", load);
    };
  }, []);

  /* =========================
     SHOW WELCOME BONUS MODAL ON MOUNT
  ========================= */
  useEffect(() => {
    // Show modal on component mount
    const timer = setTimeout(() => {
      setShowWelcomeBonusModal(true);
    }, 1000); // Slight delay for better UX

    return () => clearTimeout(timer);
  }, []);

  /* =========================
     LOAD PENDING WITHDRAWALS
  ========================= */
  const loadPendingWithdrawals = async () => {
    try {
      const res = await api.get("/withdraw/history");
      const pending = {};
      (res.data || []).forEach(w => {
        if (w.status === "PENDING" || w.status === "PROCESSING") {
          pending[w.type] = {
            ...w,
            referral_code: w.referral_code || "N/A",
            share_count: w.share_count || 0
          };
        }
      });
      setPendingWithdrawals(pending);
    } catch (err) {
      console.error("Failed to load withdrawal history:", err);
    }
  };

  /* =========================
     PROGRESS BARS ANIMATION
  ========================= */
  useEffect(() => {
    const progressBars = document.querySelectorAll('.progress-bar-fill');
    progressBars.forEach(bar => {
      const width = bar.style.width;
      bar.style.width = '0';
      setTimeout(() => {
        bar.style.width = width;
      }, 300);
    });
  }, [plans]);

  /* =========================
     WHATSAPP CAPTION BLINKING EFFECT - FASTER
  ========================= */
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCaption(prev => !prev);
    }, 800);

    return () => clearInterval(interval);
  }, []);

  /* =========================
     SCROLL REMINDER NOTIFICATION - FIXED VERSION
  ========================= */
  useEffect(() => {
    if (reminderShown) return;
    
    const checkScrollPosition = () => {
      const currentScroll = window.scrollY || document.documentElement.scrollTop;
      return currentScroll < 100;
    };

    if (checkScrollPosition()) {
      const timer = setTimeout(() => {
        setShowScrollReminder(true);
        setReminderShown(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [reminderShown]);

  useEffect(() => {
    const handleScroll = () => {
      if (showScrollReminder) {
        setShowScrollReminder(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showScrollReminder]);

  const dismissScrollReminder = () => {
    setShowScrollReminder(false);
    setReminderShown(true);
  };

  /* =========================
     HELPERS
  ========================= */
  const surveysDone = (plan) => plans[plan]?.surveys_completed || 0;
  const isCompleted = (plan) => surveysDone(plan) >= TOTAL_SURVEYS;
  const isActivated = (plan) => plans[plan]?.is_activated === true;
  const earnedSoFar = (plan) => surveysDone(plan) * PLANS[plan].perSurvey;
  const progressPercentage = (plan) => (surveysDone(plan) / TOTAL_SURVEYS) * 100;

  const getPlanStatus = (plan) => {
    if (isCompleted(plan)) return { status: "completed", label: "Ready to Withdraw", icon: "✅" };
    if (surveysDone(plan) > 0) return { status: "in-progress", label: "In Progress", icon: "⏳" };
    return { status: "not-started", label: "Start Earning", icon: "🚀" };
  };

  /* =========================
     TAB + SCROLL
  ========================= */
  const goToSurveys = () => {
    setActiveTab("SURVEYS");
    setTimeout(() => {
      surveyRef.current?.scrollIntoView({ 
        behavior: "smooth",
        block: "start"
      });
    }, 50);
  };

  const goToWelcome = () => {
    setActiveTab("OVERVIEW");
    setTimeout(() => {
      welcomeRef.current?.scrollIntoView({ 
        behavior: "smooth",
        block: "start"
      });
    }, 50);
  };

  /* =========================
     SURVEY ACTION
  ========================= */
  const startSurvey = async (plan) => {
    try {
      localStorage.setItem("active_plan", plan);
      await api.post("/surveys/select-plan", { plan });
      navigate("/surveys");
    } catch {
      setToast("Failed to start survey. Please try again.");
      setTimeout(() => setToast(""), 3000);
    }
  };

  /* =========================
     WITHDRAW LOGIC - SIMPLIFIED
  ========================= */
  const handleWithdrawClick = async (plan) => {
    // Debounce protection
    const now = Date.now();
    const lastClickTime = localStorage.getItem(`lastWithdrawClick_${plan}`);
    if (lastClickTime && (now - parseInt(lastClickTime)) < 2000) {
      setToast("Please wait before clicking again");
      setTimeout(() => setToast(""), 3000);
      return;
    }
    localStorage.setItem(`lastWithdrawClick_${plan}`, now.toString());

    if (!isCompleted(plan)) {
      setToast(`Complete ${TOTAL_SURVEYS - surveysDone(plan)} more surveys to withdraw`);
      goToSurveys();
      setTimeout(() => setToast(""), 4000);
      return;
    }

    // Check if account is activated
    if (!isActivated(plan)) {
      try {
        await api.post("/surveys/select-plan", { plan });
      } catch (error) {
        console.error("Failed to set active plan:", error);
      }
      
      navigate("/activation-notice", { 
        state: { 
          plan: plans[plan],
          planType: plan,
          amount: PLANS[plan].total
        }
      });
      return;
    }

    // Check for pending withdrawal
    if (pendingWithdrawals[plan]) {
      // Navigate to success page to manage existing withdrawal
      navigate("/withdraw-success", {
        state: {
          withdrawal: pendingWithdrawals[plan],
          plan: PLANS[plan]
        }
      });
      return;
    }

    // Navigate to form page for new withdrawal
    navigate("/withdraw-form", { state: { plan } });
  };

  /* =========================
     WELCOME BONUS
  ========================= */
const handleWelcomeBonusWithdraw = () => {
  // Close the modal first
  setShowWelcomeBonusModal(false);
  
  // Prevent scrolling
  document.body.classList.add('no-scroll');
  
  // Then show the notification
  setFullScreenNotification({
    message: "🎁 Activate your account with KES 100 to unlock your KES 1,200 welcome bonus!",
    redirect: "/activate?welcome_bonus=1",
  });
};

  /* =========================
     QUICK ACTIONS
  ========================= */
  const completeQuickAction = (id) => {
    setQuickActions(prev =>
      prev.map(action =>
        action.id === id ? { ...action, completed: true } : action
      )
    );
    setToast("Action completed! +10 points awarded");
    setTimeout(() => setToast(""), 3000);
  };

  /* =========================
     WHATSAPP SUPPORT FUNCTION
  ========================= */
  const openWhatsAppSupport = () => {
    const message = encodeURIComponent("Hello SurveyEarn Support, I need help with my survey account.");
    const whatsappUrl = `https://wa.me/254794101450?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  /* =========================
     RENDER LOADING & NO USER
  ========================= */
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading your dashboard...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="no-user-container">
        <h2>Session Expired</h2>
        <p>Please log in again to access your dashboard.</p>
        <button className="primary-btn" onClick={() => navigate("/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  /* =========================
     MAIN RENDER
  ========================= */
  return (
    <div className="dashboard" ref={dashboardRef}>
      {/* WELCOME BONUS MODAL - FULL SCREEN CENTERED */}
      {showWelcomeBonusModal && (
        <div className="welcome-bonus-modal-overlay">
          <div className="welcome-bonus-modal-container">
            <div className="welcome-bonus-modal-card">
              <button className="modal-close-btn" onClick={() => setShowWelcomeBonusModal(false)}>
                ✕
              </button>
              
              <div className="modal-bonus-card-header">
                <span className="modal-bonus-icon">🎁</span>
                <div className="modal-bonus-header-text">
                  <h3>Welcome Bonus</h3>
                  <p className="modal-bonus-subtitle">Activate to claim</p>
                </div>
              </div>
              
              <div className="modal-bonus-amount-display">
                <span className="currency">KES</span>
                <span className="amount">1,200</span>
              </div>
              
              <div className="modal-bonus-description">
                <p>Activate your account with <strong>KES 100</strong> to unlock your welcome bonus</p>
              </div>

              <div className="modal-bonus-actions">
                <button className="modal-primary-btn full-width" onClick={handleWelcomeBonusWithdraw}>
                  <span className="btn-icon">🔓</span>
                  Activate & Claim Bonus
                </button>
                <button className="modal-secondary-btn full-width" onClick={() => {
                  setShowWelcomeBonusModal(false);
                  navigate("/faq#welcome-bonus");
                }}>
                  Learn More
                </button>
              </div>

              <div className="modal-bonus-details-collapsible">
                <details className="modal-bonus-details">
                  <summary>View Bonus Details</summary>
                  <div className="modal-details-content">
                    <div className="modal-detail-item">
                      <span className="modal-detail-icon">✅</span>
                      <span>Instant activation upon payment</span>
                    </div>
                    <div className="modal-detail-item">
                      <span className="modal-detail-icon">🔒</span>
                      <span>Secure payment processing</span>
                    </div>
                    <div className="modal-detail-item">
                      <span className="modal-detail-icon">👥</span>
                      <span>15,000+ satisfied users</span>
                    </div>
                    <div className="modal-detail-item">
                      <span className="modal-detail-icon">⏱️</span>
                      <span>Limited time offer</span>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCROLL REMINDER NOTIFICATION */}
      {showScrollReminder && (
        <div className="scroll-reminder-notification">
          <div className="scroll-reminder-content">
            <div className="scroll-reminder-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
            </div>
            <div className="scroll-reminder-text">
              <strong>More content below! ✨</strong>
              <p>Scroll down to see your surveys, earnings, and more!</p>
            </div>
            <button 
              className="scroll-reminder-dismiss"
              onClick={dismissScrollReminder}
              aria-label="Dismiss reminder"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && <Notifications message={toast} />}


{/* FULL SCREEN NOTIFICATION - CENTERED AND FIXED */}
{fullScreenNotification && (
  <div className="full-screen-notif" style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(8px)',
    overflow: 'hidden',
    padding: '20px',
    boxSizing: 'border-box'
  }}>
    <div className="notif-content" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '24px',
      padding: '40px 30px',
      maxWidth: '450px',
      width: '100%',
      textAlign: 'center',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      animation: 'scaleIn 0.3s ease-out',
      position: 'relative',
      zIndex: 10000
    }}>
      <div style={{
        fontSize: '50px',
        marginBottom: '20px',
        animation: 'pulse 2s infinite'
      }}>
        🎁
      </div>
      
      <h3 style={{
        color: 'white',
        margin: '0 0 15px 0',
        fontSize: '24px',
        fontWeight: '700'
      }}>
        Welcome Bonus!
      </h3>
      
      <p style={{
        color: 'rgba(255, 255, 255, 0.95)',
        fontSize: '16px',
        lineHeight: '1.5',
        marginBottom: '30px',
        padding: '0 10px'
      }}>
        {fullScreenNotification.message}
      </p>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        width: '100%'
      }}>
        {fullScreenNotification.redirect && (
          <button
            className="primary-btn"
            onClick={() => {
              setFullScreenNotification(null);


              
              navigate(fullScreenNotification.redirect);
            }}
            style={{
              background: 'linear-gradient(to right, #ff8a00, #da1b60)',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              padding: '16px 24px',
              fontSize: '18px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              width: '100%',
              boxShadow: '0 8px 25px rgba(255, 138, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 138, 0, 0.6)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 138, 0, 0.4)';
            }}
          >
            <span style={{ fontSize: '20px' }}>🔓</span>
            Activate Account Now
          </button>
        )}
        
        <button
          className="secondary-btn"
          
onClick={() => {
  setFullScreenNotification(null);
  document.body.classList.remove('no-scroll');
}}

          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50px',
            padding: '14px 24px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            width: '100%',
            backdropFilter: 'blur(10px)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          Maybe Later
        </button>
      </div>
      
      <div style={{
        marginTop: '25px',
        padding: '15px',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        fontSize: '13px',
        color: 'rgba(255, 255, 255, 0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span>✅</span>
          <span>Instant activation upon payment</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔒</span>
          <span>Secure M-Pesa payment</span>
        </div>
      </div>
    </div>
  </div>
)}



      {/* MAIN MENU HEADER WITH DASHBOARD TITLE */}
      <header className="dashboard-main-header">
        <div className="header-title-container">
          <h1 className="dashboard-main-title">Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={openWhatsAppSupport}
              style={{
                background: '#25D366',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                boxShadow: '0 3px 8px rgba(37, 211, 102, 0.3)',
                padding: 0
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              title="Contact Support on WhatsApp"
            >
              💬
            </button>
            
            <button className="menu-btn" onClick={() => setMenuOpen(true)}>
              <span className="menu-icon">☰</span>
            </button>
          </div>
        </div>
        <p className="header-subtitle">Welcome back, {user.full_name.split(' ')[0]}!👋Start Earning Today💸💸</p>
      </header>

      {/* MAIN MENU DRAWER */}
      <MainMenuDrawer 
        open={menuOpen} 
        onClose={() => setMenuOpen(false)} 
        user={user}
        onNavigate={(path) => {
          setMenuOpen(false);
          navigate(path);
        }}
      />

      {/* HERO SECTION - ULTRA COMPACT */}
      <div className="dashboard-section" style={{
        background: 'linear-gradient(135deg, rgba(255, 83, 3, 0.97), rgb(255, 40, 2))',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        margin: '0 var(--space-sm) var(--space-md)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '70px',
          height: '70px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0) 70%)',
          borderRadius: '50%',
          zIndex: '0'
        }}></div>
        
        <div style={{
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '1.25rem',
          position: 'relative',
          zIndex: '1'
        }}>
          <div style={{flex: 1}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.08))',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                boxShadow: '0 3px 8px rgba(0, 0, 0, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                👋
              </div>
              <div>
                <h3 style={{
                  color: 'white', 
                  margin: '0 0 0.1rem', 
                  fontSize: '1.25rem', 
                  fontWeight: '800',
                  textShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  letterSpacing: '-0.1px'
                }}>
                  Hi, <span style={{color: '#ffef00', fontWeight: '900'}}>{user.full_name.split(' ')[0]}</span>!
                </h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.9)', 
                  margin: '0', 
                  fontSize: '0.8rem',
                  fontWeight: '500'
                }}>
                  🎉🎉Start earning now 🎉🎉
                </p>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.75rem'}}>
              <button 
                onClick={goToSurveys}
                style={{
                  background: 'linear-gradient(to right, #ffffff, #fff5e6)',
                  color: '#ff2802',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.6rem 1rem',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  flex: 1
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
              >
                <span style={{fontSize: '1rem'}}>🚀</span> Start Surveys
              </button>
              
              <button 
                onClick={goToWelcome}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.9), rgba(255, 180, 0, 0.85))',
                  color: '#8B4500',
                  border: '1px solid rgba(255, 255, 255, 0.5)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.6rem 1rem',
                  fontSize: '0.9rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(255, 180, 0, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  flex: 1
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ffd700, #ffb400)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 180, 0, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.9), rgba(255, 180, 0, 0.85))';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 180, 0, 0.25)';
                }}
              >
                <span style={{fontSize: '1rem'}}>🎁</span> Get Bonus
              </button>
            </div>
          </div>
          
          {/* COMPACT BALANCE SECTION */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.08))',
            backdropFilter: 'blur(10px)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.75rem 1rem',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            minWidth: '100px',
            textAlign: 'center',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.18)'
          }}>
            <div style={{
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: '0.7rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '0.3rem'
            }}>
              Balance
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'center',
              gap: '0.2rem'
            }}>
              <span style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.8rem',
                fontWeight: '700',
              }}>
                KES
              </span>
              <div style={{
                color: '#ffef00',
                fontSize: '1.3rem',
                fontWeight: '900',
                lineHeight: '1',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
              }}>
                {stats.availableBalance.toLocaleString()}
              </div>
            </div>
            
            <button 
              onClick={() => navigate("/withdraw-form")}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.3rem 0.6rem',
                fontSize: '0.7rem',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '0.5rem',
                width: '100%',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.2rem'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <span style={{fontSize: '0.8rem'}}>💸</span> Withdraw
            </button>
          </div>
        </div>
      </div>
      
      {/* LIVE WITHDRAWAL FEED */}
      <LiveWithdrawalFeed />

      {/* REGULAR WELCOME BONUS CARD (Hidden when modal is shown) */}
      {!showWelcomeBonusModal && (
        <section ref={welcomeRef} className="dashboard-section">
          <div className="professional-bonus-card">
            <div className="bonus-card-header">
              <span className="bonus-icon">🎁</span>
              <div className="bonus-header-text">
                <h3>Welcome Bonus</h3>
                <p className="bonus-subtitle">Activate to claim</p>
              </div>
            </div>
            
            <div className="bonus-amount-display">
              <span className="currency">KES</span>
              <span className="amount">1,200</span>
            </div>
            
            <div className="bonus-description">
              <p>Activate your account with <strong>KES 100</strong> to unlock your welcome bonus</p>
            </div>

            <div className="bonus-actions">
              <button className="primary-btn full-width" onClick={handleWelcomeBonusWithdraw}>
                <span className="btn-icon">🔓</span>
                Activate & Claim Bonus
              </button>
              <button className="secondary-btn full-width" onClick={() => navigate("/faq#welcome-bonus")}>
                Learn More
              </button>
            </div>

            <div className="bonus-details-collapsible">
              <details className="bonus-details">
                <summary>View Bonus Details</summary>
                <div className="details-content">
                  <div className="detail-item">
                    <span className="detail-icon">✅</span>
                    <span>Instant activation upon payment</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">🔒</span>
                    <span>Secure payment processing</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">👥</span>
                    <span>15,000+ satisfied users</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">⏱️</span>
                    <span>Limited time offer</span>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </section>
      )}

      {/* COMPACT FLOATING WHATSAPP SUPPORT BUTTON WITH BLINKING CAPTION */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '5px'
      }}>
        {showCaption && (
          <div style={{
            background: 'rgba(37, 211, 102, 0.9)',
            color: 'white',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            whiteSpace: 'nowrap',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            animation: 'fadeIn 0.5s ease'
          }}>
            Need help? Chat us
          </div>
        )}
        
        <button
          onClick={openWhatsAppSupport}
          style={{
            background: '#25D366',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            fontSize: '26px',
            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            padding: '0',
            margin: '0'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 211, 102, 0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.4)';
          }}
          title="Contact Support on WhatsApp"
        >
          💬
        </button>
      </div>

      {/* DASHBOARD NAVIGATION - MOBILE OPTIMIZED */}
      <section className="dashboard-section">
        <div className="section-heading">
          <h3>Dashboard Navigation</h3>
          <p>Switch between different sections</p>
        </div>
        <div className="dashboard-nav-mobile">
          <button 
            className={`nav-btn ${activeTab === "OVERVIEW" ? "active" : ""}`}
            onClick={() => setActiveTab("OVERVIEW")}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-label">Overview</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === "TESTIMONIALS" ? "active" : ""}`}
            onClick={() => setActiveTab("TESTIMONIALS")}
          >
            <span className="nav-icon">🌟</span>
            <span className="nav-label">Testimonials</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === "SURVEYS" ? "active" : ""}`}
            onClick={goToSurveys}
          >
            <span className="nav-icon">📝</span>
            <span className="nav-label">Surveys</span>
          </button>
          <button 
            className={`nav-btn ${activeTab === "WITHDRAW" ? "active" : ""}`}
            onClick={() => navigate("/withdraw-form")}
          >
            <span className="nav-icon">💸</span>
            <span className="nav-label">Withdraw</span>
          </button>
        </div>
      </section>

      {/* OVERVIEW TAB */}
      {activeTab === "OVERVIEW" && (
        <>
          {/* EARNINGS DASHBOARD */}
          <section className="dashboard-section">
            <div className="section-heading">
              <h3>Your Earnings Dashboard</h3>
              <p>Track your progress and earnings across all plans</p>
            </div>
            <div className="stats-grid">
              <div className="stats-card total-earnings">
                <div className="stats-card-header">
                  <span className="stats-icon">💰</span>
                  <h4>Total Earnings</h4>
                </div>
                <div className="stats-card-body">
                  <span className="stats-value">KES {stats.totalEarned.toLocaleString()}</span>
                  <span className="stats-label">Lifetime earnings</span>
                </div>
              </div>

              <div className="stats-card available-balance">
                <div className="stats-card-header">
                  <span className="stats-icon">💳</span>
                  <h4>Available Balance</h4>
                </div>
                <div className="stats-card-body">
                  <span className="stats-value">KES {stats.availableBalance.toLocaleString()}</span>
                  <span className="stats-label">Ready to withdraw</span>
                </div>
                <button className="withdraw-quick-btn" onClick={() => navigate("/withdraw-form")}>
                  Withdraw Now
                </button>
              </div>

              <div className="stats-card surveys-completed">
                <div className="stats-card-header">
                  <span className="stats-icon">📊</span>
                  <h4>Surveys Completed</h4>
                </div>
                <div className="stats-card-body">
                  <span className="stats-value">{stats.totalSurveysCompleted}</span>
                  <span className="stats-label">Total surveys</span>
                </div>
              </div>

              <div className="stats-card success-rate">
                <div className="stats-card-header">
                  <span className="stats-icon">📈</span>
                  <h4>Success Rate</h4>
                </div>
                <div className="stats-card-body">
                  <span className="stats-value">98%</span>
                  <span className="stats-label">Survey completion</span>
                </div>
              </div>
            </div>
          </section>

          {/* PLAN PROGRESS */}
          <section className="dashboard-section">
            <div className="section-heading">
              <h3>Plan Progress</h3>
              <p>Track your earnings across different plans</p>
            </div>
            <div className="progress-cards">
              {Object.entries(PLANS).map(([key, plan]) => {
                const status = getPlanStatus(key);
                const activated = isActivated(key);
                const hasPending = !!pendingWithdrawals[key];
                
                return (
                  <div key={key} className="progress-card" style={{
                    borderColor: plan.borderColor,
                    background: plan.bgColor,
                  }}>
                    <div className="progress-card-header">
                      <span className="plan-icon">{plan.icon}</span>
                      <h4>{plan.name}</h4>
                      <span className={`status-badge ${status.status}`}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                    <div className="progress-card-body">
                      <div className="progress-info">
                        <div className="progress-row">
                          <span>Per Survey:</span>
                          <strong>KES {plan.perSurvey}</strong>
                        </div>
                        <div className="progress-row">
                          <span>Surveys:</span>
                          <strong>{surveysDone(key)}/{TOTAL_SURVEYS}</strong>
                        </div>
                        <div className="progress-row">
                          <span>Earned:</span>
                          <strong className="earned-amount">KES {earnedSoFar(key).toLocaleString()}</strong>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-bar-fill"
                          style={{ 
                            width: `${progressPercentage(key)}%`,
                            background: plan.gradient
                          }}
                        ></div>
                      </div>
                      {hasPending && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px',
                          background: 'rgba(251, 191, 36, 0.1)',
                          border: '1px solid rgba(251, 191, 36, 0.3)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#f59e0b',
                          fontWeight: '600',
                          textAlign: 'center'
                        }}>
                          ⏳ Withdrawal Pending - Click to Manage
                        </div>
                      )}
                      <div className="progress-card-actions">
                        <button 
                          className="action-btn primary"
                          onClick={() => startSurvey(key)}
                          disabled={isCompleted(key)}
                          style={{
                            background: isCompleted(key) ? '#ccc' : plan.gradient,
                            color: isCompleted(key) ? '#666' : 'white'
                          }}
                        >
                          {isCompleted(key) ? 'Completed' : 'Start Survey'}
                        </button>
                        {isCompleted(key) && (
                          <button 
                            className="action-btn secondary"
                            onClick={() => handleWithdrawClick(key)}
                            style={{
                              borderColor: plan.color,
                              color: plan.color,
                              background: !activated ? 'rgba(245, 158, 11, 0.1)' : 
                                          hasPending ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                              cursor: 'pointer'
                            }}
                          >
                            {!activated ? '🔓 Activate & Withdraw' : 
                             hasPending ? '📤 Manage Withdrawal' : 'Withdraw'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* WHY USERS LOVE OUR PLATFORM */}
          <section className="dashboard-section">
            <div className="section-heading">
              <h3>Why Users Love Our Platform</h3>
              <p>Discover what makes us the best choice for earning online</p>
            </div>
            <div className="feature-grid">
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h4>Instant Withdrawals</h4>
                <p>Request cash anytime and get paid within minutes. No waiting periods.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">✅</div>
                <h4>Verified Surveys</h4>
                <p>Only high-quality surveys that pay on time. No spam, no scams.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h4>Secure Payments</h4>
                <p>Bank-level security for all transactions. Your earnings are safe with us.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💬</div>
                <h4>24/7 Support</h4>
                <p>Our team is always here to help you earn more. Quick response guaranteed.</p>
              </div>
            </div>
          </section>

          {/* QUICK ACTIONS */}
          <section className="dashboard-section">
            <div className="section-heading">
              <h3>Quick Actions</h3>
              <p>Complete these tasks to earn bonus points</p>
            </div>
            <div className="quick-actions-grid">
              {quickActions.map(action => (
                <div key={action.id} className={`quick-action-card ${action.completed ? 'completed' : ''}`}>
                  <span className="action-icon">{action.icon}</span>
                  <div className="action-content">
                    <h4>{action.label}</h4>
                    <p>{action.completed ? 'Completed! +10 points' : 'Earn 10 bonus points'}</p>
                  </div>
                  <button 
                    className={`action-btn ${action.completed ? 'completed' : ''}`}
                    onClick={() => !action.completed && completeQuickAction(action.id)}
                    disabled={action.completed}
                  >
                    {action.completed ? '✓' : 'Start'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* TESTIMONIALS TAB */}
      {activeTab === "TESTIMONIALS" && (
        <section className="dashboard-section">
          <div className="section-heading">
            <h3>Real User Testimonials</h3>
            <p>See what others are saying about their earnings experience</p>
          </div>
          <Testimonials variant="grid" />
          <div className="testimonial-cta">
            <p>Ready to join thousands of happy earners?</p>
            <button className="primary-btn" onClick={goToSurveys}>
              Start Earning Today →
            </button>
          </div>
        </section>
      )}

      {/* SURVEYS TAB */}
      {activeTab === "SURVEYS" && (
        <section ref={surveyRef} id="surveys-section" className="tab-section">
          <div className="section-heading">
            <h3>Available Survey Plans</h3>
            <p>Choose a plan that matches your earning goals</p>
          </div>
          
          <div className="plan-cards-container">
            {Object.entries(PLANS).map(([key, plan]) => {
              const status = getPlanStatus(key);
              const activated = isActivated(key);
              const hasPending = !!pendingWithdrawals[key];
              
              return (
                <div key={key} className={`plan-card ${key.toLowerCase()}`} style={{
                  borderColor: plan.borderColor,
                  background: `linear-gradient(135deg, ${plan.bgColor}, rgba(255, 255, 255, 0.05))`,
                  boxShadow: `0 10px 30px ${plan.color}20`
                }}>
                  <div className="plan-card-header">
                    <div className="plan-badge">
                      <span className="plan-icon">{plan.icon}</span>
                      <span className="plan-name" style={{ color: plan.color }}>{plan.name}</span>
                    </div>
                    <span className={`plan-status ${status.status}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  
                  <div className="plan-card-body">
                    <div className="plan-description">
                      <p>{plan.description}</p>
                    </div>
                    
                    <div className="plan-stats">
                      <div className="stat-row">
                        <span className="stat-label">Per Survey</span>
                        <span className="stat-value">KES {plan.perSurvey}</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Total Plan</span>
                        <span className="stat-value">KES {plan.total}</span>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Progress</span>
                        <div className="progress-container">
                          <div className="progress-bar">
                            <div 
                              className="progress-bar-fill"
                              style={{ 
                                width: `${progressPercentage(key)}%`,
                                background: plan.gradient
                              }}
                            ></div>
                          </div>
                          <span className="progress-text">
                            {surveysDone(key)}/{TOTAL_SURVEYS}
                          </span>
                        </div>
                      </div>
                      <div className="stat-row">
                        <span className="stat-label">Earned So Far</span>
                        <span className="stat-value earned">KES {earnedSoFar(key).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {hasPending && (
                      <div style={{
                        marginTop: '12px',
                        padding: '10px',
                        background: 'rgba(251, 191, 36, 0.15)',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                        borderRadius: '10px',
                        fontSize: '13px',
                        color: '#f59e0b',
                        fontWeight: '700',
                        textAlign: 'center'
                      }}>
                        ⏳ Withdrawal Pending - Click "Manage Withdrawal"
                      </div>
                    )}
                    
                    <div className="plan-features">
                      <span className="feature-tag">📱 Mobile-Friendly</span>
                      <span className="feature-tag">⏱️ 5-10 Minutes</span>
                      <span className="feature-tag">💯 Guaranteed Payment</span>
                    </div>
                  </div>
                  
                  <div className="plan-card-footer">
                    {!isCompleted(key) ? (
                      <button 
                        className="start-survey-btn"
                        onClick={() => startSurvey(key)}
                        style={{
                          background: plan.gradient,
                          boxShadow: `0 5px 20px ${plan.color}40`
                        }}
                      >
                        <span className="btn-icon">🚀</span>
                        Start Survey
                        <span className="btn-arrow">→</span>
                      </button>
                    ) : (
                      <div className="completed-actions">
                        <span className="completed-badge">✅ All Surveys Completed</span>
                        <button 
                          className="withdraw-plan-btn"
                          onClick={() => handleWithdrawClick(key)}
                          style={{
                            background: !activated ? 
                              'linear-gradient(135deg, #f59e0b, #d97706)' :
                              hasPending ?
                              'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                              plan.gradient,
                            boxShadow: `0 5px 20px ${plan.color}40`
                          }}
                        >
                          {!activated ? '🔓 Activate & Withdraw' : 
                           hasPending ? '📤 Manage Withdrawal' :
                           '💸 Withdraw KES'} {!hasPending && plan.total}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="dashboard-footer">
        <p>Need help? 
          <button 
            onClick={openWhatsAppSupport}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              padding: '0',
              margin: '0 5px'
            }}
          >
            Contact Support
          </button> 
          | <a href="/faq">FAQ</a>
        </p>
        <p className="footer-note">© {new Date().getFullYear()} SurveyEarn. All rights reserved.</p>
      </footer>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}