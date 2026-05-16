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
      navigate("/surveys?justStarted=true");
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
    const whatsappUrl = `https://wa.me/254757322015?text=${message}`;
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
    <div className="dashboard" ref={dashboardRef} style={{ paddingBottom: '80px' }}>
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

      {/* LIVE WITHDRAWAL FEED - MOVED TO TOP */}
      <section className="dashboard-section" style={{ paddingTop: '0', paddingBottom: '0', marginTop: '10px' }}>
        <LiveWithdrawalFeed />
      </section>

      {/* COMBINED BALANCE & WELCOME BONUS CARD - EDGE-TO-EDGE, COMPACT */}
      <section ref={welcomeRef} style={{ margin: '6px 0', padding: '0 16px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          border: '1px solid #1e40af',
          borderRadius: '12px',
          padding: '0',
          boxShadow: '0 6px 25px rgba(37, 99, 235, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1)',
          width: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden'
        }}>
          {/* Row 1: Total Balance */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '14px 16px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 auto', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>💰</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0, overflow: 'hidden' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  color: 'rgba(255,255,255,0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Total Balance
                </span>
                <span style={{
                  fontSize: '22px',
                  fontWeight: '900',
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  lineHeight: '1',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  KES {stats.availableBalance.toLocaleString()}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate("/withdraw-form")}
              style={{
                background: 'linear-gradient(135deg, #f87171, #dc2626)',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontWeight: '800',
                fontSize: '11px',
                color: 'white',
                textTransform: 'uppercase',
                cursor: 'pointer',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                boxShadow: '0 3px 10px rgba(220, 38, 38, 0.4)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(220, 38, 38, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 3px 10px rgba(220, 38, 38, 0.4)';
              }}
            >
              Withdraw Now
            </button>
          </div>

          {/* Row 2: Welcome Bonus */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '10px 16px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 auto', minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>🎁</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0, overflow: 'hidden' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '600',
                  color: 'rgba(255,255,255,0.8)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Welcome Bonus
                </span>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '900',
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  KES 1,200
                </span>
              </div>
            </div>
            <button
              className="start-survey-btn"
              onClick={handleWelcomeBonusWithdraw}
              style={{
                background: 'linear-gradient(135deg, #f87171, #dc2626)',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontWeight: '800',
                fontSize: '11px',
                color: 'white',
                textTransform: 'uppercase',
                cursor: 'pointer',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                boxShadow: '0 3px 10px rgba(220, 38, 38, 0.4)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(220, 38, 38, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 3px 10px rgba(220, 38, 38, 0.4)';
              }}
            >
              CLAIM NOW
            </button>
          </div>
        </div>
      </section>
      {/* SURVEY PLANS - Shown after Welcome Bonus (ONLY ONE INSTANCE) */}
      <section className="dashboard-section" id="surveys-section" ref={surveysSectionRef}>
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
                 background: '#ffffff',
                 borderRadius: '8px',
                 padding: '10px',
                 marginBottom: '0',
                 border: '1px solid #2563eb',
                 boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)'
               }}>
                <div className="progress-card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span className="plan-icon" style={{ fontSize: '24px' }}>{plan.icon}</span>
                   <h4 style={{ flex: 1, fontSize: '16px', fontWeight: '900', color: '#1e40af' }}>{plan.name}</h4>
                      <span className={`status-badge ${status.status}`} style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)',
                        border: '1px solid #2563eb',
                        color: '#1e40af'
                      }}>
                        {status.icon} {status.label}
                      </span>
                </div>
                 <div className="progress-card-body">
                   <div className="progress-info" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '6px', padding: '8px', marginBottom: '8px' }}>
                     <div className="progress-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid rgba(37, 99, 235, 0.15)' }}>
                        <span style={{ color: '#2563eb', fontSize: '12px' }}>Total to earn:</span>
                       <strong style={{ color: '#1e40af', fontSize: '14px', fontWeight: '900' }}>KES {plan.total}</strong>
                    </div>
                     <div className="progress-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid rgba(37, 99, 235, 0.15)' }}>
                       <span style={{ color: '#2563eb', fontSize: '12px' }}>Per Survey:</span>
                       <strong style={{ color: '#1e40af', fontSize: '12px', fontWeight: '700' }}>KES {plan.perSurvey}</strong>
                     </div>
                     <div className="progress-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid rgba(37, 99, 235, 0.15)' }}>
                       <span style={{ color: '#2563eb', fontSize: '12px' }}>Progress:</span>
                       <strong style={{ color: '#1e40af', fontSize: '12px', fontWeight: '700' }}>{surveysDone(key)}/{TOTAL_SURVEYS}</strong>
                    </div>
                     <div className="progress-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid rgba(37, 99, 235, 0.15)' }}>
                       <span style={{ color: '#2563eb', fontSize: '12px' }}>Earned so far:</span>
                       <strong style={{ color: '#1e40af', fontSize: '14px', fontWeight: '900' }}>KES {earnedSoFar(key).toLocaleString()}</strong>
                    </div>
                  </div>
                  
                   <div className="progress-bar" style={{ height: '6px', background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
                     <div
                       className="progress-bar-fill"
                       style={{
                         width: `${progressPercentage(key)}%`,
                         height: '100%',
                         background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                         borderRadius: '3px',
                         transition: 'width 0.5s ease'
                       }}
                     ></div>
                   </div>
                  
                    {hasPending && (
                      <div style={{
                        marginTop: '6px',
                        padding: '6px',
                        background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%)',
                        border: '1px solid #2563eb',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#1e40af',
                        fontWeight: '600',
                        textAlign: 'center',
                        marginBottom: '8px'
                      }}>
                        ⏳ Withdrawal Pending - Click to Manage
                      </div>
                    )}
                  
                  <div className="progress-card-actions" style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      className="action-btn primary"
                      onClick={() => startSurvey(key)}
                      disabled={isCompleted(key) || isActivated(key)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        fontSize: '12px',
                        fontWeight: '800',
                        borderRadius: '6px',
                        border: 'none',
                        background: isCompleted(key) ? '#999' : '#3b82f6',
                        color: 'white',
                        cursor: (isCompleted(key) || isActivated(key)) ? 'not-allowed' : 'pointer',
                        opacity: (isCompleted(key) || isActivated(key)) ? 0.6 : 1
                      }}
                    >
                      {isActivated(key) ? '✓ Completed' : isCompleted(key) ? '✓ Completed' : '🚀 Start Survey'}
                    </button>
                    
                    {isCompleted(key) && !isActivated(key) && (
                      <button 
                        className="action-btn secondary"
                        onClick={() => {
                          navigate(`/activate?plan=${key.toLowerCase()}`);
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          fontSize: '12px',
                          fontWeight: '800',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#dc2626',
                          color: 'white',
                          cursor: 'pointer'
                        }}
                      >
                        🔓 Activate
                      </button>
                    )}
                    
                    {isActivated(key) && (
                      <button 
                        className="action-btn secondary"
                        onClick={() => {
                          navigate(`/withdraw-form?type=${key.toLowerCase()}`, { state: { plan: key } });
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          fontSize: '12px',
                          fontWeight: '800',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#10b981',
                          color: 'white',
                          cursor: 'pointer'
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
          <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
            <div className="stats-card" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', borderRadius: '8px', padding: '14px' }}>
             <div className="stats-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
               <span className="stats-icon" style={{ fontSize: '20px' }}>💰</span>
               <h4 style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}>Total Earnings</h4>
             </div>
             <div className="stats-card-body">
               <span className="stats-value" style={{ color: '#ffffff', fontSize: '20px', fontWeight: '900', display: 'block' }}>KES {stats.totalEarned.toLocaleString()}</span>
               <span className="stats-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px' }}>Lifetime earnings</span>
             </div>
           </div>

           <div className="stats-card" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', borderRadius: '8px', padding: '14px' }}>
            <div className="stats-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="stats-icon" style={{ fontSize: '20px' }}>💳</span>
              <h4 style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}>Available</h4>
            </div>
            <div className="stats-card-body">
              <span className="stats-value" style={{ color: '#ffffff', fontSize: '20px', fontWeight: '900', display: 'block' }}>KES {stats.availableBalance.toLocaleString()}</span>
              <span className="stats-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px' }}>Ready to withdraw</span>
            </div>
           </div>

           <div className="stats-card" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', borderRadius: '8px', padding: '14px' }}>
             <div className="stats-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
               <span className="stats-icon" style={{ fontSize: '20px' }}>🎁</span>
               <h4 style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}>Affiliate</h4>
             </div>
             <div className="stats-card-body">
               <span className="stats-value" style={{ color: '#ffffff', fontSize: '20px', fontWeight: '900', display: 'block' }}>KES {(stats.affiliateEarnings || 0).toLocaleString()}</span>
               <span className="stats-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px' }}>From referrals</span>
             </div>
           </div>

           <div className="stats-card" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', borderRadius: '8px', padding: '14px' }}>
            <div className="stats-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="stats-icon" style={{ fontSize: '20px' }}>📊</span>
              <h4 style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}>Surveys</h4>
            </div>
            <div className="stats-card-body">
              <span className="stats-value" style={{ color: '#ffffff', fontSize: '20px', fontWeight: '900', display: 'block' }}>{stats.totalSurveysCompleted}</span>
              <span className="stats-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px' }}>Total surveys</span>
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
        <div className="feature-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          <div className="feature-card" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
            <div className="feature-icon" style={{ fontSize: '28px', marginBottom: '6px' }}>⚡</div>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>Instant Withdrawals</h4>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)' }}>Request cash anytime.</p>
          </div>
          <div className="feature-card" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
            <div className="feature-icon" style={{ fontSize: '28px', marginBottom: '6px' }}>✅</div>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>Verified Surveys</h4>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)' }}>High-quality surveys.</p>
          </div>
          <div className="feature-card" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
            <div className="feature-icon" style={{ fontSize: '28px', marginBottom: '6px' }}>🔒</div>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>Secure Payments</h4>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)' }}>Encrypted transactions.</p>
          </div>
          <div className="feature-card" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
            <div className="feature-icon" style={{ fontSize: '28px', marginBottom: '6px' }}>💬</div>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>24/7 Support</h4>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)' }}>Always here to help.</p>
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
               background: action.completed ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
               borderRadius: '16px',
               color: 'white',
               border: action.completed ? '1px solid rgba(255,255,255,0.2)' : 'none'
             }}>
              <span className="action-icon" style={{ fontSize: '24px', marginRight: '12px' }}>{action.icon}</span>
              <div className="action-content" style={{ flex: 1 }}>
               <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700' }}>{action.label}</h4>
               <p style={{ margin: '0', fontSize: '12px', color: 'rgba(255,255,255,0.9)' }}>
                 {action.completed ? 'Completed! +10 points' : 'Earn 10 bonus points'}
               </p>
             </div>
             <button
               onClick={() => completeQuickAction(action.id)}
               disabled={action.completed}
               style={{
                 background: action.completed ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg, #f87171, #dc2626)',
                 border: action.completed ? '1px solid rgba(255,255,255,0.3)' : 'none',
                 borderRadius: '12px',
                 padding: '8px 16px',
                 fontWeight: '800',
                 fontSize: '12px',
                 color: 'white',
                 cursor: action.completed ? 'default' : 'pointer',
                 transition: 'all 0.2s ease',
                 flexShrink: 0,
                 boxShadow: action.completed ? 'none' : '0 3px 10px rgba(220, 38, 38, 0.4)'
               }}
             >
               {action.completed ? '✓' : '→'}
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
      <div className="bottom-nav-bar" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        padding: '8px 12px',
        boxShadow: '0 -2px 10px rgba(37, 99, 235, 0.2)',
        zIndex: 1000,
        borderTop: '1px solid rgba(255,255,255,0.2)'
      }}>
        <button
          className="nav-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: '6px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          <span className="nav-icon" style={{ fontSize: '20px' }}>📊</span>
          <span className="nav-label" style={{ fontSize: '9px', fontWeight: '600' }}>Home</span>
        </button>
        
        <button
          className="nav-btn"
          onClick={goToSurveys}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: '6px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          <span className="nav-icon" style={{ fontSize: '20px' }}>📝</span>
          <span className="nav-label" style={{ fontSize: '9px', fontWeight: '600' }}>Surveys</span>
        </button>

         <button
           className="nav-btn"
           onClick={() => navigate('/affiliate')}
           style={{
             flex: 1,
             display: 'flex',
             flexDirection: 'column',
             alignItems: 'center',
             justifyContent: 'center',
             gap: '2px',
             padding: '6px',
             background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
             color: 'white',
             border: 'none',
             borderRadius: '8px',
             cursor: 'pointer'
           }}
         >
           <span className="nav-icon" style={{ fontSize: '20px' }}>👥</span>
           <span className="nav-label" style={{ fontSize: '9px', fontWeight: '600' }}>Affiliate</span>
         </button>

         <button
           className="nav-btn"
           onClick={() => navigate('/withdraw-form')}
           style={{
             flex: 1,
             display: 'flex',
             flexDirection: 'column',
             alignItems: 'center',
             justifyContent: 'center',
             gap: '2px',
             padding: '6px',
             background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
             color: 'white',
             border: 'none',
             borderRadius: '8px',
             cursor: 'pointer'
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
             background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
             borderRadius: '16px',
             padding: '20px',
             color: 'white'
           }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
               <div style={{
                 background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                 borderRadius: '12px',
                 padding: '12px',
                 fontSize: '1.5rem',
                 border: '1px solid rgba(255,255,255,0.2)'
               }}>⭐</div>
                <div>
                 <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff' }}>Level {gamificationStats.level}</div>
                 <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{gamificationStats.xp} / {gamificationStats.xpToNextLevel} XP</div>
               </div>
             </div>
             <div style={{ marginBottom: '12px' }}>
               <div style={{ height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
                 <div style={{
                   height: '100%',
                   width: `${(gamificationStats.xp / gamificationStats.xpToNextLevel) * 100}%`,
                   background: 'linear-gradient(90deg, #60a5fa, #93c5fd)',
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