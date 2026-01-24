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
  const withdrawRef = useRef(null);
  const welcomeRef = useRef(null);

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
     WITHDRAW STATE
  ========================= */
  const [activeWithdrawPlan, setActiveWithdrawPlan] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawMessage, setWithdrawMessage] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
     HELPERS - USING OLD LOGIC
  ========================= */
  const surveysDone = (plan) => plans[plan]?.surveys_completed || 0;
  const isCompleted = (plan) => surveysDone(plan) >= TOTAL_SURVEYS;
  const isActivated = (plan) => plans[plan]?.is_activated === true;
  const activationSubmitted = (plan) => plans[plan]?.activation_status === "SUBMITTED";
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

  const goToWithdraw = () => {
    setActiveTab("WITHDRAW");
    setTimeout(() => {
      withdrawRef.current?.scrollIntoView({ 
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
     SURVEY ACTION - USING OLD LOGIC (DIRECT NAVIGATION)
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
     WITHDRAW LOGIC - USING OLD LOGIC
  ========================= */
  const handleWithdrawClick = (plan) => {
    setWithdrawError("");
    setWithdrawMessage("");

    if (!isCompleted(plan)) {
      setToast(`Complete ${TOTAL_SURVEYS - surveysDone(plan)} more surveys to withdraw`);
      goToSurveys();
      setTimeout(() => setToast(""), 4000);
      return;
    }

    if (!isActivated(plan)) {
      setFullScreenNotification({
        message: activationSubmitted(plan)
          ? "🎯 Activation submitted. Awaiting approval."
          : "🔒 Account not activated. Activate now to withdraw your earnings.",
        redirect: activationSubmitted(plan) ? null : "/activation-notice",
      });
      return;
    }

    setActiveWithdrawPlan(plan);
    setWithdrawAmount(PLANS[plan].total.toString());
  };

  const submitWithdraw = async () => {
    if (!withdrawAmount || !withdrawPhone) {
      setWithdrawError("Please enter amount and phone number");
      return;
    }

    const amount = Number(withdrawAmount);
    if (amount < 100) {
      setWithdrawError("Minimum withdrawal amount is KES 100");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/withdraw/request", {
        phone_number: withdrawPhone,
        amount: amount,
        type: activeWithdrawPlan,
      });

      setWithdrawMessage("🎉 Withdrawal submitted successfully! You'll receive payment within 24 hours.");

      const refreshed = await api.get("/auth/me");
      setUser(refreshed.data);
      setPlans(refreshed.data.plans || {});
      
      setTimeout(() => {
        setActiveWithdrawPlan("");
        setWithdrawAmount("");
        setWithdrawPhone("");
      }, 3000);
    } catch (err) {
      setWithdrawError(err.response?.data?.message || "Withdrawal failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     WELCOME BONUS
  ========================= */
  const handleWelcomeBonusWithdraw = () => {
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
    <div className="dashboard">
      {/* TOAST NOTIFICATION */}
      {toast && <Notifications message={toast} />}

      {/* FULL SCREEN NOTIFICATION */}
      {fullScreenNotification && (
        <div className="full-screen-notif">
          <div className="notif-content">
            <p>{fullScreenNotification.message}</p>
            {fullScreenNotification.redirect && (
              <button
                className="primary-btn"
                onClick={() => navigate(fullScreenNotification.redirect)}
              >
                Activate Account
              </button>
            )}
            <button
              className="secondary-btn"
              onClick={() => setFullScreenNotification(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MAIN MENU HEADER WITH DASHBOARD TITLE */}
      <header className="dashboard-main-header">
        <div className="header-title-container">
          <h1 className="dashboard-main-title">Dashboard</h1>
          <button className="menu-btn" onClick={() => setMenuOpen(true)}>
            <span className="menu-icon">☰</span>
          </button>
        </div>
        <p className="header-subtitle">Welcome back, {user.full_name.split(' ')[0]}!</p>
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

      {/* HERO SECTION - MOVED TO TOP */}
      <section className="dashboard-hero">
        <div className="hero-card">
          <div className="hero-content">
            <div className="hero-text">
              <h1>
                Welcome, <span className="user-highlight">{user.full_name.split(' ')[0]}</span>! 👋
              </h1>
              <p className="hero-subtitle">
                Complete surveys, earn instant rewards, and withdraw cash directly to your phone.
              </p>
              <div className="hero-actions">
                <button className="primary-btn" onClick={goToSurveys}>
                  Start Earning →
                </button>
                <button className="secondary-btn" onClick={goToWelcome}>
                  View Welcome Bonus
                </button>
              </div>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-value">KES {stats.availableBalance.toLocaleString()}</span>
                <span className="hero-stat-label">Available Now</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE WITHDRAWAL FEED */}
      <LiveWithdrawalFeed />

      {/* WELCOME BONUS CARD - PROFESSIONAL VERSION */}
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

      {/* QUICK STATS BAR */}
      <div className="quick-stats-bar">
        <div className="stat-item">
          <span className="stat-icon">💰</span>
          <span className="stat-value">KES {stats.totalEarned.toLocaleString()}</span>
          <span className="stat-label">Earned</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">📊</span>
          <span className="stat-value">{stats.totalSurveysCompleted}</span>
          <span className="stat-label">Surveys</span>
        </div>
        <div className="stat-item">
          <span className="stat-icon">💳</span>
          <span className="stat-value">{stats.totalWithdrawals}</span>
          <span className="stat-label">Withdrawals</span>
        </div>
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
            onClick={goToWithdraw}
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
                <button className="withdraw-quick-btn" onClick={goToWithdraw}>
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

          {/* PLAN PROGRESS - USING OLD LOGIC */}
          <section className="dashboard-section">
            <div className="section-heading">
              <h3>Plan Progress</h3>
              <p>Track your earnings across different plans</p>
            </div>
            <div className="progress-cards">
              {Object.entries(PLANS).map(([key, plan]) => {
                const status = getPlanStatus(key);
                
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
                              color: plan.color
                            }}
                          >
                            Withdraw
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

      {/* SURVEYS TAB - USING OLD LOGIC: "Start Survey" only when NOT completed */}
      {activeTab === "SURVEYS" && (
        <section ref={surveyRef} id="surveys-section" className="tab-section">
          <div className="section-heading">
            <h3>Available Survey Plans</h3>
            <p>Choose a plan that matches your earning goals</p>
          </div>
          
          <div className="plan-cards-container">
            {Object.entries(PLANS).map(([key, plan]) => {
              const status = getPlanStatus(key);
              const completed = isCompleted(key);
              
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
                    
                    <div className="plan-features">
                      <span className="feature-tag">📱 Mobile-Friendly</span>
                      <span className="feature-tag">⏱️ 5-10 Minutes</span>
                      <span className="feature-tag">💯 Guaranteed Payment</span>
                    </div>
                  </div>
                  
                  <div className="plan-card-footer">
                    {!completed ? (
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
                            background: plan.gradient,
                            boxShadow: `0 5px 20px ${plan.color}40`
                          }}
                        >
                          💸 Withdraw KES {plan.total}
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

      {/* WITHDRAW TAB - USING OLD LOGIC */}
      {activeTab === "WITHDRAW" && (
        <section ref={withdrawRef} id="withdraw-section" className="tab-section">
          <div className="section-heading">
            <h3>Withdraw Your Earnings</h3>
            <p>Get paid directly to your mobile money account</p>
          </div>
          
          <div className="withdraw-cards-container">
            {Object.entries(PLANS).map(([key, plan]) => {
              const completed = isCompleted(key);
              const activated = isActivated(key);
              
              return (
                <div key={key} className={`withdraw-card ${completed ? 'completed' : ''}`} style={{
                  borderColor: plan.borderColor,
                  background: `linear-gradient(135deg, ${plan.bgColor}, rgba(255, 255, 255, 0.03))`,
                  boxShadow: `0 10px 30px ${plan.color}20`
                }}>
                  <div className="withdraw-card-header">
                    <span className="plan-icon">{plan.icon}</span>
                    <div className="plan-info">
                      <h4 style={{ color: plan.color }}>{plan.name} Plan</h4>
                      <p className="plan-earnings">KES {earnedSoFar(key)} earned</p>
                    </div>
                    <span className={`status-indicator ${completed ? 'ready' : 'pending'}`}>
                      {completed ? '✅ Ready' : '⏳ Pending'}
                    </span>
                  </div>
                  
                  <div className="withdraw-card-body">
                    <div className="progress-summary">
                      <div className="progress-row">
                        <span>Surveys Completed:</span>
                        <strong>{surveysDone(key)}/{TOTAL_SURVEYS}</strong>
                      </div>
                      <div className="progress-row">
                        <span>Available Amount:</span>
                        <strong className="available-amount">KES {completed ? plan.total : earnedSoFar(key)}</strong>
                      </div>
                    </div>
                    
                    <div className="withdraw-requirements">
                      {!completed && (
                        <p className="requirement">
                          📝 Complete {TOTAL_SURVEYS - surveysDone(key)} more surveys to withdraw
                        </p>
                      )}
                      {completed && !activated && (
                        <p className="requirement">
                          🔓 Account activation required to withdraw
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="withdraw-card-footer">
                    <button 
                      className={`withdraw-btn ${completed && activated ? 'ready' : 'disabled'}`}
                      onClick={() => handleWithdrawClick(key)}
                      disabled={!completed || !activated}
                      style={{
                        background: completed && activated ? plan.gradient : 'rgba(255, 255, 255, 0.1)',
                        color: completed && activated ? 'white' : 'rgba(255, 255, 255, 0.5)',
                        boxShadow: completed && activated ? `0 5px 20px ${plan.color}40` : 'none'
                      }}
                    >
                      {!completed ? 'Complete Surveys First' :
                       !activated ? 'Activate Account' :
                       `Withdraw KES ${plan.total}`}
                    </button>
                    
                    {!completed && (
                      <button className="complete-surveys-btn" onClick={goToSurveys}>
                        Complete Surveys →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* WITHDRAW FORM */}
          {activeWithdrawPlan && (
            <div className="withdraw-form-container">
              <div className="card withdraw-form">
                <div className="withdraw-form-header">
                  <h4>Withdraw {PLANS[activeWithdrawPlan].name} Earnings</h4>
                  <p>Enter your details to receive payment</p>
                </div>
                
                {withdrawMessage && (
                  <div className="success-message">
                    <span className="success-icon">✅</span>
                    <p>{withdrawMessage}</p>
                  </div>
                )}
                
                {withdrawError && (
                  <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    <p>{withdrawError}</p>
                  </div>
                )}

                <div className="form-group">
                  <label>Amount to Withdraw (KES)</label>
                  <div className="amount-input-group">
                    <span className="amount-prefix">KES</span>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      min="100"
                      max={PLANS[activeWithdrawPlan].total}
                    />
                  </div>
                  <div className="amount-helper">
                    Available: KES {PLANS[activeWithdrawPlan].total}
                    <button 
                      type="button" 
                      className="use-max-btn"
                      onClick={() => setWithdrawAmount(PLANS[activeWithdrawPlan].total.toString())}
                    >
                      Use Max
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Phone Number (M-Pesa)</label>
                  <input
                    type="tel"
                    placeholder="07XX XXX XXX"
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                  />
                  <p className="input-helper">Enter your Safaricom M-Pesa number</p>
                </div>

                <div className="withdrawal-info">
                  <div className="info-item">
                    <span className="info-icon">⏱️</span>
                    <span>Processing Time: 5-30 minutes</span>
                  </div>
                  <div className="info-item">
                    <span className="info-icon">💳</span>
                    <span>Minimum: KES 100</span>
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    className="primary-btn" 
                    onClick={submitWithdraw} 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner"></span>
                        Processing...
                      </>
                    ) : (
                      'Confirm Withdrawal'
                    )}
                  </button>
                  <button 
                    className="secondary-btn" 
                    onClick={() => setActiveWithdrawPlan("")}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* FOOTER */}
      <footer className="dashboard-footer">
        <p>Need help? <a href="/support">Contact Support</a> | <a href="/faq">FAQ</a></p>
        <p className="footer-note">© {new Date().getFullYear()} SurveyEarn. All rights reserved.</p>
      </footer>
    </div>
  );
}