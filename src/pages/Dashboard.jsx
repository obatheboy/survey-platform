// ========================= Dashboard.jsx =========================
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/api";
import MainMenuDrawer from "./components/MainMenuDrawer.jsx";
import LiveWithdrawalFeed from "./components/LiveWithdrawalFeed.jsx";
import UserNotifications from "../components/UserNotifications.jsx";
import Testimonials from "../components/Testimonials.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import Achievements from "./components/Achievements.jsx";
import DailyRewardPopup from "./components/DailyRewardPopup.jsx";
import WelcomeBonusPopup from "./components/WelcomeBonusPopup.jsx";
import BottomNavigation from "./components/BottomNavigation.jsx";
import { gamificationApi } from "../api/api";
import "./Dashboard.css";

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

  const surveyRef = useRef(null);
  const welcomeRef = useRef(null);
  const dashboardRef = useRef(null);

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
  const [canClaimDailyReward, setCanClaimDailyReward] = useState(false);
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
    const isActivated = user.is_activated || user.account_activated;
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
      
      const planLower = plan.toLowerCase();
      navigate(`/activate?plan=${planLower}`, { 
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
        <button className="primary-btn" onClick={() => navigate("/login")}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard" ref={dashboardRef}>
      {/* TOAST NOTIFICATION */}
      {toast && <div className="toast-notification visible">{toast}</div>}

      {/* FULL SCREEN NOTIFICATION */}
      {fullScreenNotification && (
        <div className="fullscreen-modal">
          <div className="modal-card">
            <button 
              className="modal-close-btn"
              onClick={() => {
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
                document.body.style.height = '';
                setFullScreenNotification(null);
              }}
            >
              ×
            </button>
            <div className="modal-icon">🎁</div>
            <h3 className="modal-title">Welcome Bonus!</h3>
            <p className="modal-message">{fullScreenNotification.message}</p>
            <div className="modal-actions">
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
                  className="modal-btn modal-btn-primary"
                >
                  <span>🔓</span> Activate Account Now
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
                className="modal-btn modal-btn-secondary"
              >
                Maybe Later
              </button>
            </div>
            <div className="modal-features">
              <div className="modal-feature">
                <span>✅</span>
                <span>Instant activation upon payment</span>
              </div>
              <div className="modal-feature">
                <span>🔒</span>
                <span>Secure M-Pesa payment</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN HEADER */}
      <header className="dashboard-main-header">
        <div className="header-top-row">
          <button className="menu-btn" onClick={() => setMenuOpen(true)}>
            <span className="menu-icon">☰</span>
          </button>
          <h1 className="dashboard-main-title">Dashboard</h1>
          <div className="header-right-actions">
            <button
              onClick={openWhatsAppSupport}
              className="whatsapp-btn"
              title="Contact Support on WhatsApp"
            >
              <span>💬</span> Chat
            </button>
          </div>
        </div>
        <div className="header-activation-container">
          {user && (
            activationRequests.some(req => req.status === 'SUBMITTED') ? (
              <button disabled className="activate-btn activate-btn-pending">
                <span>⏳</span> Pending Approval <span>⏰</span>
              </button>
            ) : user.is_activated ? (
              <button disabled className="activate-btn activate-btn-success">
                <span>✅</span> Activated <span>🎉</span>
              </button>
            ) : (
              <button
                onClick={() => navigate('/activate?welcome_bonus=true')}
                className="activate-btn activate-btn-pulse activate-btn-secondary"
              >
                <span>🔓</span> Tap Here to Activate Account <span>✨</span>
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

      {/* LIVE WITHDRAWAL FEED */}
      <section className="dashboard-section live-feed">
        <LiveWithdrawalFeed />
      </section>

      {/* HERO SECTION - Balance Card */}
      <section className="hero-card">
        <div className="hero-card-content">
          <div className="hero-balance-label">Total Balance</div>
          <div className="hero-balance-value">
            <span className="hero-balance-currency">KES</span>
            <div className="hero-balance-amount">{stats.availableBalance.toLocaleString()}</div>
          </div>
          <div className="hero-actions">
            <button onClick={goToSurveys} className="hero-btn hero-btn-survey">
              <span>🚀</span> Start Survey
            </button>
            <button onClick={goToWelcome} className="hero-btn hero-btn-bonus">
              <span>🎁</span> Get Bonus
            </button>
          </div>
        </div>
      </section>

      {/* WELCOME BONUS CARD */}
      <section className="welcome-bonus-section">
        <div className="welcome-bonus-card">
          <div className="welcome-bonus-content">
            <div className="welcome-bonus-header">
              <h3 className="welcome-bonus-title">
                <span>🎁</span> Welcome Bonus
              </h3>
              <span className="welcome-bonus-badge">New</span>
            </div>
            <div className="welcome-bonus-message">
              <p className="welcome-bonus-text">
                Congratulations! You've received a welcome bonus of 
                <span className="welcome-bonus-amount">KES 1,200</span>
              </p>
              <span className="welcome-bonus-subtext">Activate your account to withdraw instantly!</span>
            </div>
            <div className="welcome-bonus-action">
              <button 
                onClick={handleWelcomeBonusWithdraw}
                className="welcome-bonus-btn"
              >
                <span>🔓</span> Tap Here to Withdraw
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SURVEY PLANS */}
      <section className="dashboard-section surveys" id="surveys-section" ref={surveysSectionRef}>
        <div className="surveys-header">
          <h3>Survey Plan Available Today</h3>
          <p>Track your earnings across different plans</p>
        </div>
        <div className="progress-cards">
          {Object.entries(PLANS).map(([key, plan]) => {
            const status = getPlanStatus(key);
            const activated = isActivated(key);
            const hasPending = !!pendingWithdrawals[key];
            const planClass = `plan-card ${key.toLowerCase()}`;
            
            return (
              <div key={key} className={planClass} style={{ '--plan-color': plan.titleColor } as React.CSSProperties}>
                <div className="plan-card-header">
                  <span className="plan-icon">{plan.icon}</span>
                  <div className="plan-info">
                    <h4 className="plan-name">{plan.name}</h4>
                  </div>
                  <span className={`plan-status ${status.status}`}>
                    {status.icon} {status.label}
                  </span>
                </div>
                
                <div className="plan-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total to earn</span>
                    <span className="stat-value">KES {plan.total}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Per Survey</span>
                    <span className="stat-value">KES {plan.perSurvey}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Progress</span>
                    <span className="stat-value">{surveysDone(key)}/{TOTAL_SURVEYS}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Earned so far</span>
                    <span className="stat-value earned-amount">KES {earnedSoFar(key).toLocaleString()}</span>
                  </div>
                </div>

                <div className="progress-bar-container">
                  <div className="progress-bar-label">
                    <span>Completion</span>
                    <span>{Math.round(progressPercentage(key))}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-bar-fill"
                      style={{ 
                        width: `${progressPercentage(key)}%`,
                        background: plan.titleColor
                      }}
                    ></div>
                  </div>
                </div>

                {hasPending && (
                  <div className="pending-notice">
                    ⏳ Withdrawal Pending - Click to Manage
                  </div>
                )}

                <div className="plan-actions">
                  <button 
                    className="plan-btn plan-btn-primary"
                    onClick={() => startSurvey(key)}
                    disabled={isCompleted(key) || isActivated(key)}
                  >
                    {isActivated(key) ? '✓ Completed' : isCompleted(key) ? '✓ Completed' : '🚀 Start Survey'}
                  </button>
                  
                  {isCompleted(key) && !isActivated(key) && (
                    <button 
                      className="plan-btn plan-btn-secondary"
                      onClick={() => {
                        navigate(`/activate?plan=${key.toLowerCase()}`);
                      }}
                    >
                      🔓 Activate
                    </button>
                  )}
                  
                  {isActivated(key) && (
                    <button 
                      className="plan-btn plan-btn-success"
                      onClick={() => {
                        navigate(`/withdraw-form?type=${key.toLowerCase()}`, { state: { plan: key } });
                      }}
                    >
                      💰 Withdraw
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* EARNINGS DASHBOARD */}
      <section className="stats-section">
        <div className="stats-header">
          <h3>Your Earnings Dashboard</h3>
          <p>Track your progress and earnings across all plans</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card earnings">
            <span className="stat-icon">💰</span>
            <p className="stat-label-text">Total Earnings</p>
            <p className="stat-value">KES {stats.totalEarned.toLocaleString()}</p>
          </div>

          <div className="stat-card balance">
            <span className="stat-icon">💳</span>
            <p className="stat-label-text">Available</p>
            <p className="stat-value">KES {stats.availableBalance.toLocaleString()}</p>
          </div>

          <div className="stat-card affiliate">
            <span className="stat-icon">🎁</span>
            <p className="stat-label-text">Affiliate</p>
            <p className="stat-value">KES {(stats.affiliateEarnings || 0).toLocaleString()}</p>
          </div>

          <div className="stat-card surveys">
            <span className="stat-icon">📊</span>
            <p className="stat-label-text">Surveys</p>
            <p className="stat-value">{stats.totalSurveysCompleted}</p>
          </div>
        </div>
      </section>

      {/* NOTIFICATIONS, LEADERBOARD, ACHIEVEMENTS */}
      <section className="more-section">
        <h3>More Ways to Earn</h3>
        <UserNotifications />
        <Leaderboard />
        <Achievements />
      </section>

       {/* BOTTOM NAVIGATION */}
       <BottomNavigation user={user} />
     </div>
   );
 }