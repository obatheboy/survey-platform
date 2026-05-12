// ========================= Dashboard.jsx =========================
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import MainMenuDrawer from "./components/MainMenuDrawer.jsx";
import LiveWithdrawalFeed from "./components/LiveWithdrawalFeed.jsx";
import UserNotifications from "../components/UserNotifications.jsx";
import Testimonials from "../components/Testimonials.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import Achievements from "./components/Achievements.jsx";
import DailyRewardPopup from "./components/DailyRewardPopup.jsx";
import WelcomeBonusPopup from "./components/WelcomeBonusPopup.jsx";
import { gamificationApi } from "../api/api";
import "./Dashboard.css";
import "./components/MainMenuDrawer.css";

const PLANS = {
  REGULAR: { 
    name: "REGULAR SURVEYS", 
    icon: "⭐", 
    total: 1500, 
    perSurvey: 150,
    color: "#1f7405",
    gradient: "linear-gradient(135deg, #1f7405, #2d9a07)",
    borderColor: "rgba(0, 0, 0, 0.1)",
    bgColor: "#ffffff",
    titleColor: "#1f7405",
    description: "Perfect for beginners",
    totalColor: "#1f7405",
    totalGlow: "none"
  },
  VIP: { 
    name: "VIP SURVEY", 
    icon: "💎", 
    total: 2000, 
    perSurvey: 200,
    color: "#0080ff",
    gradient: "linear-gradient(135deg, #0066cc, #0080ff)",
    borderColor: "rgba(0, 0, 0, 0.1)",
    bgColor: "#ffffff",
    titleColor: "#0080ff",
    description: "For active earners",
    totalColor: "#0080ff",
    totalGlow: "none"
  },
  VVIP: { 
    name: "VVIP SURVEYS", 
    icon: "👑", 
    total: 3000, 
    perSurvey: 300,
    color: "#FF6600",
    gradient: "linear-gradient(135deg, #cc5200, #FF6600)",
    borderColor: "rgba(0, 0, 0, 0.1)",
    bgColor: "#ffffff",
    titleColor: "#FF6600",
    description: "Maximum earnings",
    totalColor: "#FF6600",
    totalGlow: "none"
  },
};
const TOTAL_SURVEYS = 10;

// Theme removed - light mode only

export default function Dashboard() {
  const navigate = useNavigate();

  const welcomeRef = useRef(null);

  /* =========================
     UI STATE
  ========================= */
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  // Theme removed - light mode only
  const [menuOpen, setMenuOpen] = useState(false);
  const surveysSectionRef = useRef(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarned: 0,
    availableBalance: 0,
    affiliateEarnings: 0,
    totalSurveysCompleted: 0,
    totalWithdrawals: 0
  });

  /* =========================
     WHATSAPP CAPTION BLINKING EFFECT - FASTER
  ========================= */
  const [_showCaption, setShowCaption] = useState(true);
  const [showScrollReminder, setShowScrollReminder] = useState(false);
  const [reminderShown, setReminderShown] = useState(false);

  /* =========================
     DATA STATE
  ========================= */
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState({});
  const [activationRequests, setActivationRequests] = useState([]);
  const [quickActions, setQuickActions] = useState([
    { id: 1, label: "Complete Profile", icon: "👤", completed: false },
    { id: 2, label: "Verify Email", icon: "📧", completed: false },
    { id: 3, label: "Invite Friends", icon: "👥", completed: false },
    { id: 4, label: "Activate & Pay", icon: "🔓", completed: false, action: "activate" },
  ]);

  /* =========================
     WITHDRAW STATE - SIMPLIFIED
  ========================= */
  const [pendingWithdrawals, setPendingWithdrawals] = useState({});
  const [fullScreenNotification, setFullScreenNotification] = useState(null);

   /* =========================
      GAMIFICATION STATE
    ========================= */
   const [showDailyReward, setShowDailyReward] = useState(false);
   const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);
   const [welcomeBonusAmount, setWelcomeBonusAmount] = useState(1200);
   const [gamificationStats, setGamificationStats] = useState({
     level: 1,
     xp: 0,
     xpToNextLevel: 100,
     currentStreak: 0,
     longestStreak: 0
   });

  /* =========================
     LOAD DASHBOARD
  ========================= */
  useEffect(() => {
    let alive = true;

  // Version check removed - handled globally in App.jsx via cache utility
  // This prevents duplicate reload loops

    const load = async () => {
      try {
        const resUser = await api.get(`/auth/me?_t=${Date.now()}`);
        if (!alive) return;

        setUser(resUser.data);
        setPlans(resUser.data.plans || {});
        setActivationRequests(resUser.data.activation_requests || []);
        
        let surveyEarnings = 0;
        let calculatedTotalSurveys = 0;

        Object.keys(PLANS).forEach(planKey => {
          const backendPlan = resUser.data.plans?.[planKey] || { surveys_completed: 0 };
          let count = backendPlan.surveys_completed || 0;
          
          if (backendPlan.is_activated) {
            count = TOTAL_SURVEYS;
          }
          
          count = Math.min(count, TOTAL_SURVEYS);
          
          calculatedTotalSurveys += count;
          surveyEarnings += count * PLANS[planKey].perSurvey;
        });
        
        let availableBalance = Number(resUser.data.total_earned || 0);
        const totalWithdrawals = Number(resUser.data.total_withdrawals || 0);
        
        const expectedBalance = surveyEarnings - totalWithdrawals;
        if (expectedBalance > availableBalance) {
            availableBalance = expectedBalance;
        }
        
        setStats({
          totalEarned: availableBalance + totalWithdrawals,
          availableBalance: availableBalance,
          affiliateEarnings: resUser.data.referral_commission_earned || 0,
          totalSurveysCompleted: calculatedTotalSurveys,
          totalWithdrawals: totalWithdrawals
        });

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
    const interval = setInterval(load, 5000);
    window.addEventListener("focus", load);

    return () => {
      alive = false;
      clearInterval(interval);
      window.removeEventListener("focus", load);
    };
  }, []);

  /* =========================
     THEME EFFECT
  ========================= */
  // Theme removed - light mode only

  // Theme removed - light mode only

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

   /* =========================
      GAMIFICATION - CHECK WELCOME BONUS
    ========================= */
   useEffect(() => {
     if (!user) return;

     const bonusAmount = user.welcome_bonus;
     const showOnLogin = localStorage.getItem("showWelcomeBonusOnDashboard");
     const onboardingCompleted = user.survey_onboarding_completed;

     if (bonusAmount && showOnLogin && onboardingCompleted) {
       setWelcomeBonusAmount(bonusAmount);

       const showAfterDelay = setTimeout(() => {
         setShowWelcomeBonus(true);
         localStorage.removeItem("showWelcomeBonusOnDashboard");
       }, 2500);

       return () => clearTimeout(showAfterDelay);
     }
   }, [user]);

  const handleWelcomeBonusClose = () => {
    setShowWelcomeBonus(false);
    
     setTimeout(() => {
       const checkAndShowDailyReward = async () => {
         try {
           const response = await gamificationApi.checkDailyReward();
           if (response.data.can_claim) {
             // Daily reward popup disabled
             // setShowDailyReward(true);
           }
         } catch (error) {
           console.error('Error checking daily reward:', error);
         }
       };
       checkAndShowDailyReward();
     }, 1500);
   };

  /* =========================
     GAMIFICATION - CHECK DAILY REWARD
   ========================= */
  useEffect(() => {
    const checkDailyReward = async () => {
      if (showWelcomeBonus) return;
      
       try {
         const response = await gamificationApi.checkDailyReward();
         if (response.data.can_claim) {
           // Daily reward popup disabled
           // setTimeout(() => setShowDailyReward(true), 2000);
         }
         setGamificationStats({
          level: response.data.level || 1,
          xp: response.data.xp || 0,
          xpToNextLevel: response.data.xp_to_next_level || 100,
          currentStreak: response.data.current_streak || 0,
          longestStreak: response.data.longest_streak || 0
        });
      } catch (error) {
        console.error('Error checking daily reward:', error);
      }
    };
    
    if (user) {
      checkDailyReward();
    }
  }, [user, showWelcomeBonus]);

  const handleDailyRewardClaimed = (result) => {
    setGamificationStats(prev => ({
      ...prev,
      level: result.level,
      xp: result.xp,
      xpToNextLevel: result.xp_to_next_level
    }));
    if (user) {
      api.get(`/auth/me?_t=${Date.now()}`).then(res => {
        setUser(res.data);
      });
    }
  };

  /* =========================
     HELPERS
  ========================= */
  const surveysDone = (plan) => {
    if (plans[plan]?.is_activated) {
      return TOTAL_SURVEYS;
    }
    return plans[plan]?.surveys_completed || 0;
  };
  const isCompleted = (plan) => surveysDone(plan) >= TOTAL_SURVEYS;
  const isActivated = (plan) => plans[plan]?.is_activated === true;
  const earnedSoFar = (plan) => {
    const count = surveysDone(plan);
    if (count >= TOTAL_SURVEYS) {
      return PLANS[plan].total;
    }
    return count * PLANS[plan].perSurvey;
  };
  const progressPercentage = (plan) => (surveysDone(plan) / TOTAL_SURVEYS) * 100;

  const hasPendingActivation = (plan) => {
    return activationRequests.some(
      req => req.plan === plan && req.status === 'SUBMITTED'
    );
  };

  const getPlanStatus = (plan) => {
    if (isActivated(plan)) return { status: "completed", label: "Ready to Withdraw", icon: "✅" };
    if (hasPendingActivation(plan)) return { status: "pending-approval", label: "Pending Approval", icon: "⏳" };
    if (isCompleted(plan)) return { status: "completed", label: "Ready to Activate", icon: "✅" };
    if (surveysDone(plan) > 0) return { status: "in-progress", label: "In Progress", icon: "⏳" };
    return { status: "not-started", label: "Start Earning", icon: "🚀" };
  };

/* =========================
     TAB + SCROLL
   ========================= */
  const goToSurveys = () => {
    setActiveTab("SURVEYS");
  };
  
  // Scroll when tab changes to SURVEYS
  useEffect(() => {
    if (activeTab === "SURVEYS") {
      setTimeout(() => {
        const element = document.getElementById('surveys-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (surveysSectionRef.current) {
          surveysSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [activeTab]);

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
     WELCOME BONUS
  ========================= */
  const handleWelcomeBonusWithdraw = () => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    setFullScreenNotification({
      message: "🎁 Activate your account with KES 100 to unlock your KES 1,200 welcome bonus! Pay directly on this page.",
      redirect: "/activate?welcome_bonus=true",
    });
  };

  /* =========================
     QUICK ACTIONS
  ========================= */
  const completeQuickAction = (id) => {
    const action = quickActions.find(a => a.id === id);
    setQuickActions(prev =>
      prev.map(a =>
        a.id === id ? { ...a, completed: true } : a
      )
    );

    if (action?.action === "activate") {
      navigate("/activate");
      return;
    }

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
  
  // Theme toggle removed - light mode only

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
         <button className="btn-primary" onClick={() => navigate("/login")}>
           Go to Login
         </button>
       </div>
     );
   }

   return (
     <div className="dashboard-container" style={{ paddingBottom: '100px' }}>
       {/* TOAST NOTIFICATION */}
       {toast && <div className="toast-notification">{toast}</div>}

      {/* FULL SCREEN NOTIFICATION - FIXED CENTER */}
      {fullScreenNotification && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(10px)',
          overflow: 'hidden',
          margin: 0,
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            padding: '30px 25px',
            maxWidth: '420px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            position: 'relative'
          }}>
            <div style={{
              fontSize: '50px',
              marginBottom: '15px',
              animation: 'pulse 2s infinite'
            }}>
              🎁
            </div>
            
            <h3 style={{
              color: 'white',
              margin: '0 0 10px 0',
              fontSize: '22px',
              fontWeight: '700'
            }}>
              Welcome Bonus!
            </h3>
            
            <p style={{
              color: 'rgba(255, 255, 255, 0.95)',
              fontSize: '16px',
              lineHeight: '1.4',
              marginBottom: '25px',
              padding: '0 10px'
            }}>
              {fullScreenNotification.message}
            </p>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%'
            }}>
              {fullScreenNotification.redirect && (
                <button
                  onClick={() => {
                    document.body.style.overflow = '';
                    document.body.style.position = '';
                    document.body.style.width = '';
                    document.body.style.height = '';
                    
                    setFullScreenNotification(null);
                    navigate(fullScreenNotification.redirect);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    fontSize: '17px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    width: '100%',
                    boxShadow: '0 8px 25px rgba(220, 38, 38, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(220, 38, 38, 0.6)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.4)';
                  }}
                >
                  <span style={{ fontSize: '20px' }}>🔓</span>
                  Activate Account Now
                </button>
              )}
              
              <button
                onClick={() => {
                  document.body.style.overflow = '';
                  document.body.style.position = '';
                  document.body.style.width = '';
                  document.body.style.height = '';
                  
                  setFullScreenNotification(null);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '14px 20px',
                  fontSize: '15px',
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
              marginTop: '20px',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', justifyContent: 'center' }}>
                <span>✅</span>
                <span>Instant activation upon payment</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
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
          <button className="menu-btn" onClick={() => setMenuOpen(true)}>
            <span className="menu-icon">☰</span>
          </button>
          <h1 className="dashboard-main-title">Dashboard</h1>
          <div className="header-actions">
            <button
              onClick={openWhatsAppSupport}
              className="whatsapp-btn"
              title="Contact Support on WhatsApp"
            >
              <span className="whatsapp-icon">💬</span>
              <span className="whatsapp-text">CHAT US</span>
            </button>
          </div>
        </div>

        <div className="header-activation-container">
          {user && (
            activationRequests.some(req => req.status === 'SUBMITTED') ? (
              <button
                disabled
                className="activate-btn activate-btn-pulse activate-btn-pending"
              >
                <span className="btn-icon">⏳</span>
                PENDING APPROVAL
                <span>⏰</span>
              </button>
            ) : user.is_activated ? (
              <button
                disabled
                className="activate-btn activate-btn-pulse activate-btn-activated"
              >
                <span className="btn-icon">✅</span>
                ACTIVATED
                <span>🎉</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/activate?welcome_bonus=true')}
                className="activate-btn activate-btn-pulse activate-btn-inactive"
              >
                <span className="btn-icon">🔓</span>
                TAP HERE TO ACTIVATE ACCOUNT
                <span>✨</span>
              </button>
            )
          )}
        </div>
        <p className="header-greeting-bottom">
          Hello, {user?.full_name?.split(' ')[0] || 'Earner'}! 👋 Let's make money today!
        </p>
      </header>

      {/* MAIN MENU DRAWER */}
      <MainMenuDrawer 
        open={menuOpen} 
        onClose={() => setMenuOpen(false)} 
        user={user}
        goToSurveys={goToSurveys}
        onNavigate={(path) => {
          setMenuOpen(false);
          if (path) navigate(path);
        }}
      />

      {/* LIVE WITHDRAWAL FEED - MOVED TO TOP */}
      <section className="dashboard-section" style={{ paddingTop: '0', paddingBottom: '0', marginTop: '50px' }}>
        <LiveWithdrawalFeed />
      </section>

      {/* HERO SECTION - ULTRA COMPACT */}
      <div className="hero-section">
        <div className="hero-section-content">
          <div className="hero-buttons">
            <button
              onClick={goToSurveys}
              className="hero-btn hero-btn-primary"
            >
              <span>🚀</span> Start Survey
            </button>

            <button
              onClick={goToWelcome}
              className="hero-btn hero-btn-secondary"
            >
              <span>🎁</span> Get Bonus
            </button>
          </div>

          <div className="hero-balance-card">
            <div className="hero-balance-label">Total Balance</div>
            <div className="hero-balance-value">
              <span className="hero-balance-currency">KES</span>
              {stats.availableBalance.toLocaleString()}
            </div>
            <button
              onClick={() => navigate("/withdraw-form")}
              className="hero-withdraw-btn"
            >
              WITHDRAW NOW
            </button>
          </div>
        </div>
      </div>
      
      {/* WELCOME BONUS CARD */}
      <section ref={welcomeRef} className="welcome-bonus-section">
        <div className="welcome-bonus-card">
          <div className="welcome-bonus-header">
            <div className="welcome-bonus-title">
              <span>🎁</span>
              <span>Welcome Bonus</span>
            </div>
            <span className="welcome-bonus-badge">New</span>
          </div>

          <div className="welcome-bonus-content">
            <div className="welcome-bonus-message">
              Congratulations! You've received a welcome bonus of
              <span className="welcome-bonus-amount">KES 1,200</span>
              <span className="welcome-bonus-hint">
                Activate your account to withdraw instantly!
              </span>
            </div>
          </div>

          <div className="welcome-bonus-action">
            <button
              className="welcome-bonus-btn"
              onClick={handleWelcomeBonusWithdraw}
            >
              <span>🔓</span>
              TAP HERE TO WITHDRAW
            </button>
          </div>
        </div>
      </section>
      {/* SURVEY PLANS */}
      <section className="dashboard-section" id="surveys-section">
        <div className="section-heading">
          <h3>Survey Plan Available Today</h3>
          <p>Track your earnings across different plans</p>
        </div>
        <div className="progress-cards">
          {Object.entries(PLANS).map(([key, plan]) => {
            const status = getPlanStatus(key);
            const hasPending = !!pendingWithdrawals[key];

            return (
              <div key={key} className="progress-card">
                <div className="progress-card-header">
                  <span className="plan-icon">{plan.icon}</span>
                  <h4 className="progress-card-title" style={{ color: plan.titleColor }}>{plan.name}</h4>
                  <span className={`status-badge status-badge-${status.status}`}>
                    {status.icon} {status.label}
                  </span>
                </div>
                <div className="progress-card-body">
                  <div className="progress-info">
                    <div className="progress-row">
                      <span className="progress-row-label">Total to earn:</span>
                      <strong className="progress-row-value" style={{ color: plan.titleColor }}>KES {plan.total}</strong>
                    </div>
                    <div className="progress-row">
                      <span className="progress-row-label">Per Survey:</span>
                      <strong className="progress-row-value">KES {plan.perSurvey}</strong>
                    </div>
                    <div className="progress-row">
                      <span className="progress-row-label">Progress:</span>
                      <strong className="progress-row-value">{surveysDone(key)}/{TOTAL_SURVEYS}</strong>
                    </div>
                    <div className="progress-row">
                      <span className="progress-row-label">Earned so far:</span>
                      <strong className="earned-amount" style={{ color: plan.titleColor }}>
                        KES {earnedSoFar(key).toLocaleString()}
                      </strong>
                    </div>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${progressPercentage(key)}%`,
                        background: plan.titleColor,
                      }}
                    ></div>
                  </div>

                  {hasPending && (
                    <div className="pending-notice">
                      ⏳ Withdrawal Pending - Click to Manage
                    </div>
                  )}

                  <div className="progress-card-actions">
                    <button
                      className="action-btn action-btn-primary"
                      onClick={() => startSurvey(key)}
                      disabled={isCompleted(key) || isActivated(key)}
                    >
                      {isActivated(key) ? '✓ Completed' : isCompleted(key) ? '✓ Completed' : '🚀 Start Survey'}
                    </button>

                    {isCompleted(key) && !isActivated(key) && (
                      <button
                        className="action-btn action-btn-secondary"
                        onClick={() => {
                          navigate(`/activate?plan=${key.toLowerCase()}`);
                        }}
                      >
                        🔓 Activate
                      </button>
                    )}

                    {isActivated(key) && (
                      <button
                        className="action-btn action-btn-withdraw"
                        onClick={() => {
                          navigate(`/withdraw-form?type=${key.toLowerCase()}`, { state: { plan: key } });
                        }}
                      >
                        💰 Withdraw
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* EARNINGS DASHBOARD */}
      <section className="dashboard-section">
        <div className="section-heading">
          <h3>Your Earnings Dashboard</h3>
          <p>Track your progress and earnings across all plans</p>
        </div>
        <div className="stats-grid">
          <div className="stats-card stats-card-earnings">
            <div className="stats-card-header">
              <span className="stats-icon">💰</span>
              <h4 className="stats-card-title">Total Earnings</h4>
            </div>
            <div className="stats-card-body">
              <span className="stats-value">KES {stats.totalEarned.toLocaleString()}</span>
              <span className="stats-label">Lifetime earnings</span>
            </div>
          </div>

          <div className="stats-card stats-card-available">
            <div className="stats-card-header">
              <span className="stats-icon">💳</span>
              <h4 className="stats-card-title">Available</h4>
            </div>
            <div className="stats-card-body">
              <span className="stats-value">KES {stats.availableBalance.toLocaleString()}</span>
              <span className="stats-label">Ready to withdraw</span>
            </div>
          </div>

          <div className="stats-card stats-card-affiliate">
            <div className="stats-card-header">
              <span className="stats-icon">🎁</span>
              <h4 className="stats-card-title">Affiliate</h4>
            </div>
            <div className="stats-card-body">
              <span className="stats-value">KES {(stats.affiliateEarnings || 0).toLocaleString()}</span>
              <span className="stats-label">From referrals</span>
            </div>
          </div>

          <div className="stats-card stats-card-surveys">
            <div className="stats-card-header">
              <span className="stats-icon">📊</span>
              <h4 className="stats-card-title">Surveys</h4>
            </div>
            <div className="stats-card-body">
              <span className="stats-value">{stats.totalSurveysCompleted}</span>
              <span className="stats-label">Total surveys</span>
            </div>
          </div>
        </div>
      </section>

      {/* NOTIFICATIONS */}
      <section className="dashboard-section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div>
            <UserNotifications />
          </div>
        </div>
      </section>

      {/* WHY USERS LOVE OUR PLATFORM */}
      <section className="dashboard-section">
        <div className="section-heading">
          <h3>Why Users Love Our Platform</h3>
          <p>Discover what makes us the best choice for earning online</p>
        </div>
        <div className="feature-grid">
          <div className="feature-card" style={{ background: '#ed64a6' }}>
            <div className="feature-icon">⚡</div>
            <h4>Instant Withdrawals</h4>
            <p>Request cash anytime.</p>
          </div>
          <div className="feature-card" style={{ background: '#fbbf24' }}>
            <div className="feature-icon">✅</div>
            <h4>Verified Surveys</h4>
            <p>High-quality surveys.</p>
          </div>
          <div className="feature-card" style={{ background: '#4299e1' }}>
            <div className="feature-icon">🔒</div>
            <h4>Secure Payments</h4>
            <p>Encrypted transactions.</p>
          </div>
          <div className="feature-card" style={{ background: '#48bb78' }}>
            <div className="feature-icon">💬</div>
            <h4>24/7 Support</h4>
            <p>Always here to help.</p>
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
            <div
              key={action.id}
              className={`quick-action-card ${action.completed ? 'completed' : ''}`}
            >
              <span className="action-icon">{action.icon}</span>
              <div className="action-content">
                <h4>{action.label}</h4>
                <p>{action.completed ? 'Completed! +10 points' : 'Earn 10 bonus points'}</p>
              </div>
              <button
                className={`action-btn-small ${action.completed ? 'completed' : ''}`}
                onClick={() => !action.completed && completeQuickAction(action.id)}
                disabled={action.completed}
              >
                {action.completed ? '✓' : 'Start'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="dashboard-section">
        <div className="section-heading">
          <h3>Community Success</h3>
          <p>See what others are earning</p>
        </div>
        <Testimonials variant="grid" />
      </section>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="bottom-nav-bar">
        <div className="bottom-nav-items">
          <button
            className="bottom-nav-item active"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <span className="bottom-nav-icon">📊</span>
            <span className="bottom-nav-label">Home</span>
          </button>

          <button
            className="bottom-nav-item"
            onClick={goToSurveys}
          >
            <span className="bottom-nav-icon">📝</span>
            <span className="bottom-nav-label">Surveys</span>
          </button>

          <button
            className="bottom-nav-item"
            onClick={() => navigate('/affiliate')}
          >
            <span className="bottom-nav-icon">👥</span>
            <span className="bottom-nav-label">Affiliate</span>
          </button>

          <button
            className="bottom-nav-item"
            onClick={() => navigate('/withdraw-form')}
          >
            <span className="bottom-nav-icon">💸</span>
            <span className="bottom-nav-label">Withdraw</span>
          </button>
        </div>
      </nav>

      {/* GAMIFICATION SECTION */}
      <div className="gamification-section">
        <div className="gamification-grid">
          <div className="gamification-card">
            <div className="gamification-header">
              <div className="level-badge">⭐</div>
              <div className="level-info">
                <div className="level-number" style={{ color: '#fbbf24' }}>Level {gamificationStats.level}</div>
                <div className="xp-info">{gamificationStats.xp} / {gamificationStats.xpToNextLevel} XP</div>
              </div>
            </div>
            <div className="xp-bar">
              <div
                className="xp-bar-fill"
                style={{
                  width: `${(gamificationStats.xp / gamificationStats.xpToNextLevel) * 100}%`,
                }}
              ></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="streak-badge">
                🔥 {gamificationStats.currentStreak} day streak
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACHIEVEMENTS */}
      <div style={{ marginBottom: '30px' }}>
        <Achievements />
      </div>

      {/* FOOTER */}
      <footer className="dashboard-footer">
        <p className="footer-text">
          Need help?
          <button
            onClick={openWhatsAppSupport}
            className="footer-link"
          >
            Contact Support
          </button>
          {' | '}
          <a href="/faq" className="footer-link">FAQ</a>
        </p>
        <p className="footer-note">© {new Date().getFullYear()} SurveyEarn. All rights reserved.</p>
      </footer>

      {/* WELCOME BONUS POPUP */}
      <WelcomeBonusPopup
        isOpen={showWelcomeBonus}
        onClose={handleWelcomeBonusClose}
        bonusAmount={welcomeBonusAmount}
        onActivate={() => navigate('/activate?welcome_bonus=true')}
      />

      {/* DAILY REWARD POPUP */}
      <DailyRewardPopup
        isOpen={showDailyReward}
        onClose={() => setShowDailyReward(false)}
        onRewardClaimed={handleDailyRewardClaimed}
      />
    </div>
  );
}