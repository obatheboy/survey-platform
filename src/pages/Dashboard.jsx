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
import { gamificationApi } from "../api/api";
import "./Dashboard.css";

const PLANS = {
  REGULAR: { 
    name: "Regular", 
    icon: "⭐", 
    total: 1500, 
    perSurvey: 150,
    color: "#38bdf8",
    gradient: "linear-gradient(135deg, #38bdf8, #0ea5e9)",
    borderColor: "rgba(56, 189, 248, 0.2)",
    bgColor: "rgba(56, 189, 248, 0.05)",
    description: "Perfect for beginners",
    // 🔥 BRIGHT ORANGE with !important
    totalColor: "#FF4500 !important",  // Bright Orange Red
    totalGlow: "0 0 20px #FF4500, 0 0 40px #FF8C00"  // Double glow
  },
  VIP: { 
    name: "VIP", 
    icon: "💎", 
    total: 2000, 
    perSurvey: 200,
    color: "#818cf8",
    gradient: "linear-gradient(135deg, #818cf8, #6366f1)",
    borderColor: "rgba(129, 140, 248, 0.2)",
    bgColor: "rgba(129, 140, 248, 0.05)",
    description: "For active earners",
    // 🔥 BRIGHT ORANGE-YELLOW with !important
    totalColor: "#FFA500 !important",  // Bright Orange
    totalGlow: "0 0 20px #FFA500, 0 0 40px #FFD700"  // Double glow
  },
  VVIP: { 
    name: "VVIP", 
    icon: "👑", 
    total: 3000, 
    perSurvey: 300,
    color: "#fbbf24",
    gradient: "linear-gradient(135deg, #fbbf24, #f59e0b)",
    borderColor: "rgba(251, 191, 36, 0.2)",
    bgColor: "rgba(251, 191, 36, 0.05)",
    description: "Maximum earnings",
    // 🔥 BRIGHT GOLD with !important
    totalColor: "#FFD700 !important",  // Bright Gold
    totalGlow: "0 0 20px #FFD700, 0 0 40px #FFA500"  // Double glow
  },
};
const TOTAL_SURVEYS = 10;
const APP_VERSION = "1.2.5"; // Bump this version to force clients to refresh on deploy

const getInitialTheme = () => {
  // 1. Check for a saved theme in localStorage
  if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
    return localStorage.getItem('theme');
  }
  // 2. Check for user's OS preference
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  // 3. Default to light
  return 'light';
};

export default function Dashboard() {
  const navigate = useNavigate();

  const surveyRef = useRef(null);
  const welcomeRef = useRef(null);
  const dashboardRef = useRef(null);

  /* =========================
     UI STATE
  ========================= */
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [theme, setTheme] = useState(getInitialTheme);
  const [menuOpen, setMenuOpen] = useState(false);
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
     GAMIFICATION STATE
   ========================= */
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [canClaimDailyReward, setCanClaimDailyReward] = useState(false);
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

    // 🔄 FORCE UPDATE CHECK
    const savedVersion = localStorage.getItem("app_version");
    if (savedVersion !== APP_VERSION) {
      localStorage.setItem("app_version", APP_VERSION);
      if (savedVersion) {
        // If a previous version existed, reload to get new assets
        window.location.reload();
      }
    }

    const load = async () => {
      try {
        const resUser = await api.get(`/auth/me?_t=${Date.now()}`);
        if (!alive) return;

        setUser(resUser.data);
        setPlans(resUser.data.plans || {});
        
        // Calculate stats
        let surveyEarnings = 0;
        let calculatedTotalSurveys = 0;

        Object.keys(PLANS).forEach(planKey => {
          const backendPlan = resUser.data.plans?.[planKey] || { surveys_completed: 0 };
          let count = backendPlan.surveys_completed || 0;
          
          // Check backend status
          if (backendPlan.is_activated) {
            count = TOTAL_SURVEYS;
          }
          
          // Ensure count doesn't exceed total
          count = Math.min(count, TOTAL_SURVEYS);
          
          calculatedTotalSurveys += count;
          surveyEarnings += count * PLANS[planKey].perSurvey;
        });
        
        let availableBalance = Number(resUser.data.total_earned || 0);
        const totalWithdrawals = Number(resUser.data.total_withdrawals || 0);
        
        // Fallback: if backend balance seems stale (less than survey earnings)
        // We calculate expected balance = surveyEarnings - withdrawals
        // If expected > reported, use expected.
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
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Listen for system theme changes and update if no theme is saved
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only update if user hasn't made a manual selection
      if (!('theme' in localStorage)) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
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

  /* =========================
     GAMIFICATION - CHECK DAILY REWARD
   ========================= */
  useEffect(() => {
    const checkDailyReward = async () => {
      try {
        const response = await gamificationApi.checkDailyReward();
        if (response.data.can_claim) {
          setCanClaimDailyReward(true);
          // Show the daily reward popup automatically after a short delay
          setTimeout(() => setShowDailyReward(true), 2000);
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
  }, [user]);

  const handleDailyRewardClaimed = (result) => {
    setCanClaimDailyReward(false);
    setGamificationStats(prev => ({
      ...prev,
      level: result.level,
      xp: result.xp,
      xpToNextLevel: result.xp_to_next_level
    }));
    // Refresh user data to get updated balance
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
      
   // In the handleWithdrawClick function
navigate("/activation-notice", { 
  state: { 
    planKey: plan,           // ← Use planKey (ActivationNotice expects this)
    amount: PLANS[plan].total
  }
});
      return;
    }

    // Check for pending withdrawal
    if (pendingWithdrawals[plan]) {
      // Navigate to success page to manage existing withdrawal
      window.scrollTo(0, 0);
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
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    setFullScreenNotification({
      message: "🎁 Activate your account with KES 100 to unlock your KES 1,200 welcome bonus!",
      redirect: "/withdraw-form",
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
    const whatsappUrl = `https://wa.me/254102074596?text=${message}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
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
    {/* TOAST NOTIFICATION */}
    {toast && <Notifications message={toast} />}

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
                  // Restore body scrolling
                  document.body.style.overflow = '';
                  document.body.style.position = '';
                  document.body.style.width = '';
                  document.body.style.height = '';
                  
                  setFullScreenNotification(null);
                  navigate(fullScreenNotification.redirect);
                }}
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1e40af)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  fontSize: '17px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  width: '100%',
                  boxShadow: '0 8px 25px rgba(37, 99, 235, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(37, 99, 235, 0.6)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.4)';
                }}
              >
                <span style={{ fontSize: '20px' }}>🔓</span>
                Activate Account Now
              </button>
            )}
            
            <button
              onClick={() => {
                // Restore body scrolling
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={openWhatsAppSupport}
              style={{
                background: '#25D366',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)',
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              title="Contact Support on WhatsApp"
            >
              <span style={{ fontSize: '14px' }}>💬</span>
              <span>CHAT US</span>
            </button>
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title="Toggle Theme"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>

        <div className="header-activation-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {user && !user.is_activated && !user.account_activated && (
            <button
              onClick={() => navigate('/withdraw-form')}
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.65rem',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                whiteSpace: 'nowrap'
              }}
            >
              ⚠️ Activate Account
            </button>
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
        onNavigate={(path) => {
          setMenuOpen(false);
          navigate(path);
        }}
      />

      {/* HERO SECTION - ULTRA COMPACT */}
      <div className="dashboard-section hero-section" style={{
        borderRadius: '14px',
        padding: '10px',
        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
        boxShadow: '0 6px 20px -5px rgba(0, 0, 0, 0.1)',
        border: 'none',
        position: 'relative',
        overflow: 'hidden',
        marginTop: '30px',
        marginBottom: '2px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          alignItems: 'stretch'
        }}>
          {/* LEFT COLUMN: BUTTONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={goToSurveys}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  flex: 1
                }}
              >
                <span style={{fontSize: '18px'}}>🚀</span> Start Survey
              </button>
              
              <button 
                onClick={goToWelcome}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  flex: 1
                }}
              >
                <span style={{fontSize: '18px'}}>🎁</span> Get Bonus
              </button>
          </div>
          
          {/* RIGHT COLUMN: BALANCE */}
          <div style={{
            background: 'linear-gradient(145deg, #1e293b, #0f172a)',
            borderRadius: '16px',
            padding: '10px',
            textAlign: 'center',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
              transform: 'rotate(45deg)'
            }}></div>

            <div style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '10px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '2px'
            }}>
              Total Balance
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              gap: '2px',
              marginBottom: '6px'
            }}>
              <span style={{
                color: 'white',
                fontSize: '12px',
                fontWeight: '700',
                marginTop: '4px'
              }}>
                KES
              </span>
              <div style={{
                background: 'linear-gradient(to right, #34d399, #10b981)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '22px',
                fontWeight: '900',
                lineHeight: '1'
              }}>
                {stats.availableBalance.toLocaleString()}
              </div>
            </div>
            
            <button 
              onClick={() => navigate("/withdraw-form")}
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s'
              }}
            >
              Withdraw
            </button>
          </div>
        </div>
      </div>
      

      {/* LIVE WITHDRAWAL FEED */}
      <div className="live-withdrawal-feed" style={{ marginTop: '-25px', transform: 'scale(0.95)', transformOrigin: 'top center' }}>
        <LiveWithdrawalFeed />
      </div>

{/* ADD USER NOTIFICATIONS HERE - right after the withdrawal feed */}
<div className="user-notifications-section">
  <UserNotifications />
</div>
{/* WELCOME BONUS CARD - COMPACT VERSION */}
<section ref={welcomeRef}>
  <div className="plan-card welcome-bonus" style={{
    background: 'linear-gradient(145deg, #5f0f40, #831843, #9d174d)',
    border: '4px solid #ff3333',
    boxShadow: '0 20px 30px -10px rgba(95, 15, 64, 0.5), 0 8px 15px -6px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 215, 0, 0.3) inset',
    borderRadius: '24px',
    padding: '8px 16px', /* REDUCED from 10px 20px to 8px 16px */
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease'
  }}>
    {/* Diamond pattern overlay */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: 'linear-gradient(45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%)',
      backgroundSize: '30px 30px',
      opacity: 0.3,
      pointerEvents: 'none',
      zIndex: 1
    }} />
    
    {/* Shine effect */}
    <div style={{
      position: 'absolute',
      top: '-50%',
      left: '-50%',
      width: '200%',
      height: '200%',
      background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 80%)',
      opacity: 0.4,
      pointerEvents: 'none',
      zIndex: 1
    }} />
    
    {/* HEADER - EXTRA COMPACT */}
    <div className="plan-card-header" style={{ 
      position: 'relative', 
      zIndex: 2,
      marginBottom: '2px' /* REDUCED from 4px to 2px */
    }}>
      <div className="plan-badge" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px' /* REDUCED from 10px to 8px */
      }}>
        <span className="plan-icon" style={{ 
          fontSize: '28px', /* REDUCED from 32px to 28px */
          color: '#ffd700',
          background: 'rgba(255, 255, 255, 0.15)',
          width: '44px', /* REDUCED from 52px to 44px */
          height: '44px', /* REDUCED from 52px to 44px */
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
          border: '2px solid rgba(255, 215, 0, 0.5)',
          textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
        }}>
          🎁
        </span>
        <span className="plan-name" style={{ 
          color: '#ffffff !important',
          fontSize: '20px', /* REDUCED from 22px to 20px */
          fontWeight: '900',
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
          letterSpacing: '-0.5px'
        }}>
          Welcome Bonus
        </span>
      </div>
      <span className="plan-status" style={{ 
        background: '#c2410c !important',
        color: '#ffffff !important',
        border: '2px solid #ffd700 !important',
        padding: '4px 12px', /* REDUCED from 6px 14px to 4px 12px */
        borderRadius: '40px',
        fontSize: '10px', /* REDUCED from 11px to 10px */
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '0.6px', /* REDUCED from 0.8px to 0.6px */
        boxShadow: '0 0 12px rgba(255, 255, 255, 0.3)',
        textShadow: '0 1px 3px #000000'
      }}>
        🔓 ACTIVATE NOW
      </span>
    </div>
    
    {/* BODY - EXTRA COMPACT */}
    <div className="plan-card-body" style={{ position: 'relative', zIndex: 2 }}>
      
      {/* ===== BONUS AMOUNT SECTION - REMOVED THE "WELCOME BONUS" CAPTION ABOVE AMOUNT ===== */}
      <div style={{
        textAlign: 'center',
        margin: '2px 0', /* REDUCED from 4px to 2px */
        padding: '6px', /* REDUCED from 8px to 6px */
        background: 'rgba(0, 0, 0, 0.25)',
        borderRadius: '10px', /* REDUCED from 12px to 10px */
        border: '1px solid rgba(255, 215, 0, 0.4)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
      }}>
        {/* REMOVED the "WELCOME BONUS" caption span that was here */}
        <span style={{
          fontSize: '32px', /* REDUCED from 36px to 32px */
          fontWeight: '900',
          color: 'white',
          display: 'block',
          lineHeight: '1.1',
          textShadow: '0 0 12px #ffd700, 0 2px 4px rgba(0, 0, 0, 0.4)'
        }}>
          KES 1,200
        </span>
      </div>
      
      {/* DESCRIPTION - KEPT INTACT with original text */}
      <p style={{
        fontSize: '13px', /* REDUCED from 14px to 13px */
        lineHeight: '1.3', /* REDUCED from 1.4 to 1.3 */
        color: 'rgba(255, 255, 255, 0.95)',
        textAlign: 'center',
        margin: '0 0 4px', /* REDUCED from 6px to 4px */
        fontWeight: '600',
        textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
        background: 'rgba(0, 0, 0, 0.2)',
        padding: '6px 12px', /* REDUCED from 8px 14px to 6px 12px */
        borderRadius: '30px',
        border: '1px solid rgba(255, 215, 0, 0.2)'
      }}>
        Congratulations! You've received a welcome bonus of <strong style={{
          color: '#ffd700',
          fontSize: '16px', /* REDUCED from 18px to 16px */
          fontWeight: '900',
          textShadow: '0 0 6px #ffd700'
        }}>KES 1,200</strong>. Activate your account to withdraw instantly!
      </p>
    </div>
    
    {/* FOOTER - EXTRA COMPACT */}
    <div className="plan-card-footer" style={{ 
      position: 'relative', 
      zIndex: 2,
      marginTop: '0'
    }}>
      <button 
        className="start-survey-btn"
        onClick={handleWelcomeBonusWithdraw}
        style={{
          background: 'linear-gradient(145deg, #2563eb, #1e40af)',
          border: '2px solid #ffd700',
          borderRadius: '40px',
          padding: '10px 16px', /* REDUCED from 12px 20px to 10px 16px */
          fontWeight: '900',
          fontSize: '13px', /* REDUCED from 14px to 13px */
          color: 'white',
          textTransform: 'uppercase',
          letterSpacing: '0.6px', /* REDUCED from 0.8px to 0.6px */
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px', /* REDUCED from 8px to 6px */
          width: '100%',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 10px rgba(255, 215, 0, 0.3)',
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 215, 0, 0.5), 0 0 12px rgba(255, 215, 0, 0.4)';
          e.currentTarget.style.borderColor = '#ffffff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4), 0 0 10px rgba(255, 215, 0, 0.3)';
          e.currentTarget.style.borderColor = '#ffd700';
        }}
      >
        <span className="btn-icon" style={{ fontSize: '16px' }}>🔓</span>
        ACTIVATE & CLAIM NOW
        <span style={{ fontSize: '14px', marginLeft: '2px' }}>✨</span>
      </button>
    </div>
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

              {/* Affiliate Earnings Card */}
              <div className="stats-card affiliate-balance" style={{ background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)' }}>
                <div className="stats-card-header">
                  <span className="stats-icon">🎁</span>
                  <h4>Affiliate Earnings</h4>
                </div>
                <div className="stats-card-body">
                  <span className="stats-value">KES {(stats.affiliateEarnings || 0).toLocaleString()}</span>
                  <span className="stats-label">From referrals</span>
                </div>
                <button 
                  className="withdraw-quick-btn affiliate-withdraw-btn" 
                  onClick={() => navigate("/withdraw-form?type=affiliate")}
                >
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
                         

<strong className="earned-amount" style={{ 
  color: PLANS[key].totalColor,
  fontWeight: '900',
  textShadow: `0 0 10px ${PLANS[key].totalColor}`,
  fontSize: '16px'
}}>
  KES {earnedSoFar(key).toLocaleString()}
</strong>


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
              <div className="feature-card">
                <div className="feature-icon">📊</div>
                <h4>Real-time Tracking</h4>
                <p>Monitor your earnings and progress in real-time. Full transparency.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎁</div>
                <h4>Referral Bonuses</h4>
                <p>Earn KES 50 for each friend you refer. Unlimited earning potential.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📱</div>
                <h4>Mobile Friendly</h4>
                <p>Complete surveys on any device. Work from anywhere, anytime.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💰</div>
                <h4>Multiple Income Streams</h4>
                <p>Activate different plans and maximize your earnings potential.</p>
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

          {/* TESTIMONIALS - Moved back to Dashboard */}
          <section className="dashboard-section">
            <div className="section-heading">
              <h3>Community Success</h3>
              <p>See what others are earning</p>
            </div>
            <Testimonials variant="grid" />
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
                  background: plan.gradient,
                  boxShadow: `0 10px 30px ${plan.color}40`
                }}>
                  <div className="plan-card-header">
                    <div className="plan-badge">
                      <span className="plan-icon">{plan.icon}</span>
                      <span className="plan-name">{plan.name}</span>
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
                        
<span className="stat-value" style={{ 
  color: PLANS[key].totalColor,
  fontWeight: '900',
  textShadow: `0 0 10px ${PLANS[key].totalColor}`,
  fontSize: '18px'
}}>
  KES {plan.total}
</span>


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
                          {!activated ? 'Activate to Withdraw' : 
                           hasPending ? '📤 Manage Withdrawal' :
                           '💸 Withdraw KES'} {(!hasPending && activated) ? plan.total : ''}
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

      {/* BOTTOM NAVIGATION BAR */}
      <div className="bottom-nav-bar">
        <button
          className={`nav-btn ${activeTab === "OVERVIEW" ? "active" : ""}`}
          onClick={() => setActiveTab("OVERVIEW")}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Home</span>
        </button>
        <button
          className={`nav-btn ${activeTab === "SURVEYS" ? "active" : ""}`}
          onClick={goToSurveys}
        >
          <span className="nav-icon">📝</span>
          <span className="nav-label">Surveys</span>
        </button>
        <button
          className="nav-btn"
          onClick={() => navigate("/affiliate")}
        >
          <span className="nav-icon">🎯</span>
          <span className="nav-label">Affiliate</span>
        </button>
        <button
          className="nav-btn"
          onClick={() => navigate("/withdraw-form")}
        >
          <span className="nav-icon">💸</span>
          <span className="nav-label">Withdraw</span>
        </button>
      </div>

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
        /* FORCE DARK MODE STYLES GLOBALLY */
        :global(:root[data-theme='dark']) {
          --bg-main: #0f172a !important;
          --bg-surface: #1e293b !important;
          --text-main: #f8fafc !important;
          --text-muted: #cbd5e1 !important;
          --border-soft: rgba(255, 255, 255, 0.1) !important;
        }

        :global(html[data-theme='dark'] body) {
          background-color: var(--bg-main) !important;
          color: var(--text-main) !important;
        }

        /* Override hardcoded backgrounds in Dashboard.css */
        :global(html[data-theme='dark']) .stats-card,
        :global(html[data-theme='dark']) .feature-card,
        :global(html[data-theme='dark']) .quick-action-card {
          background: var(--bg-surface) !important;
          border-color: var(--border-soft) !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
        }
        
        /* Ensure text visibility in dark mode */
        :global(html[data-theme='dark']) .stats-card h4,
        :global(html[data-theme='dark']) .feature-card h4,
        :global(html[data-theme='dark']) .quick-action-card h4 {
          color: var(--text-main) !important;
          text-shadow: none !important;
        }
        
        :global(html[data-theme='dark']) .stats-card p,
        :global(html[data-theme='dark']) .feature-card p,
        :global(html[data-theme='dark']) .quick-action-card p {
          color: var(--text-muted) !important;
        }

        /* Add padding to main dashboard to avoid content being hidden by nav bar */
        .dashboard {
          padding-bottom: 90px; /* Adjust based on nav bar height */
        }

        .bottom-nav-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-around;
          align-items: center;
          background: var(--bg-surface, #ffffff);
          padding: 10px 16px;
          padding-bottom: calc(10px + env(safe-area-inset-bottom));
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
          z-index: 1000;
          border-top: 1px solid var(--border-soft, #f1f5f9);
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.95);
        }

        /* Dark mode support for nav bar */
        [data-theme='dark'] .bottom-nav-bar {
          background: rgba(30, 41, 59, 0.95);
          border-top-color: rgba(255, 255, 255, 0.1);
        }

        /* The .nav-btn styles are in Dashboard.css */
        /* We can add overrides or new styles here if needed */
        .nav-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          gap: 2px;
          padding: 4px;
          border-radius: 8px;
          transition: all 0.2s ease;
          color: var(--text-muted);
          max-width: 60px;
        }

        .nav-btn.active {
          color: var(--primary);
          background: rgba(37, 99, 235, 0.1);
        }

        .nav-icon {
          font-size: 16px;
        }

        .nav-label {
          font-size: 9px;
        }

        .nav-icon {
          font-size: 22px;
          margin-bottom: 2px;
          display: block;
        }

        .nav-label {
          font-size: 11px;
          font-weight: 600;
          display: block;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Quick Actions Mobile Fix */
        .quick-actions-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          width: 100%;
        }

        .quick-action-card {
          width: 100%;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          padding: 16px;
          background: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-soft, #f1f5f9);
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .quick-action-card .action-content {
          flex: 1;
          padding: 0 12px;
          text-align: left;
        }

        .quick-action-card h4 {
          margin: 0 0 4px 0;
          font-size: 15px;
          font-weight: 700;
          color: var(--text-main, #1e293b);
        }

        .quick-action-card p {
          margin: 0;
          font-size: 12px;
          color: var(--text-muted, #64748b);
        }

        .quick-action-card .action-icon {
          font-size: 24px;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 12px;
          flex-shrink: 0;
        }

        .quick-action-card .action-btn {
          padding: 8px 16px;
          border-radius: 10px;
          border: none;
          background: var(--primary, #2563eb);
          color: white;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
        }

        .quick-action-card.completed .action-btn {
          background: #10b981;
        }

        @media (min-width: 768px) {
          .quick-actions-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>

      {/* ===================== GAMIFICATION SECTION - AT BOTTOM ===================== */}
      <div className="gamification-section" style={{ marginTop: '30px', marginBottom: '30px' }}>
        <div className="gamification-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {/* Level & Streak Card */}
          <div className="level-streak-card" style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '16px',
            padding: '20px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '1.5rem'
              }}>⭐</div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>Level {gamificationStats.level}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{gamificationStats.xp} / {gamificationStats.xpToNextLevel} XP</div>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(gamificationStats.xp / gamificationStats.xpToNextLevel) * 100}%`,
                  background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                  borderRadius: '4px'
                }}></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowDailyReward(true)}
                style={{
                  background: canClaimDailyReward ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: canClaimDailyReward ? 'pointer' : 'default',
                  color: 'white',
                  fontWeight: 'bold',
                  transition: 'all 0.3s'
                }}
              >
                🎁 Daily Reward {canClaimDailyReward && '🔔'}
              </button>
              <div style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '10px 16px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🔥 {gamificationStats.currentStreak} day streak
              </div>
            </div>
          </div>
          
          {/* Leaderboard */}
          <Leaderboard />
        </div>
      </div>

      {/* ACHIEVEMENTS */}
      <div style={{ marginBottom: '30px' }}>
        <Achievements />
      </div>

      {/* DAILY REWARD POPUP */}
      <DailyRewardPopup
        isOpen={showDailyReward}
        onClose={() => setShowDailyReward(false)}
        onRewardClaimed={handleDailyRewardClaimed}
      />
    </div>
  );
}