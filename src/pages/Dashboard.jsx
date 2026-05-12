// ========================= Dashboard.jsx =========================
import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import MainMenuDrawer from "./components/MainMenuDrawer.jsx";
// Remove direct imports of lazy components - use lazy versions only
import UserNotifications from "../components/UserNotifications.jsx";
import Testimonials from "../components/Testimonials.jsx";
import Achievements from "./components/Achievements.jsx";
import DailyRewardPopup from "./components/DailyRewardPopup.jsx";
import WelcomeBonusPopup from "./components/WelcomeBonusPopup.jsx";
import { gamificationApi } from "../api/api";
import { DashboardSkeleton } from "../components/LoadingSkeleton";
import BottomNavigation from "./components/BottomNavigation.jsx";
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from "../utils/haptic";
import "./Dashboard.css";

// ========== FIXED LAZY IMPORTS ==========
const LazyLiveWithdrawalFeed = lazy(() => 
  import("./components/LiveWithdrawalFeed.jsx")
);

const LazyUserNotifications = lazy(() => 
  import("../components/UserNotifications.jsx")
);

const LazyTestimonials = lazy(() => 
  import("../components/Testimonials.jsx")
);

const LazyLeaderboard = lazy(() => 
  import("./components/Leaderboard.jsx")
);

const LazyAchievements = lazy(() => 
  import("./components/Achievements.jsx")
);
// Custom Hook: Use Intersection Observer for scroll animations
const useScrollAnimation = (threshold = 0.1) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, rootMargin: "0px 0px -50px 0px" }
    );

    const elements = document.querySelectorAll(".animate-on-scroll");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [threshold]);
};

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
  // Initialize scroll animations
  useScrollAnimation(0.1);
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState({});
  const [activationRequests, setActivationRequests] = useState([]);
  const [quickActions, setQuickActions] = useState([
    { id: 1, label: "Complete Profile", icon: "👤", completed: false },
    { id: 2, label: "Verify Email", icon: "📧", completed: false },
    { id: 3, label: "Invite Friends", icon: "👥", completed: false },
    { id: 4, label: "Activate & Pay", icon: "🔓", completed: false, action: "activate" },
  ]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState({});
  const [fullScreenNotification, setFullScreenNotification] = useState(null);
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
  const [stats, setStats] = useState({
    totalEarned: 0,
    availableBalance: 0,
    affiliateEarnings: 0,
    totalSurveysCompleted: 0,
    totalWithdrawals: 0
  });

  // Handle bottom nav menu click
  useEffect(() => {
    const handleOpenMenu = () => setMenuOpen(true);
    window.addEventListener('open-main-menu', handleOpenMenu);
    return () => window.removeEventListener('open-main-menu', handleOpenMenu);
  }, []);

  const surveyRef = useRef(null);
  const welcomeRef = useRef(null);
  const dashboardRef = useRef(null);
  const surveysSectionRef = useRef(null);

  // Define goToSurveys function
  const goToSurveys = () => {
    setActiveTab("SURVEYS");
    setTimeout(() => {
      const element = document.getElementById('surveys-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (surveysSectionRef.current) {
        surveysSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Define goToWelcome function
  const goToWelcome = () => {
    setActiveTab("OVERVIEW");
    setTimeout(() => {
      welcomeRef.current?.scrollIntoView({ 
        behavior: "smooth",
        block: "start"
      });
    }, 50);
  };

  // Define hapticWarning fallback
  const hapticWarning = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(200);
    }
  };

  /* =========================
     SCROLL WHEN TAB CHANGES
  ========================= */
  useEffect(() => {
    if (activeTab === "SURVEYS") {
      hapticLight();
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

  /* =========================
     GAMIFICATION - CHECK WELCOME BONUS
  ========================= */
  useEffect(() => {
    if (!user) return;
    
    const bonusAmount = user.welcome_bonus;
    const onboardingCompleted = user.survey_onboarding_completed;
    
    if (bonusAmount && onboardingCompleted) {
      setWelcomeBonusAmount(bonusAmount);
      
      const showAfterDelay = setTimeout(() => {
        setShowWelcomeBonus(true);
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
          }
        } catch (error) {
          console.error('Error checking daily reward:', error);
        }
      };
      checkAndShowDailyReward();
    }, 1500);
  };

  useEffect(() => {
    const checkDailyReward = async () => {
      if (showWelcomeBonus) return;
      
      try {
        const response = await gamificationApi.checkDailyReward();
        if (response.data.can_claim) {
          setCanClaimDailyReward(true);
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
    if (isActivated(plan)) return { status: "activated", label: "Active", icon: "✅" };
    if (hasPendingActivation(plan)) return { status: "pending-approval", label: "Pending Approval", icon: "⏳" };
    if (isCompleted(plan)) return { status: "completed", label: "Ready to Activate", icon: "✅" };
    if (surveysDone(plan) > 0) return { status: "in-progress", label: "In Progress", icon: "⏳" };
    return { status: "not-started", label: "Start Earning", icon: "🚀" };
  };

  /* =========================
     TOAST NOTIFICATION HELPER
  ========================= */
  const showToastNotification = (message, type = 'success') => {
    switch(type) {
      case 'error':
        hapticError();
        break;
      case 'warning':
        hapticWarning();
        break;
      case 'success':
        hapticSuccess();
        break;
      default:
        hapticLight();
    }

    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
      existingToast.remove();
    }

    const toastElement = document.createElement('div');
    toastElement.className = `toast-notification ${type}`;
    toastElement.textContent = message;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastElement);

    setTimeout(() => {
      toastElement.classList.add('hiding');
      setTimeout(() => toastElement.remove(), 300);
    }, 3000);
  };

  /* =========================
     SCROLL BEHAVIOR
  ========================= */
  useEffect(() => {
    const handleSmoothScroll = (e) => {
      if (e.target.closest('a[href^="#"]')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').slice(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    document.addEventListener('click', handleSmoothScroll);
    return () => document.removeEventListener('click', handleSmoothScroll);
  }, []);

  /* =========================
     INTERSECTION OBSERVER - Scroll Animations
  ========================= */
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  /* =========================
     LOAD DASHBOARD
  ========================= */
  useEffect(() => {
    let alive = true;

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

    const loadPendingWithdrawals = async () => {
      try {
        const response = await api.get('/withdrawals/pending');
        const pending = {};
        response.data.forEach(w => {
          if (w.status === 'PENDING' || w.status === 'APPROVED') {
            pending[w.plan] = w;
          }
        });
        setPendingWithdrawals(pending);
      } catch (error) {
        console.error('Failed to load pending withdrawals:', error);
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
     SURVEY ACTION
  ========================= */
  const startSurvey = async (plan) => {
    hapticMedium();
    try {
      localStorage.setItem("active_plan", plan);
      await api.post("/surveys/select-plan", { plan });
      navigate("/surveys");
    } catch {
      hapticError();
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
      hapticLight();
      setToast("Please wait before clicking again");
      setTimeout(() => setToast(""), 3000);
      return;
    }
    localStorage.setItem(`lastWithdrawClick_${plan}`, now.toString());

    if (!isCompleted(plan)) {
      hapticError();
      setToast(`Complete ${TOTAL_SURVEYS - surveysDone(plan)} more surveys to withdraw`);
      goToSurveys();
      setTimeout(() => setToast(""), 4000);
      return;
    }

    if (!isActivated(plan)) {
      hapticMedium();
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
      hapticSuccess();
      window.scrollTo(0, 0);
      navigate("/withdraw-success", {
        state: {
          withdrawal: pendingWithdrawals[plan],
          plan: PLANS[plan]
        }
      });
      return;
    }

    hapticMedium();
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
    hapticLight();
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

    hapticSuccess();
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

  // ============================================
  // COMPONENT: Header
  // ============================================
  const Header = ({ user, menuOpen, setMenuOpen, openWhatsAppSupport, activationRequests, navigate }) => (
    <header className="dashboard-main-header">
      <div className="header-title-container">
        <button 
          className="menu-btn" 
          onClick={() => {
            hapticLight();
            setMenuOpen(true);
          }}
          aria-label="Open navigation menu"
        >
          <span className="menu-icon" aria-hidden="true">☰</span>
        </button>
        <h1 className="dashboard-main-title">Dashboard</h1>
        <button
          onClick={openWhatsAppSupport}
          className="whatsapp-btn"
          aria-label="Contact support on WhatsApp"
          style={{
            background: '#25D366',
            color: 'white',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: '900',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 0 20px #25D366';
            e.currentTarget.style.background = '#22c35e';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.background = '#25D366';
          }}
        >
          <span style={{ fontSize: '16px' }}>💬</span>
          CHAT US
        </button>
      </div>

      <div className="header-activation-container">
        {user && (
          activationRequests.some(req => req.status === 'SUBMITTED') ? (
            <button
              disabled
              className="activate-btn-pulse"
              aria-label="Activation pending approval"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                border: '2px solid rgba(255,255,255,0.4)',
                borderRadius: 'var(--radius-full)',
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
              <span style={{ fontSize: '16px' }}>⏳</span>
              PENDING APPROVAL
              <span style={{ fontSize: '14px' }}>⏰</span>
            </button>
          ) : user.is_activated ? (
            <button
              disabled
              className="activate-btn-pulse"
              aria-label="Account activated"
              style={{
                background: 'var(--gradient-success)',
                border: '2px solid rgba(255,255,255,0.4)',
                borderRadius: 'var(--radius-full)',
                padding: '10px 20px',
                color: 'white',
                fontWeight: '800',
                fontSize: '13px',
                boxShadow: '0 4px 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(22, 163, 74, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                letterSpacing: '0.5px'
              }}
            >
              <span style={{ fontSize: '16px' }}>✅</span>
              ACTIVATED
              <span style={{ fontSize: '14px' }}>🎉</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/activate?welcome_bonus=true')}
              className="activate-btn-pulse hover-lift"
              aria-label="Activate your account now"
              style={{
                background: 'var(--gradient-warning)',
                border: '2px solid rgba(255,255,255,0.4)',
                borderRadius: 'var(--radius-full)',
                padding: '10px 20px',
                color: 'white',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                animation: 'pulse 2s infinite',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              <span style={{ fontSize: '16px' }}>🔓</span>
              ACTIVATE ACCOUNT
              <span style={{ fontSize: '14px' }}>✨</span>
            </button>
          )
        )}
      </div>
      
      <p className="header-greeting-bottom">
        Hello, {user?.full_name?.split(' ')[0] || 'Earner'}! 👋 Let's make money today!
      </p>
    </header>
  );

  // ============================================
  // COMPONENT: BalanceCard
  // ============================================
  const BalanceCard = ({ stats, onWithdraw }) => (
    <div className="balance-card" role="region" aria-label="Account balance">
      <div className="balance-label">Available Balance</div>
      <div className="balance-number" aria-live="polite">
        KES {stats.availableBalance.toLocaleString()}
      </div>
      <button
        onClick={onWithdraw}
        className="balance-withdraw-btn"
        aria-label={`Withdraw ${stats.availableBalance.toLocaleString()} KES`}
      >
        WITHDRAW NOW
      </button>
    </div>
  );

  // ============================================
  // COMPONENT: WelcomeBonusCard
  // ============================================
  const WelcomeBonusCard = ({ showWelcomeBonus, handleWelcomeBonusWithdraw, welcomeBonusAmount }) => {
    if (!showWelcomeBonus) return null;

    return (
      <section className="welcome-bonus animate-on-scroll" aria-labelledby="welcome-bonus-title">
        <div className="bonus-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span className="gift-icon" aria-hidden="true">🎁</span>
            <h2 
              id="welcome-bonus-title"
              className="bonus-title"
              style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-black)' }}
            >
              Welcome Bonus
            </h2>
          </div>
          <span className="badge badge-warning">New</span>
        </div>
        
        <div className="bonus-amount-container">
          <span className="bonus-amount-label">Congratulations! You've received a welcome bonus of</span>
          <span className="bonus-amount" aria-live="polite">
            KES {welcomeBonusAmount.toLocaleString()}
          </span>
          <span className="bonus-description">
            Activate your account to withdraw instantly!
          </span>
        </div>
        
        <button
          onClick={handleWelcomeBonusWithdraw}
          className="activate-bonus-btn"
          aria-label={`Claim your KES ${welcomeBonusAmount} welcome bonus`}
        >
          <span aria-hidden="true">🔓</span>
          TAP HERE TO WITHDRAW
        </button>
        
        <div className="bonus-footer">
          <span>✅ Instant activation</span>
          <span>🔒 Secure M-Pesa</span>
        </div>
      </section>
    );
  };

  // ============================================
  // COMPONENT: SurveyPlans
  // ============================================
  const SurveyPlans = ({
    plans,
    stats,
    getPlanStatus,
    isActivated,
    isCompleted,
    surveysDone,
    earnedSoFar,
    progressPercentage,
    hasPendingActivation,
    pendingWithdrawals,
    startSurvey,
    handleWithdrawClick,
    navigate
  }) => {
    const planProgress = Object.entries(plans).map(([key, plan]) => {
      const status = getPlanStatus(key);
      const activated = isActivated(key);
      const completed = isCompleted(key);
      const progress = progressPercentage(key);
      const hasPending = !!pendingWithdrawals[key];
      
      const accentColor = plan.titleColor || '#3b82f6';

      return (
        <div 
          key={key} 
          className="progress-card"
          data-plan={key}
          style={{ '--card-accent': accentColor }}
        >
          <div className="progress-card-header">
            <span className="plan-icon" aria-hidden="true" style={{ fontSize: '28px' }}>
              {plan.icon}
            </span>
            <h4 style={{ 
              fontSize: 'var(--text-base)', 
              fontWeight: 'var(--font-extrabold)',
              color: 'var(--color-gray-900)',
              textTransform: 'uppercase',
              letterSpacing: '0.3px'
            }}>
              {plan.name}
            </h4>
            <span className={`status-badge ${status.status}`} aria-label={`Plan status: ${status.label}`}>
              <span aria-hidden="true">{status.icon}</span> {status.label}
            </span>
          </div>
          
          <div className="progress-info">
            <div className="progress-row">
              <span>Total to earn:</span>
              <strong style={{ color: accentColor, fontSize: 'var(--text-base)' }}>
                KES {plan.total.toLocaleString()}
              </strong>
            </div>
            <div className="progress-row">
              <span>Per survey:</span>
              <strong>KES {plan.perSurvey.toLocaleString()}</strong>
            </div>
            <div className="progress-row">
              <span>Progress:</span>
              <strong>{surveysDone(key)}/{TOTAL_SURVEYS} surveys</strong>
            </div>
            <div className="progress-row">
              <span>Earned so far:</span>
              <strong 
                className="earned-amount"
                style={{ color: accentColor, fontSize: 'var(--text-lg)' }}
                aria-live="polite"
              >
                KES {earnedSoFar(key).toLocaleString()}
              </strong>
            </div>
          </div>
          
          <div className="progress-bar" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin="0" aria-valuemax="100" aria-label={`${key} plan progress`}>
            <div 
              className="progress-bar-fill"
              style={{ 
                width: `${progress}%`,
                background: accentColor
              }}
            ></div>
          </div>
          
          {hasPending && (
            <div className="alert alert-warning" role="status" style={{
              marginTop: 'var(--space-2)',
              padding: 'var(--space-2)',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-warning-600)',
              fontWeight: 'var(--font-semibold)',
              textAlign: 'center'
            }}>
              ⏳ Withdrawal Pending - Click to Manage
            </div>
          )}
          
          <div className="progress-card-actions">
            <button
              className="action-btn primary"
              onClick={() => startSurvey(key)}
              disabled={completed || activated}
              aria-label={activated ? 'Plan completed' : `Start ${plan.name} surveys`}
            >
              {activated ? '✓ Completed' : completed ? '✓ Completed' : '🚀 Start Survey'}
            </button>
            
            {completed && !activated && (
              <button
                className="action-btn secondary"
                onClick={() => navigate(`/activate?plan=${key.toLowerCase()}`)}
                aria-label={`Activate ${plan.name} plan`}
                style={{
                  background: 'var(--gradient-danger)',
                  color: 'white',
                  border: 'none'
                }}
              >
                🔓 Activate
              </button>
            )}
            
            {activated && (
              <button
                className="action-btn secondary"
                onClick={() => handleWithdrawClick(key)}
                aria-label={`Withdraw from ${plan.name}`}
                style={{
                  background: 'var(--gradient-success)',
                  color: 'white',
                  border: 'none'
                }}
              >
                💰 Withdraw
              </button>
            )}
          </div>
        </div>
      );
    });

    return (
      <div className="progress-cards animate-on-scroll" role="list" aria-label="Survey plans">
        {planProgress}
      </div>
    );
  };

  // ============================================
  // COMPONENT: StatsDashboard
  // ============================================
  const StatsDashboard = ({ stats }) => (
    <div className="stats-grid animate-on-scroll">
      <div className="stats-card" role="status" aria-label={`Total earnings: ${stats.totalEarned.toLocaleString()} KES`}>
        <div className="stats-card-header">
          <span className="stats-icon" aria-hidden="true">💰</span>
          <h4 className="stats-title">Total Earnings</h4>
        </div>
        <div className="stats-card-body">
          <span className="stats-value stats-number">
            KES {stats.totalEarned.toLocaleString()}
          </span>
          <span className="stats-label">Lifetime earnings</span>
        </div>
      </div>

      <div className="stats-card" role="status" aria-label={`Available balance: ${stats.availableBalance.toLocaleString()} KES`}>
        <div className="stats-card-header">
          <span className="stats-icon" aria-hidden="true">💳</span>
          <h4 className="stats-title">Available</h4>
        </div>
        <div className="stats-card-body">
          <span className="stats-value stats-number">
            KES {stats.availableBalance.toLocaleString()}
          </span>
          <span className="stats-label">Ready to withdraw</span>
        </div>
      </div>

      <div className="stats-card" role="status" aria-label={`Affiliate earnings: ${stats.affiliateEarnings.toLocaleString()} KES`}>
        <div className="stats-card-header">
          <span className="stats-icon" aria-hidden="true">🎁</span>
          <h4 className="stats-title">Affiliate</h4>
        </div>
        <div className="stats-card-body">
          <span className="stats-value stats-number">
            KES {(stats.affiliateEarnings || 0).toLocaleString()}
          </span>
          <span className="stats-label">From referrals</span>
        </div>
      </div>

      <div className="stats-card" role="status" aria-label={`Surveys completed: ${stats.totalSurveysCompleted}`}>
        <div className="stats-card-header">
          <span className="stats-icon" aria-hidden="true">📊</span>
          <h4 className="stats-title">Surveys</h4>
        </div>
        <div className="stats-card-body">
          <span className="stats-value stats-number">
            {stats.totalSurveysCompleted}
          </span>
          <span className="stats-label">Total completed</span>
        </div>
      </div>
    </div>
  );

  // ============================================
  // COMPONENT: FeaturesSection
  // ============================================
  const FeaturesSection = () => (
    <div className="feature-grid animate-on-scroll">
      <div className="feature-card">
        <div className="feature-icon" aria-hidden="true">⚡</div>
        <h4>Instant Withdrawals</h4>
        <p>Request cash anytime</p>
      </div>
      <div className="feature-card">
        <div className="feature-icon" aria-hidden="true">✅</div>
        <h4>Verified Surveys</h4>
        <p>High-quality surveys</p>
      </div>
      <div className="feature-card">
        <div className="feature-icon" aria-hidden="true">🔒</div>
        <h4>Secure Payments</h4>
        <p>Encrypted transactions</p>
      </div>
      <div className="feature-card">
        <div className="feature-icon" aria-hidden="true">💬</div>
        <h4>24/7 Support</h4>
        <p>Always here to help</p>
      </div>
    </div>
  );

  // ============================================
  // COMPONENT: QuickActions
  // ============================================
  const QuickActions = ({ quickActions, completeQuickAction }) => (
    <div className="quick-actions-grid animate-on-scroll">
      {quickActions.map((action) => (
        <div 
          key={action.id} 
          className={`quick-action-card ${action.completed ? 'completed' : ''}`}
          role="listitem"
        >
          <span className="action-icon" aria-hidden="true">{action.icon}</span>
          <div className="action-content">
            <h4>{action.label}</h4>
            <p>{action.completed ? 'Completed! +10 points' : 'Earn 10 bonus points'}</p>
            {!action.completed && <span className="reward-badge">+10 pts</span>}
          </div>
          <button
            className="action-btn"
            onClick={() => completeQuickAction(action.id)}
            disabled={action.completed}
            aria-label={action.completed ? `${action.label} completed` : `Start ${action.label}`}
            aria-disabled={action.completed}
          >
            {action.completed ? '✓ Done' : 'Start'}
          </button>
        </div>
      ))}
    </div>
  );

  // ============================================
  // COMPONENT: GamificationSection
  // ============================================
  const GamificationSection = ({ gamificationStats, canClaimDailyReward }) => (
    <section className="gamification-section animate-on-scroll">
      <div className="gamification-grid">
        <div className="level-streak-card">
          <div className="level-header">
            <div className="level-icon" aria-hidden="true">⭐</div>
            <div>
              <div className="level-title">Level {gamificationStats.level}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.7)' }}>
                {gamificationStats.xp} / {gamificationStats.xpToNextLevel} XP
              </div>
            </div>
          </div>
          
          <div className="xp-info">
            <div className="xp-bar">
              <div 
                className="xp-progress"
                style={{ width: `${(gamificationStats.xp / gamificationStats.xpToNextLevel) * 100}%` }}
                role="progressbar"
                aria-valuenow={gamificationStats.xp}
                aria-valuemin={0}
                aria-valuemax={gamificationStats.xpToNextLevel}
                aria-label={`Experience points: ${gamificationStats.xp} of ${gamificationStats.xpToNextLevel}`}
              ></div>
            </div>
            <div className="xp-text">
              <span>XP Progress</span>
              <span>{Math.round((gamificationStats.xp / gamificationStats.xpToNextLevel) * 100)}%</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div className="streak-badge">
              🔥 {gamificationStats.currentStreak} day streak
            </div>
            {canClaimDailyReward && (
              <button 
                className="daily-reward-btn" 
                onClick={() => setShowDailyReward(true)}
                aria-label="Claim your daily reward"
              >
                🎁 Claim Daily Reward
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );

  // ============================================
  // COMPONENT: Footer
  // ============================================
  const Footer = ({ openWhatsAppSupport }) => (
    <footer className="dashboard-footer" role="contentinfo">
      <p>
        Need help?{' '}
        <button
          onClick={openWhatsAppSupport}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary-300)',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: 'inherit',
            transition: 'color 200ms ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = 'white'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-primary-300)'}
        >
          Contact Support
        </button>{' '}
        |{' '}
        <a href="/faq" style={{ color: 'var(--color-primary-300)', textDecoration: 'none' }}>
          FAQ
        </a>
      </p>
      <p className="footer-note">
        © {new Date().getFullYear()} SurveyEarn. All rights reserved.
      </p>
    </footer>
  );

  /* =========================
     RENDER LOADING & NO USER
  ========================= */
  if (loading) {
    return <DashboardSkeleton />;
  }
  
  if (!user) {
    return (
      <div className="no-user-container">
        <h2>Session Expired</h2>
        <p>Please log in again to access your dashboard.</p>
        <button 
          className="btn btn-primary btn-lg"
          onClick={() => navigate("/login")}
          style={{
            background: 'var(--gradient-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-3) var(--space-6)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-bold)',
            cursor: 'pointer',
            transition: 'all 200ms ease',
            minHeight: '48px',
            minWidth: '160px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.3)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard" ref={dashboardRef}>
      {/* Skip link for screen readers */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div 
          className="toast-notification" 
          role="alert" 
          aria-live="polite"
        >
          {toast}
        </div>
      )}

      {/* FULL SCREEN NOTIFICATION */}
      {fullScreenNotification && (
        <div 
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="modal-content">
            <div style={{
              fontSize: '48px',
              marginBottom: '16px',
              animation: 'pulse 2s infinite'
            }}>
              🎁
            </div>
            
            <h3 id="modal-title" style={{
              color: 'white',
              margin: '0 0 12px 0',
              fontSize: '24px',
              fontWeight: '800'
            }}>
              Welcome Bonus!
            </h3>
            
            <p style={{
              color: 'rgba(255, 255, 255, 0.95)',
              fontSize: '16px',
              lineHeight: '1.5',
              marginBottom: '24px'
            }}>
              {fullScreenNotification.message}
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {fullScreenNotification.redirect && (
                <button
                  onClick={() => {
                    setFullScreenNotification(null);
                    navigate(fullScreenNotification.redirect);
                  }}
                  className="btn btn-primary btn-lg"
                  style={{
                    background: 'var(--gradient-danger)',
                    borderRadius: '12px',
                    padding: '16px 24px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    border: '2px solid rgba(255, 255, 255, 0.5)',
                    transition: 'all 0.3s ease',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    minHeight: '48px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(220, 38, 38, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.3)';
                  }}
                >
                  <span style={{ fontSize: '20px' }}>🔓</span>
                  Activate Account Now
                </button>
              )}
              
              <button
                onClick={() => setFullScreenNotification(null)}
                className="btn btn-secondary"
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
                  backdropFilter: 'blur(10px)',
                  minHeight: '48px'
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
              marginTop: '24px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      {/* MAIN HEADER */}
      <Header
        user={user}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        openWhatsAppSupport={openWhatsAppSupport}
        activationRequests={activationRequests}
        navigate={navigate}
      />

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
      <section className="dashboard-section animate-on-scroll" aria-labelledby="live-feed-title">
        <Suspense fallback={<div className="skeleton skeleton-earning-card" style={{ height: '200px' }}></div>}>
          <LazyLiveWithdrawalFeed />
        </Suspense>
      </section>

      {/* HERO SECTION */}
      <main id="main-content">
        <section 
          className="hero-section animate-on-scroll" 
          aria-labelledby="hero-title"
        >
          <div className="hero-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <button 
                onClick={goToSurveys}
                className="hero-btn btn-primary"
                aria-label="Start earning with surveys"
              >
                <span className="btn-icon">🚀</span>
                Start Survey
              </button>
              
              <button 
                onClick={() => navigate('/affiliate')}
                className="hero-btn"
                aria-label="Invite friends and earn rewards"
                style={{
                  background: 'var(--gradient-warning)'
                }}
              >
                <span className="btn-icon">👥</span>
                Invite & Earn
              </button>
            </div>
            
            <BalanceCard
              stats={stats}
              onWithdraw={() => navigate("/withdraw-form")}
            />
          </div>
        </section>

        {/* WELCOME BONUS CARD */}
        <WelcomeBonusCard
          showWelcomeBonus={showWelcomeBonus}
          handleWelcomeBonusWithdraw={handleWelcomeBonusWithdraw}
          welcomeBonusAmount={welcomeBonusAmount}
        />

        {/* SURVEY PLANS SECTION */}
        <section 
          id="surveys-section"
          ref={surveysSectionRef}
          className="dashboard-section animate-on-scroll"
          aria-labelledby="plans-title"
        >
          <div className="section-heading">
            <h3 id="plans-title">Survey Plans Available</h3>
            <p>Complete surveys to earn money</p>
          </div>
          
          <SurveyPlans
            plans={PLANS}
            stats={stats}
            getPlanStatus={getPlanStatus}
            isActivated={isActivated}
            isCompleted={isCompleted}
            surveysDone={surveysDone}
            earnedSoFar={earnedSoFar}
            progressPercentage={progressPercentage}
            hasPendingActivation={hasPendingActivation}
            pendingWithdrawals={pendingWithdrawals}
            startSurvey={startSurvey}
            handleWithdrawClick={handleWithdrawClick}
            navigate={navigate}
          />
        </section>

        {/* STATS DASHBOARD */}
        <section className="dashboard-section animate-on-scroll" aria-labelledby="stats-title">
          <div className="section-heading">
            <h3 id="stats-title">Your Earnings</h3>
            <p>Real-time overview of your account</p>
          </div>
          
          <StatsDashboard stats={stats} />
        </section>

        {/* USER NOTIFICATIONS */}
        <section className="dashboard-section animate-on-scroll" aria-labelledby="notifications-title">
          <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: '300px' }}></div>}>
            <LazyUserNotifications />
          </Suspense>
        </section>

        {/* FEATURES & BENEFITS */}
        <section className="dashboard-section animate-on-scroll" aria-labelledby="features-title">
          <div className="section-heading">
            <h3 id="features-title">Why Choose SurveyEarn</h3>
            <p>Join thousands of earners worldwide</p>
          </div>
          
          <FeaturesSection />
        </section>

        {/* QUICK ACTIONS */}
        <section className="dashboard-section animate-on-scroll" aria-labelledby="actions-title">
          <div className="section-heading">
            <h3 id="actions-title">Quick Actions</h3>
            <p>Complete tasks to boost your earnings</p>
          </div>
          
          <QuickActions
            quickActions={quickActions}
            completeQuickAction={completeQuickAction}
          />
        </section>

        {/* TESTIMONIALS */}
        <section className="dashboard-section animate-on-scroll" aria-labelledby="success-title">
          <div className="section-heading">
            <h3 id="success-title">Community Success Stories</h3>
            <p>Real earnings from real members</p>
          </div>
          
          <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: '300px' }}></div>}>
            <LazyTestimonials variant="grid" />
          </Suspense>
        </section>

        {/* GAMIFICATION SECTION */}
        <GamificationSection
          gamificationStats={gamificationStats}
          canClaimDailyReward={canClaimDailyReward}
        />

        {/* ACHIEVEMENTS */}
        <section className="dashboard-section animate-on-scroll" aria-labelledby="achievements-title">
          <div className="section-heading">
            <h3 id="achievements-title">Your Achievements</h3>
            <p>Track your milestones</p>
          </div>
          
          <Suspense fallback={<div className="skeleton skeleton-card" style={{ height: '200px' }}></div>}>
            <LazyAchievements />
          </Suspense>
        </section>

        {/* FOOTER */}
        <Footer openWhatsAppSupport={openWhatsAppSupport} />
      </main>

      {/* BOTTOM NAVIGATION - Mobile First */}
      <BottomNavigation user={user} />

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