// ========================= Dashboard.jsx =========================
// Professional Survey App Dashboard with Sidebar Layout
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
    color: "#38bdf8",
    gradient: "linear-gradient(135deg, #38bdf8, #0ea5e9)",
    borderColor: "rgba(56, 189, 248, 0.2)",
    bgColor: "rgba(56, 189, 248, 0.05)",
    description: "Perfect for beginners",
    totalColor: "#FF4500 !important",
    totalGlow: "0 0 20px #FF4500, 0 0 40px #FF8C00"
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
    totalColor: "#FFA500 !important",
    totalGlow: "0 0 20px #FFA500, 0 0 40px #FFD700"
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
    totalColor: "#FFD700 !important",
    totalGlow: "0 0 20px #FFD700, 0 0 40px #FFA500"
  },
};
const TOTAL_SURVEYS = 10;
const APP_VERSION = "1.3.0";

const getInitialTheme = () => {
  if (typeof window !== 'undefined' && localStorage.getItem('theme')) {
    return localStorage.getItem('theme');
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

// Navigation items for sidebar
const navItems = [
  { id: "home", label: "Home", icon: "🏠", active: true },
  { id: "surveys", label: "My Surveys", icon: "📝", active: false },
  { id: "earnings", label: "Earnings", icon: "💰", active: false },
  { id: "withdraw", label: "Withdraw", icon: "🏦", active: false },
  { id: "referral", label: "Referral", icon: "👥", active: false },
  { id: "leaderboard", label: "Leaderboard", icon: "🏆", active: false },
  { id: "settings", label: "Settings", icon: "⚙️", active: false },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const surveyRef = useRef(null);
  const welcomeRef = useRef(null);
  const dashboardRef = useRef(null);

  // UI STATE
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [theme, setTheme] = useState(getInitialTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState("home");
  const [stats, setStats] = useState({
    totalEarned: 0,
    availableBalance: 0,
    affiliateEarnings: 0,
    totalSurveysCompleted: 0,
    totalWithdrawals: 0
  });

  // DATA STATE
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState({});
  const [quickActions, setQuickActions] = useState([
    { id: 1, label: "Complete Profile", icon: "👤", completed: false },
    { id: 2, label: "Verify Email", icon: "📧", completed: false },
    { id: 3, label: "Invite Friends", icon: "👥", completed: false },
  ]);

  // WITHDRAW STATE
  const [pendingWithdrawals, setPendingWithdrawals] = useState({});
  const [fullScreenNotification, setFullScreenNotification] = useState(null);

  // GAMIFICATION STATE
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

  // Recent activity state
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: "survey", title: "Survey Completed", description: "Regular Plan - Survey #5", amount: "+150 KSh", time: "2 hours ago", icon: "📝" },
    { id: 2, type: "referral", title: "Referral Bonus", description: "New user signed up", amount: "+200 KSh", time: "5 hours ago", icon: "👥" },
    { id: 3, type: "withdraw", title: "Withdrawal", description: "Sent to M-Pesa", amount: "-500 KSh", time: "1 day ago", icon: "🏦" },
  ]);

  // Top surveyors data
  const [topSurveyors, setTopSurveyors] = useState([
    { id: 1, name: "John D.", surveys: 45, earnings: "12,500", avatar: "👨" },
    { id: 2, name: "Sarah M.", surveys: 42, earnings: "11,800", avatar: "👩" },
    { id: 3, name: "Mike R.", surveys: 38, earnings: "10,200", avatar: "👨‍💼" },
    { id: 4, name: "Emily K.", surveys: 35, earnings: "9,500", avatar: "👩‍💻" },
    { id: 5, name: "David L.", surveys: 32, earnings: "8,900", avatar: "👨‍💻" },
  ]);

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
        
        // Calculate stats
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
     GAMIFICATION - CHECK WELCOME BONUS
   ========================= */
  useEffect(() => {
    const showWelcomeBonus = localStorage.getItem("showWelcomeBonus");
    const bonusAmount = localStorage.getItem("welcomeBonusAmount");
    
    if (showWelcomeBonus === "true") {
      setWelcomeBonusAmount(bonusAmount ? parseInt(bonusAmount) : 1200);
      setShowWelcomeBonus(true);
      localStorage.removeItem("showWelcomeBonus");
      localStorage.removeItem("welcomeBonusAmount");
    }
  }, []);

  const handleWelcomeBonusClose = () => {
    setShowWelcomeBonus(false);
    setTimeout(() => {
      const checkAndShowDailyReward = async () => {
        try {
          const response = await gamificationApi.checkDailyReward();
          if (response.data.can_claim) {
            setCanClaimDailyReward(true);
            setShowDailyReward(true);
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

  const getPlanStatus = (plan) => {
    if (isCompleted(plan)) return { status: "completed", label: "Ready to Withdraw", icon: "✅" };
    if (surveysDone(plan) > 0) return { status: "in-progress", label: "In Progress", icon: "⏳" };
    return { status: "not-started", label: "Start Earning", icon: "🚀" };
  };

  /* =========================
     NAVIGATION
   ========================= */
  const handleNavClick = (navId) => {
    setActiveNav(navId);
    switch(navId) {
      case "home":
        navigate("/dashboard");
        break;
      case "surveys":
        navigate("/surveys");
        break;
      case "earnings":
        navigate("/affiliate");
        break;
      case "withdraw":
        navigate("/withdraw");
        break;
      case "referral":
        navigate("/affiliate");
        break;
      case "leaderboard":
        navigate("/dashboard");
        break;
      case "settings":
        navigate("/dashboard");
        break;
      default:
        break;
    }
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
     WITHDRAW LOGIC
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

    const earned = earnedSoFar(plan);
    if (earned <= 0) {
      setToast("No earnings available to withdraw");
      return;
    }

    try {
      await api.post("/withdraw/create", {
        amount: earned,
        type: plan,
        payment_method: "mpesa"
      });
      setToast("Withdrawal request submitted!");
      loadPendingWithdrawals();
      goToWelcome();
    } catch (err) {
      setToast(err.response?.data?.message || "Withdrawal failed");
    }
    setTimeout(() => setToast(""), 4000);
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Get user display name
  const getUserName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return "User";
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* ========================= SIDEBAR ========================= */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-icon">📊</span>
            {sidebarOpen && <span className="logo-text">SurveyPro</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-plan-badge">
            <span className="plan-icon">⭐</span>
            {sidebarOpen && <span className="plan-name">Regular Plan</span>}
          </div>
        </div>
      </aside>

      {/* ========================= MAIN CONTENT ========================= */}
      <main className="dashboard-main">
        {/* Top Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <button className="menu-toggle" onClick={toggleSidebar}>
              <span className="hamburger">☰</span>
            </button>
            <h1 className="header-title">Dashboard</h1>
          </div>

          <div className="header-right">
            <div className="header-stats">
              <div className="header-stat">
                <span className="stat-label">Level</span>
                <span className="stat-value">{gamificationStats.level}</span>
              </div>
              <div className="header-stat">
                <span className="stat-label">Streak</span>
                <span className="stat-value">🔥 {gamificationStats.currentStreak}</span>
              </div>
            </div>
            <button className="notification-btn">
              <span>🔔</span>
              <span className="notification-badge">3</span>
            </button>
            <div className="user-profile">
              <div className="user-avatar">👤</div>
              <div className="user-info">
                <span className="user-name">{getUserName()}</span>
                <span className="user-email">{user?.email || 'user@example.com'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="dashboard-content">
          {/* Welcome Section */}
          <section className="welcome-section">
            <div className="welcome-text">
              <h2>{getGreeting()} 👋</h2>
              <p>Here's what's happening with your surveys today</p>
            </div>
            <div className="welcome-date">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </section>

          {/* Stats Cards */}
          <section className="stats-cards-grid">
            <div className="stat-card total-earnings">
              <div className="stat-card-icon">💰</div>
              <div className="stat-card-content">
                <span className="stat-card-label">Total Earnings</span>
                <span className="stat-card-value">KSh {stats.totalEarned.toLocaleString()}</span>
              </div>
              <div className="stat-card-trend positive">+12.5%</div>
            </div>

            <div className="stat-card surveys-completed">
              <div className="stat-card-icon">📝</div>
              <div className="stat-card-content">
                <span className="stat-card-label">Surveys Completed</span>
                <span className="stat-card-value">{stats.totalSurveysCompleted}</span>
              </div>
              <div className="stat-card-trend positive">+5</div>
            </div>

            <div className="stat-card points-balance">
              <div className="stat-card-icon">🎯</div>
              <div className="stat-card-content">
                <span className="stat-card-label">Points Balance</span>
                <span className="stat-card-value">{stats.availableBalance * 10}</span>
              </div>
              <div className="stat-card-trend">Pending</div>
            </div>

            <div className="stat-card referral-earnings">
              <div className="stat-card-icon">👥</div>
              <div className="stat-card-content">
                <span className="stat-card-label">Referral Earnings</span>
                <span className="stat-card-value">KSh {stats.affiliateEarnings.toLocaleString()}</span>
              </div>
              <div className="stat-card-trend positive">+8.3%</div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="quick-actions-section">
            <h3 className="section-title">Quick Actions</h3>
            <div className="quick-actions-row">
              <button className="quick-action-btn primary" onClick={goToSurveys}>
                <span className="action-icon">📝</span>
                <span className="action-text">Start Survey</span>
              </button>
              <button className="quick-action-btn success" onClick={() => navigate('/withdraw')}>
                <span className="action-icon">💳</span>
                <span className="action-text">Withdraw</span>
              </button>
              <button className="quick-action-btn accent" onClick={() => navigate('/affiliate')}>
                <span className="action-icon">📤</span>
                <span className="action-text">Invite Friends</span>
              </button>
            </div>
          </section>

          {/* Main Content Grid */}
          <div className="content-grid">
            {/* Recent Activity */}
            <section className="recent-activity-section">
              <div className="section-header">
                <h3 className="section-title">Recent Activity</h3>
                <button className="view-all-btn">View All →</button>
              </div>
              <div className="activity-list">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">{activity.icon}</div>
                    <div className="activity-content">
                      <span className="activity-title">{activity.title}</span>
                      <span className="activity-description">{activity.description}</span>
                    </div>
                    <div className="activity-meta">
                      <span className={`activity-amount ${activity.type === 'withdraw' ? 'negative' : 'positive'}`}>
                        {activity.amount}
                      </span>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Top Surveyors / Leaderboard */}
            <section className="leaderboard-section">
              <div className="section-header">
                <h3 className="section-title">🏆 Top Surveyors</h3>
                <button className="view-all-btn">View All →</button>
              </div>
              <div className="leaderboard-list">
                {topSurveyors.map((surveyor, index) => (
                  <div key={surveyor.id} className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}>
                    <div className="rank">
                      {index === 0 && <span className="gold">🥇</span>}
                      {index === 1 && <span className="silver">🥈</span>}
                      {index === 2 && <span className="bronze">🥉</span>}
                      {index > 2 && <span className="rank-number">{index + 1}</span>}
                    </div>
                    <div className="surveyor-avatar">{surveyor.avatar}</div>
                    <div className="surveyor-info">
                      <span className="surveyor-name">{surveyor.name}</span>
                      <span className="surveyor-stats">{surveyor.surveys} surveys</span>
                    </div>
                    <div className="surveyor-earnings">KSh {surveyor.earnings}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Progress Section */}
          <section className="progress-section">
            <h3 className="section-title">Your Survey Progress</h3>
            <div className="plans-progress-grid">
              {Object.keys(PLANS).map((planKey) => {
                const plan = PLANS[planKey];
                const status = getPlanStatus(planKey);
                return (
                  <div key={planKey} className="plan-progress-card">
                    <div className="plan-header">
                      <span className="plan-icon">{plan.icon}</span>
                      <span className="plan-name">{plan.name}</span>
                      <span className={`plan-status ${status.status}`}>{status.icon} {status.label}</span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${progressPercentage(planKey)}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{surveysDone(planKey)}/{TOTAL_SURVEYS}</span>
                    </div>
                    <div className="plan-earnings">
                      <span className="earned">KSh {earnedSoFar(planKey).toLocaleString()}</span>
                      <span className="total">/ KSh {plan.total.toLocaleString()}</span>
                    </div>
                    {!isCompleted(planKey) && !isActivated(planKey) && (
                      <button className="activate-btn" onClick={() => navigate(`/activate?plan=${planKey}`)}>
                        🔓 Activate - KSh {PLANS[planKey].perSurvey * 10}
                      </button>
                    )}
                    {!isCompleted(planKey) && isActivated(planKey) && (
                      <button className="continue-btn" onClick={() => startSurvey(planKey)}>
                        Continue Survey →
                      </button>
                    )}
                    {isCompleted(planKey) && (
                      <button className="withdraw-btn" onClick={() => handleWithdrawClick(planKey)}>
                        💰 Withdraw KSh {earnedSoFar(planKey).toLocaleString()}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="toast-notification">
          {toast}
        </div>
      )}

      {/* Popups */}
      {showWelcomeBonus && (
        <WelcomeBonusPopup 
          amount={welcomeBonusAmount} 
          onClose={handleWelcomeBonusClose} 
        />
      )}

      {showDailyReward && (
        <DailyRewardPopup 
          onClose={() => setShowDailyReward(false)}
          onClaimed={handleDailyRewardClaimed}
          canClaim={canClaimDailyReward}
        />
      )}

      {/* Mobile Menu Drawer */}
      <MainMenuDrawer 
        isOpen={menuOpen} 
        onClose={() => setMenuOpen(false)} 
        user={user}
      />
    </div>
  );
}
