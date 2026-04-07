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

const PLANS = {
  REGULAR: { 
    name: "Regular", 
    icon: "⭐", 
    total: 1500, 
    perSurvey: 150,
    color: "#1f7405",
    gradient: "linear-gradient(135deg, #1f7405, #2d9a07)",
    borderColor: "rgba(255, 255, 255, 0.4)",
    bgColor: "#1f7405",
    description: "Perfect for beginners",
    totalColor: "#ffffff",
    totalGlow: "0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)"
  },
  VIP: { 
    name: "VIP", 
    icon: "💎", 
    total: 2000, 
    perSurvey: 200,
    color: "#0080ff",
    gradient: "linear-gradient(135deg, #0066cc, #0080ff)",
    borderColor: "rgba(255, 255, 255, 0.4)",
    bgColor: "#0066cc",
    description: "For active earners",
    totalColor: "#ffffff",
    totalGlow: "0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)"
  },
  VVIP: { 
    name: "VVIP", 
    icon: "👑", 
    total: 3000, 
    perSurvey: 300,
    color: "#FF6600",
    gradient: "linear-gradient(135deg, #cc5200, #FF6600)",
    borderColor: "rgba(255, 255, 255, 0.4)",
    bgColor: "#cc5200",
    description: "Maximum earnings",
    totalColor: "#ffffff",
    totalGlow: "0 0 10px rgba(255, 255, 255, 0.5), 0 0 20px rgba(255, 255, 255, 0.3)"
  },
};
const TOTAL_SURVEYS = 10;
const APP_VERSION = "1.2.5";

const getInitialTheme = () => {
  if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
    return localStorage.getItem('theme');
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
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
  const [activationRequests, setActivationRequests] = useState([]);
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
  const [ setCanClaimDailyReward] = useState(false);
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

    const savedVersion = localStorage.getItem("app_version");
    if (savedVersion !== APP_VERSION) {
      localStorage.setItem("app_version", APP_VERSION);
      if (savedVersion) {
        window.location.reload();
      }
    }

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
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
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
     GAMIFICATION - CHECK WELCOME BONUS
   ========================= */
  useEffect(() => {
    const showWelcomeBonus = localStorage.getItem("showWelcomeBonus");
    const bonusAmount = localStorage.getItem("welcomeBonusAmount");
    
    if (showWelcomeBonus === "true") {
      setWelcomeBonusAmount(bonusAmount ? parseInt(bonusAmount) : 1200);
      
      const showAfterDelay = setTimeout(() => {
        setShowWelcomeBonus(true);
      }, 5000);
      
      const showAgainAfter = setTimeout(() => {
        const dismissed = localStorage.getItem("welcomeBonusDismissed");
        if (!dismissed) {
          setShowWelcomeBonus(true);
        }
      }, 15000);
      
      localStorage.removeItem("showWelcomeBonus");
      localStorage.removeItem("welcomeBonusAmount");
      
      return () => {
        clearTimeout(showAfterDelay);
        clearTimeout(showAgainAfter);
      };
    }
  }, []);

  const handleWelcomeBonusClose = () => {
    setShowWelcomeBonus(false);
    localStorage.setItem("welcomeBonusDismissed", "true");
    
    setTimeout(() => {
      const checkAndShowDailyReward = async () => {
        try {
          const response = await gamificationApi.checkDailyReward();
          if (response.data.can_claim) {
            setCanClaimDailyReward(true);
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
          setCanClaimDailyReward(true);
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
    setCanClaimDailyReward(false);
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

    if (!isActivated(plan)) {
      try {
        await api.post("/surveys/select-plan", { plan });
      } catch (error) {
        console.error("Failed to set active plan:", error);
      }
      
      navigate("/activation-notice", { 
        state: { 
          planKey: plan,
          amount: PLANS[plan].total
        }
      });
      return;
    }

    if (pendingWithdrawals[plan]) {
      window.scrollTo(0, 0);
      navigate("/withdraw-success", {
        state: {
          withdrawal: pendingWithdrawals[plan],
          plan: PLANS[plan]
        }
      });
      return;
    }

    navigate("/withdraw-form", { state: { plan } });
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
      message: "🎁 Activate your account with KES 100 to unlock your KES 1,200 welcome bonus!",
      redirect: "/activate?welcome_bonus=true",
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
    const whatsappUrl = `https://wa.me/254769945306?text=${message}`;
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

  return (
    <div className="dashboard" ref={dashboardRef}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={openWhatsAppSupport}
              style={{
                background: '#25D366',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 14px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Contact Support on WhatsApp"
            >
              <span style={{ fontSize: '16px' }}>💬</span>
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
          {user && (
            activationRequests.some(req => req.status === 'SUBMITTED') ? (
              <button
                disabled
                className="activate-btn-pulse"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderRadius: '25px',
                  padding: '10px 20px',
                  color: 'white',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'not-allowed',
                  boxShadow: '0 4px 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  opacity: 0.9
                }}
              >
                <span className="btn-icon" style={{ fontSize: '16px' }}>⏳</span>
                PENDING APPROVAL
                <span style={{ fontSize: '14px', marginLeft: '2px' }}>⏰</span>
              </button>
            ) : user.is_activated ? (
              <button
                disabled
                className="activate-btn-pulse"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderRadius: '25px',
                  padding: '10px 20px',
                  color: 'white',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'default',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.5), 0 0 40px rgba(5, 150, 105, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                <span className="btn-icon" style={{ fontSize: '16px' }}>✅</span>
                ACTIVATED
                <span style={{ fontSize: '14px', marginLeft: '2px' }}>🎉</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/activate?welcome_bonus=true')}
                className="activate-btn-pulse"
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderRadius: '25px',
                  padding: '10px 20px',
                  color: 'white',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(249, 115, 22, 0.5), 0 0 40px rgba(234, 88, 12, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  animation: 'pulse-glow 2s infinite',
                  transition: 'all 0.3s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 6px 30px rgba(249, 115, 22, 0.7), 0 0 60px rgba(234, 88, 12, 0.5)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(249, 115, 22, 0.5), 0 0 40px rgba(234, 88, 12, 0.3)';
                }}
              >
                <span className="btn-icon" style={{ fontSize: '16px' }}>🔓</span>
                TAP HERE TO ACTIVATE ACCOUNT 
                <span style={{ fontSize: '14px', marginLeft: '2px' }}>✨</span>
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

      {/* HERO SECTION - ULTRA COMPACT */}
      <div className="dashboard-section hero-section" style={{
        borderRadius: '0',
        padding: '12px',
        background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
        boxShadow: '0 6px 20px -5px rgba(0, 0, 0, 0.15)',
        border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.2)',
        position: 'relative',
        overflow: 'hidden',
        marginTop: '76px',
        marginBottom: '0'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          alignItems: 'stretch'
        }}>
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
          
          <div style={{
            background: 'linear-gradient(145deg, #1f7405, #2d9a07)',
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
                color: 'white',
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
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.5)',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: '900',
                cursor: 'pointer',
                width: '100%',
                transition: 'all 0.2s',
                boxShadow: '0 4px 15px rgba(220, 38, 38, 0.5)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.5)';
              }}
            >
              WITHDRAW NOW
            </button>
          </div>
        </div>
      </div>
      
{/* WELCOME BONUS CARD - FIRST AFTER HEADER - DEEP ORANGE, SMALL SIZE, ALL CAPTIONS TOGETHER */}
<section ref={welcomeRef}>
  <div className="plan-card welcome-bonus" style={{
    background: 'linear-gradient(135deg, #cc6300, #0122b4, #14e600) !important',
    border: '2px solid rgba(255, 255, 255, 0.5) !important',
    borderRadius: '16px !important',
    padding: '12px !important',
    margin: '8px 0 !important',
    boxShadow: '0 8px 20px rgba(1, 34, 180, 0.5) !important',
    position: 'relative',
    overflow: 'hidden'
  }}>
    {/* Subtle animated background effect */}
    <div style={{
      position: 'absolute',
      top: '-50%',
      left: '-50%',
      width: '200%',
      height: '200%',
      background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)',
      animation: 'rotate 15s linear infinite'
    }} />
    
    {/* ALL CAPTIONS TOGETHER IN ONE COMPACT DIV */}
    <div style={{
      position: 'relative',
      zIndex: 2,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {/* Header with icon and title */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ fontSize: '20px' }}>🎁</span>
          <span style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#FFEE58',
            letterSpacing: '1px'
          }}>
            Welcome Bonus
          </span>
        </div>
        <span style={{
          background: '#f59e0b',
          color: '#000',
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '10px',
          fontWeight: '700',
          textTransform: 'uppercase'
        }}>
          New
        </span>
      </div>
      
      {/* Main content - ALL CAPTIONS TOGETHER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,0,0,0.25), rgba(0,0,0,0.15)) !important',
        borderRadius: '12px !important',
        padding: '10px !important',
        border: '1px solid rgba(255,255,255,0.3) !important',
        backdropFilter: 'blur(2px)'
      }}>
       
  
        
        {/* Description text - all in one block */}
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '900',
            color: '#FFD700',
            textShadow: '0 0 10px rgba(255,215,0,0.8), 0 0 20px rgba(255,215,0,0.5), 2px 2px 4px rgba(0,0,0,0.8)',
            letterSpacing: '0.5px',
            lineHeight: '1.3'
          }}>
            Congratulations! You've received a welcome bonus of 
            <span style={{
              color: '#4ade80',
              fontSize: '24px',
              fontWeight: '700',
              display: 'inline-block'
            }}>
              KES 1,200
            </span>
          </div>
          <span style={{
            fontSize: '10px !important',
            fontWeight: '500 !important',
            color: 'rgba(255,255,255,0.8) !important',
            display: 'block',
            marginTop: '2px'
          }}>
            Activate your account to withdraw instantly!
          </span>
        </div>
      </div>
    </div>
    
    {/* Action Button */}
    <div style={{ 
      marginTop: '10px', 
      position: 'relative', 
      zIndex: 2 
    }}>
      <button 
        className="start-survey-btn"
        onClick={handleWelcomeBonusWithdraw}
        style={{
          background: 'linear-gradient(135deg, #dc2626, #b91c1c) !important',
          border: '2px solid rgba(255, 255, 255, 0.5) !important',
          borderRadius: '30px !important',
          padding: '12px 16px !important',
          fontWeight: '900 !important',
          fontSize: '14px !important',
          color: 'white !important',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          cursor: 'pointer',
          boxShadow: '0 0 20px rgba(220, 38, 38, 0.7) !important',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 0 25px rgba(220, 38, 38, 0.9)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(220, 38, 38, 0.7)';
        }}
      >
        <span style={{ fontSize: '14px' }}>🔓</span>
        TAP HERE TO WITHDRAW
        <span style={{ fontSize: '12px' }}>✨</span>
      </button>
    </div>
  </div>
</section>
      {/* SURVEY PLANS - Shown after Welcome Bonus (ONLY ONE INSTANCE) */}
      <section className="dashboard-section">
        <div className="section-heading">
          <h3>Survey Plan Available Today</h3>
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
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '12px'
              }}>
                <div className="progress-card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span className="plan-icon" style={{ fontSize: '32px' }}>{plan.icon}</span>
                  <h4 style={{ flex: 1, fontSize: '18px', fontWeight: '900', color: 'white' }}>{plan.name}</h4>
                  <span className={`status-badge ${status.status}`} style={{
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: '900',
                    background: status.status === 'completed' ? 'rgba(72, 187, 120, 0.2)' : 
                                status.status === 'in-progress' ? 'rgba(251, 191, 36, 0.2)' : 
                                'rgba(255, 255, 255, 0.2)',
                    border: `2px solid ${
                      status.status === 'completed' ? '#48bb78' : 
                      status.status === 'in-progress' ? '#fbbf24' : 
                      'rgba(255,255,255,0.3)'
                    }`,
                    color: status.status === 'completed' ? '#48bb78' : 
                           status.status === 'in-progress' ? '#fbbf24' : 
                           'white'
                  }}>
                    {status.icon} {status.label}
                  </span>
                </div>
                <div className="progress-card-body">
                  <div className="progress-info" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
                    <div className="progress-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <span>Per Survey:</span>
                      <strong style={{ color: 'white' }}>KES {plan.perSurvey}</strong>
                    </div>
                    <div className="progress-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <span>Surveys:</span>
                      <strong style={{ color: 'white' }}>{surveysDone(key)}/{TOTAL_SURVEYS}</strong>
                    </div>
                    <div className="progress-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span>Earned:</span>
                      <strong className="earned-amount" style={{ 
                        color: 'white',
                        fontWeight: '900',
                        textShadow: '0 0 10px rgba(255,255,255,0.5)',
                        fontSize: '16px'
                      }}>
                        KES {earnedSoFar(key).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                  
                  <div className="progress-bar" style={{ height: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
                    <div 
                      className="progress-bar-fill"
                      style={{ 
                        width: `${progressPercentage(key)}%`,
                        height: '100%',
                        background: plan.gradient,
                        borderRadius: '10px',
                        transition: 'width 0.5s ease'
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
                      textAlign: 'center',
                      marginBottom: '12px'
                    }}>
                      ⏳ Withdrawal Pending - Click to Manage
                    </div>
                  )}
                  
                  <div className="progress-card-actions" style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="action-btn primary"
                      onClick={() => startSurvey(key)}
                      disabled={isCompleted(key)}
                      style={{
                        flex: 1,
                        padding: '14px',
                        fontSize: '14px',
                        fontWeight: '900',
                        borderRadius: '10px',
                        border: '2px solid rgba(255,255,255,0.5)',
                        background: isCompleted(key) ? '#666' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        color: 'white',
                        cursor: isCompleted(key) ? 'not-allowed' : 'pointer',
                        opacity: isCompleted(key) ? 0.6 : 1
                      }}
                    >
                      {isCompleted(key) ? '✓ Completed' : '🚀 Start Survey'}
                    </button>
                    
                    {isCompleted(key) && (
                      <button 
                        className="action-btn secondary"
                        onClick={() => {
                          if (hasPendingActivation(key)) {
                            setFullScreenNotification({
                              message: "⏳ Your activation payment is pending approval. Please wait for admin to approve your payment.",
                              redirect: null
                            });
                            return;
                          }
                          handleWithdrawClick(key);
                        }}
                        style={{
                          flex: 1,
                          padding: '14px',
                          fontSize: '14px',
                          fontWeight: '900',
                          borderRadius: '10px',
                          border: '2px solid rgba(255,255,255,0.5)',
                          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                          color: 'white',
                          cursor: 'pointer',
                          boxShadow: '0 4px 15px rgba(220, 38, 38, 0.5)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.7)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.5)';
                        }}
                      >
                        {!activated ? (hasPendingActivation(key) ? '⏳ Pending' : '🔓 Activate') : 
                         hasPending ? '📤 Manage' : '💸 Withdraw'}
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
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          <div className="stats-card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '16px', padding: '16px' }}>
            <div className="stats-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="stats-icon" style={{ fontSize: '24px' }}>💰</span>
              <h4 style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}>Total Earnings</h4>
            </div>
            <div className="stats-card-body">
              <span className="stats-value" style={{ color: '#ffffff', fontSize: '24px', fontWeight: '900', display: 'block' }}>KES {stats.totalEarned.toLocaleString()}</span>
              <span className="stats-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>Lifetime earnings</span>
            </div>
          </div>

          <div className="stats-card" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: '16px', padding: '16px' }}>
            <div className="stats-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="stats-icon" style={{ fontSize: '24px' }}>💳</span>
              <h4 style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}>Available</h4>
            </div>
            <div className="stats-card-body">
              <span className="stats-value" style={{ color: '#ffffff', fontSize: '24px', fontWeight: '900', display: 'block' }}>KES {stats.availableBalance.toLocaleString()}</span>
              <span className="stats-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>Ready to withdraw</span>
            </div>
          </div>

          <div className="stats-card" style={{ background: 'linear-gradient(135deg, #1f7405, #2d9a07)', borderRadius: '16px', padding: '16px' }}>
            <div className="stats-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="stats-icon" style={{ fontSize: '24px' }}>🎁</span>
              <h4 style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}>Affiliate</h4>
            </div>
            <div className="stats-card-body">
              <span className="stats-value" style={{ color: '#ffffff', fontSize: '24px', fontWeight: '900', display: 'block' }}>KES {(stats.affiliateEarnings || 0).toLocaleString()}</span>
              <span className="stats-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>From referrals</span>
            </div>
          </div>

          <div className="stats-card" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', borderRadius: '16px', padding: '16px' }}>
            <div className="stats-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="stats-icon" style={{ fontSize: '24px' }}>📊</span>
              <h4 style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px' }}>Surveys</h4>
            </div>
            <div className="stats-card-body">
              <span className="stats-value" style={{ color: '#ffffff', fontSize: '24px', fontWeight: '900', display: 'block' }}>{stats.totalSurveysCompleted}</span>
              <span className="stats-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>Total surveys</span>
            </div>
          </div>
        </div>
      </section>

      {/* NOTIFICATIONS & LIVE WITHDRAWALS */}
      <section className="dashboard-section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          <div>
            <UserNotifications />
          </div>
          <div>
            <LiveWithdrawalFeed />
          </div>
        </div>
      </section>

      {/* WHY USERS LOVE OUR PLATFORM */}
      <section className="dashboard-section">
        <div className="section-heading">
          <h3>Why Users Love Our Platform</h3>
          <p>Discover what makes us the best choice for earning online</p>
        </div>
        <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          <div className="feature-card" style={{ background: 'linear-gradient(135deg, #ed64a6, #9f7aea)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
            <div className="feature-icon" style={{ fontSize: '32px', marginBottom: '8px' }}>⚡</div>
            <h4 style={{ fontSize: '14px', fontWeight: '900', color: 'white', marginBottom: '4px' }}>Instant Withdrawals</h4>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)' }}>Request cash anytime and get paid within minutes.</p>
          </div>
          <div className="feature-card" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
            <div className="feature-icon" style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
            <h4 style={{ fontSize: '14px', fontWeight: '900', color: 'white', marginBottom: '4px' }}>Verified Surveys</h4>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)' }}>Only high-quality surveys that pay on time.</p>
          </div>
          <div className="feature-card" style={{ background: 'linear-gradient(135deg, #4299e1, #667eea)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
            <div className="feature-icon" style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
            <h4 style={{ fontSize: '14px', fontWeight: '900', color: 'white', marginBottom: '4px' }}>Secure Payments</h4>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)' }}>Bank-level encryption secures all transactions.</p>
          </div>
          <div className="feature-card" style={{ background: 'linear-gradient(135deg, #48bb78, #38b2ac)', borderRadius: '16px', padding: '16px', textAlign: 'center' }}>
            <div className="feature-icon" style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
            <h4 style={{ fontSize: '14px', fontWeight: '900', color: 'white', marginBottom: '4px' }}>24/7 Support</h4>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)' }}>Our team is always here to help.</p>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="dashboard-section">
        <div className="section-heading">
          <h3>Quick Actions</h3>
          <p>Complete these tasks to earn bonus points</p>
        </div>
        <div className="quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          {quickActions.map(action => (
            <div key={action.id} className={`quick-action-card ${action.completed ? 'completed' : ''}`} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              background: action.completed ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              borderRadius: '16px',
              color: 'white'
            }}>
              <span className="action-icon" style={{ fontSize: '24px', marginRight: '12px' }}>{action.icon}</span>
              <div className="action-content" style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700' }}>{action.label}</h4>
                <p style={{ margin: '0', fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
                  {action.completed ? 'Completed! +10 points' : 'Earn 10 bonus points'}
                </p>
              </div>
              <button 
                className={`action-btn ${action.completed ? 'completed' : ''}`}
                onClick={() => !action.completed && completeQuickAction(action.id)}
                disabled={action.completed}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '2px solid rgba(255,255,255,0.5)',
                  background: action.completed ? 'rgba(255,255,255,0.2)' : 'white',
                  color: action.completed ? 'white' : '#2563eb',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: action.completed ? 'default' : 'pointer'
                }}
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

      {/* SURVEYS TAB CONTENT */}
      {activeTab === "SURVEYS" && (
        <section ref={surveyRef} id="surveys-section" className="tab-section">
          <div className="section-heading">
            <h3>Available Survey Plans</h3>
            <p>Choose a plan that matches your earning goals</p>
          </div>
          
          <div className="plan-cards-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(PLANS).map(([key, plan]) => {
              const status = getPlanStatus(key);
              const activated = isActivated(key);
              const hasPending = !!pendingWithdrawals[key];
              
              return (
                <div key={key} className={`plan-card ${key.toLowerCase()}`} style={{
                  background: plan.gradient,
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: `0 10px 30px ${plan.color}40`,
                  border: '2px solid rgba(255,255,255,0.2)'
                }}>
                  <div className="plan-card-header" style={{
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '2px solid rgba(255,255,255,0.2)',
                    background: 'rgba(0,0,0,0.1)'
                  }}>
                    <div className="plan-badge" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="plan-icon" style={{ fontSize: '32px' }}>{plan.icon}</span>
                      <span className="plan-name" style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>{plan.name} surveys</span>
                    </div>
                    <span className={`plan-status ${status.status}`} style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '900',
                      background: status.status === 'completed' ? 'rgba(72, 187, 120, 0.2)' : 
                                  status.status === 'in-progress' ? 'rgba(251, 191, 36, 0.2)' : 
                                  'rgba(255, 255, 255, 0.2)',
                      border: `2px solid ${
                        status.status === 'completed' ? '#48bb78' : 
                        status.status === 'in-progress' ? '#fbbf24' : 
                        'rgba(255,255,255,0.3)'
                      }`,
                      color: status.status === 'completed' ? '#48bb78' : 
                             status.status === 'in-progress' ? '#fbbf24' : 
                             'white'
                    }}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  
                  <div className="plan-card-body" style={{ padding: '16px' }}>
                    <div className="plan-description" style={{ marginBottom: '12px' }}>
                      <p style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{plan.description}</p>
                    </div>
                    
                    <div className="plan-stats" style={{
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '12px',
                      padding: '12px',
                      marginBottom: '12px'
                    }}>
                      <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <span className="stat-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Per Survey</span>
                        <span className="stat-value" style={{ color: 'white', fontWeight: '900' }}>KES {plan.perSurvey}</span>
                      </div>
                      <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <span className="stat-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Total Plan</span>
                        <span className="stat-value" style={{ 
                          color: 'white',
                          fontWeight: '900',
                          textShadow: '0 0 10px rgba(255,255,255,0.5)',
                          fontSize: '16px'
                        }}>
                          KES {plan.total}
                        </span>
                      </div>
                      <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span className="stat-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Progress</span>
                        <div className="progress-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '60%' }}>
                          <div className="progress-bar" style={{ flex: 1, height: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div 
                              className="progress-bar-fill"
                              style={{ 
                                width: `${progressPercentage(key)}%`,
                                height: '100%',
                                background: plan.gradient,
                                borderRadius: '4px'
                              }}
                            ></div>
                          </div>
                          <span className="progress-text" style={{ color: 'white', fontSize: '12px', fontWeight: '900' }}>
                            {surveysDone(key)}/{TOTAL_SURVEYS}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {hasPending && (
                      <div style={{
                        marginTop: '8px',
                        padding: '10px',
                        background: 'rgba(251, 191, 36, 0.15)',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                        borderRadius: '10px',
                        fontSize: '13px',
                        color: '#f59e0b',
                        fontWeight: '700',
                        textAlign: 'center',
                        marginBottom: '12px'
                      }}>
                        ⏳ Withdrawal Pending - Click "Manage Withdrawal"
                      </div>
                    )}
                    
                    <div className="plan-features" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                      <span className="feature-tag" style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '10px', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>📱 Mobile-Friendly</span>
                      <span className="feature-tag" style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '10px', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>⏱️ 5-10 Minutes</span>
                      <span className="feature-tag" style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '10px', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>💯 Guaranteed Payment</span>
                    </div>
                  </div>
                  
                  <div className="plan-card-footer" style={{ padding: '16px', borderTop: '2px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.1)' }}>
                    {!isCompleted(key) ? (
                      <button 
                        className="start-survey-btn"
                        onClick={() => startSurvey(key)}
                        style={{
                          width: '100%',
                          padding: '14px',
                          fontSize: '16px',
                          fontWeight: '900',
                          borderRadius: '10px',
                          border: '2px solid rgba(255,255,255,0.5)',
                          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <span>🚀</span>
                        Start Survey
                        <span>→</span>
                      </button>
                    ) : (
                      <div className="completed-actions" style={{ display: 'flex', gap: '8px' }}>
                        <span className="completed-badge" style={{
                          flex: 1,
                          padding: '14px',
                          background: 'rgba(72, 187, 120, 0.15)',
                          color: '#48bb78',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: '900',
                          border: '2px solid #48bb78',
                          textAlign: 'center'
                        }}>
                          ✅ All Surveys Completed
                        </span>
                        <button 
                          className="withdraw-plan-btn"
                          onClick={() => {
                            if (!activated && hasPendingActivation(key)) {
                              setFullScreenNotification({
                                message: "⏳ Your activation payment is pending approval. Please wait for admin to approve your payment.",
                                redirect: null
                              });
                              return;
                            }
                            handleWithdrawClick(key);
                          }}
                          style={{
                            flex: 1,
                            padding: '14px',
                            fontSize: '16px',
                            fontWeight: '900',
                            borderRadius: '10px',
                            border: '2px solid rgba(255,255,255,0.5)',
                            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                            color: 'white',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(220, 38, 38, 0.5)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.7)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.5)';
                          }}
                        >
                          {!activated ? (hasPendingActivation(key) ? '⏳ Pending' : '🔓 Activate') : 
                           hasPending ? '📤 Manage' : '💸 Withdraw'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <Leaderboard />
        </section>
      )}

      {/* TESTIMONIALS TAB */}
      {activeTab === "TESTIMONIALS" && (
        <section className="dashboard-section">
          <div className="section-heading">
            <h3>Real User Testimonials</h3>
            <p>See what others are saying about their earnings experience</p>
          </div>
          <Testimonials variant="grid" />
          <div className="testimonial-cta" style={{ textAlign: 'center', padding: '24px', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', borderRadius: '16px', marginTop: '20px' }}>
            <p style={{ fontSize: '16px', color: 'white', marginBottom: '16px', fontWeight: '700' }}>Ready to join thousands of happy earners?</p>
            <button className="primary-btn" onClick={goToSurveys} style={{ padding: '12px 24px', background: 'white', color: '#f59e0b', border: 'none', borderRadius: '10px', fontWeight: '900', cursor: 'pointer' }}>
              Start Earning Today →
            </button>
          </div>
        </section>
      )}

      {/* BOTTOM NAVIGATION BAR - BRIGHT COLORS */}
      <div className="bottom-nav-bar" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
        padding: '8px 12px',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        borderTop: '2px solid rgba(255,255,255,0.1)'
      }}>
        <button
          className={`nav-btn ${activeTab === "OVERVIEW" ? "active" : ""}`}
          onClick={() => setActiveTab("OVERVIEW")}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: '6px',
            background: activeTab === "OVERVIEW" ? 'linear-gradient(135deg, #FF0080, #FF4D94)' : 'rgba(255,255,255,0.1)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === "OVERVIEW" ? '0 4px 15px rgba(255, 0, 128, 0.5)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "OVERVIEW") {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "OVERVIEW") {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }
          }}
        >
          <span className="nav-icon" style={{ fontSize: '20px' }}>📊</span>
          <span className="nav-label" style={{ fontSize: '9px', fontWeight: '600' }}>Home</span>
        </button>
        
        <button
          className={`nav-btn ${activeTab === "SURVEYS" ? "active" : ""}`}
          onClick={goToSurveys}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: '6px',
            background: activeTab === "SURVEYS" ? 'linear-gradient(135deg, #00FF00, #33FF33)' : 'rgba(255,255,255,0.1)',
            color: activeTab === "SURVEYS" ? 'white' : 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: activeTab === "SURVEYS" ? '0 4px 15px rgba(0, 255, 0, 0.5)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== "SURVEYS") {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "SURVEYS") {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }
          }}
        >
          <span className="nav-icon" style={{ fontSize: '20px' }}>📝</span>
          <span className="nav-label" style={{ fontSize: '9px', fontWeight: '600' }}>Surveys</span>
        </button>
        
        <button
          className="nav-btn"
          onClick={() => navigate("/affiliate")}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: '6px',
            background: 'linear-gradient(135deg, #FF6600, #FF8533)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 15px rgba(255, 102, 0, 0.5)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 102, 0, 0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 102, 0, 0.5)';
          }}
        >
          <span className="nav-icon" style={{ fontSize: '20px' }}>🎯</span>
          <span className="nav-label" style={{ fontSize: '9px', fontWeight: '600' }}>Affiliate</span>
        </button>
        
        <button
          className="nav-btn withdraw-btn"
          onClick={() => navigate("/withdraw-form")}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: '6px',
            background: 'linear-gradient(135deg, #FF0000, #FF3333)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 15px rgba(255, 0, 0, 0.5)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 0, 0, 0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 0, 0, 0.5)';
          }}
        >
          <span className="nav-icon" style={{ fontSize: '20px' }}>💸</span>
          <span className="nav-label" style={{ fontSize: '9px', fontWeight: '600' }}>Withdraw</span>
        </button>
      </div>

      {/* GAMIFICATION SECTION */}
      <div className="gamification-section" style={{ marginTop: '30px', marginBottom: '30px' }}>
        <div className="gamification-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          <div className="level-streak-card" style={{
            background: 'linear-gradient(135deg, #1f7405 0%, #2d9a07 100%)',
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
              {/* Daily Reward button hidden - popup disabled */}
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
        </div>
      </div>

      {/* ACHIEVEMENTS */}
      <div style={{ marginBottom: '30px' }}>
        <Achievements />
      </div>

      {/* FOOTER */}
      <footer className="dashboard-footer" style={{ textAlign: 'center', padding: '20px', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
          Need help? 
          <button 
            onClick={openWhatsAppSupport}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '12px',
              margin: '0 5px'
            }}
          >
            Contact Support
          </button> 
          | <a href="/faq" style={{ color: '#3b82f6', textDecoration: 'none' }}>FAQ</a>
        </p>
        <p className="footer-note" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>© {new Date().getFullYear()} SurveyEarn. All rights reserved.</p>
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