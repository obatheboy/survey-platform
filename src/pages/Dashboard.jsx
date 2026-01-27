// ========================= Dashboard.jsx =========================
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { queueWithdrawRequest, canMakeRequest } from "../api/api";
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
     WITHDRAW STATE - ENHANCED
  ========================= */
  const [activeWithdrawPlan, setActiveWithdrawPlan] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawMessage, setWithdrawMessage] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fullScreenNotification, setFullScreenNotification] = useState(null);
  
  // Enhanced withdrawal tracking per plan
  const [pendingWithdrawals, setPendingWithdrawals] = useState({});
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);

  /* =========================
     LOAD DASHBOARD + WITHDRAWAL STATUS
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

        // Load withdrawal history
        loadWithdrawalHistory();

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
     RESET SUBMITTING STATE ON MOUNT
  ========================= */
  useEffect(() => {
    // Reset submitting state on component mount to prevent stuck states
    setSubmitting(false);
  }, []);

  /* =========================
     LOAD WITHDRAWAL HISTORY
  ========================= */
  const loadWithdrawalHistory = async () => {
    try {
      const res = await api.get("/withdraw/history");
      setWithdrawalHistory(res.data || []);
      
      // Track pending withdrawals per plan
      const pending = {};
      (res.data || []).forEach(w => {
        if (w.status === "PENDING" || w.status === "PROCESSING") {
          // Generate a consistent referral code for this withdrawal
          const code = w.referral_code || Math.random().toString(36).substring(2, 8).toUpperCase();
          pending[w.type] = {
            ...w,
            referral_code: code,
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
     HELPERS - USING OLD LOGIC
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
     WITHDRAW LOGIC - ENHANCED TO ALWAYS SHOW REFERRAL FLOW FOR PENDING WITHDRAWALS
  ========================= */
  const handleWithdrawClick = async (plan) => {
    // ✅ ADDED: Debounce protection
    const now = Date.now();
    const lastClickTime = localStorage.getItem(`lastWithdrawClick_${plan}`);
    if (lastClickTime && (now - parseInt(lastClickTime)) < 2000) { // 2 seconds cooldown
      setToast("Please wait before clicking again");
      setTimeout(() => setToast(""), 3000);
      return;
    }
    localStorage.setItem(`lastWithdrawClick_${plan}`, now.toString());

    setWithdrawError("");
    setWithdrawMessage("");

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

    // ✅ CRITICAL FIX: ALWAYS show sharing interface if there's a pending withdrawal
    if (pendingWithdrawals[plan]) {
      setActiveWithdrawPlan(plan);
      setWithdrawAmount(PLANS[plan].total.toString());
      
      goToWithdraw();
      setTimeout(() => {
        withdrawRef.current?.scrollIntoView({ 
          behavior: "smooth", 
          block: "start" 
        });
      }, 100);
      return;
    }

    // Only show withdraw form if account is activated and no pending withdrawal
    setActiveWithdrawPlan(plan);
    setWithdrawAmount(PLANS[plan].total.toString());
    goToWithdraw();
  };

  const submitWithdraw = async () => {
    // ✅ ADDED: Prevent multiple submissions
    if (submitting) {
      setWithdrawError("Please wait, processing your previous request...");
      return;
    }

    // ✅ ADDED: Rate limiting protection using utility from api.js
    if (!canMakeRequest('withdraw', 10000)) { // 10 seconds cooldown
      setWithdrawError("Please wait 10 seconds before making another withdrawal request.");
      return;
    }

    // ✅ CRITICAL FIX: Instead of showing error, show the sharing interface
    if (pendingWithdrawals[activeWithdrawPlan]) {
      setWithdrawMessage("Your withdrawal is already pending. Share your referral link to speed up processing!");
      
      setTimeout(() => {
        if (withdrawRef.current) {
          withdrawRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
      return;
    }

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
    setWithdrawError("");
    setWithdrawMessage("");
    
    try {
      // ✅ FIXED: Use queued request to prevent simultaneous calls
      const res = await queueWithdrawRequest(() => 
        api.post("/withdraw/request", {
          phone_number: withdrawPhone,
          amount: amount,
          type: activeWithdrawPlan, // This should match REGULAR, VIP, VVIP
        })
      );

      // ✅ FIXED: Use the ID from backend response (with fallback)
      const withdrawalId = res.data?.id || `temp_${Date.now()}`;
      
      // ✅ FIXED: Use referral code from backend if available, otherwise generate
      const code = res.data?.referral_code || Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // ✅ FIXED: Update pending withdrawals with correct data from backend
      const newWithdrawal = {
        id: withdrawalId,
        type: activeWithdrawPlan,
        amount: amount,
        phone_number: withdrawPhone,
        referral_code: code,
        share_count: 0,
        status: res.data?.status || "PROCESSING",
        created_at: new Date().toISOString(),
        fee: res.data?.fee || 0,
        net_amount: res.data?.net_amount || amount
      };
      
      setPendingWithdrawals(prev => ({
        ...prev,
        [activeWithdrawPlan]: newWithdrawal
      }));
      
      // ✅ FIXED: Delay history reload to prevent rate limiting
      setTimeout(async () => {
        try {
          await loadWithdrawalHistory();
        } catch (historyErr) {
          console.warn("Failed to load withdrawal history:", historyErr);
          // Don't show error to user - this is a background refresh
        }
      }, 1500); // 1.5 second delay
      
      setWithdrawMessage("✅ Withdrawal submitted! Share your referral link with 3+ people to speed up processing.");
      
      // Clear form inputs
      setWithdrawPhone("");
      
      // Auto-scroll to show the sharing interface
      setTimeout(() => {
        if (withdrawRef.current) {
          withdrawRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    } catch (err) {
      // ✅ FIXED: Enhanced error handling with better messages
      if (err.isRateLimit) {
        setWithdrawError(`⏳ Too many requests! Please wait ${err.retryAfter || 60} seconds before trying again.`);
      } else if (err.response?.status === 429) {
        if (err.response?.data?.message?.includes("Daily withdrawal limit")) {
          setWithdrawError("📅 Daily withdrawal limit reached. Please try again tomorrow.");
        } else {
          setWithdrawError("⏳ Too many withdrawal requests. Please wait 2 minutes before trying again.");
        }
      } else if (err.response?.status === 409) {
        // Conflict error - already has pending withdrawal
        setWithdrawError(err.response?.data?.message || "You already have a withdrawal pending for this plan.");
        
        // Even though error, still show the sharing interface
        setTimeout(() => {
          if (withdrawRef.current) {
            withdrawRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      } else if (err.response?.status === 403) {
        setWithdrawError(err.response?.data?.message || "Account not activated or insufficient surveys completed.");
      } else if (err.response?.status === 400) {
        setWithdrawError(err.response?.data?.message || "Invalid request. Please check your inputs.");
      } else {
        setWithdrawError(err.response?.data?.message || "Withdrawal failed. Please try again.");
      }
      
      console.error("Withdrawal error:", err.response?.data || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Sharing functions
  const shareToWhatsApp = (plan) => {
    const withdrawal = pendingWithdrawals[plan];
    if (!withdrawal) return;
    
    const text = `Hey! I'm earning money on the Survey App. Join me and complete surveys to earn cash! 🎉\n\nDownload now: ${window.location.origin}\n\nCode: ${withdrawal.referral_code}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    incrementShareCount(plan);
  };

  const shareToEmail = (plan) => {
    const withdrawal = pendingWithdrawals[plan];
    if (!withdrawal) return;
    
    const text = `Hey! I'm earning money on the Survey App. Join me and complete surveys to earn cash! You can use my referral code: ${withdrawal.referral_code}`;
    window.location.href = `mailto:?subject=Join Survey App&body=${encodeURIComponent(text)}`;
    incrementShareCount(plan);
  };

  const shareToSMS = (plan) => {
    const withdrawal = pendingWithdrawals[plan];
    if (!withdrawal) return;
    
    const text = `Hi! Join me on Survey App and earn money. Code: ${withdrawal.referral_code} ${window.location.origin}`;
    window.location.href = `sms:?body=${encodeURIComponent(text)}`;
    incrementShareCount(plan);
  };

  const copyLink = (plan) => {
    const withdrawal = pendingWithdrawals[plan];
    if (!withdrawal) return;
    
    const text = `Survey App Referral - Code: ${withdrawal.referral_code} - ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setWithdrawMessage("✓ Referral link copied!");
    setTimeout(() => setWithdrawMessage(""), 3000);
    incrementShareCount(plan);
  };

  const incrementShareCount = (plan) => {
    setPendingWithdrawals(prev => {
      const withdrawal = prev[plan];
      if (!withdrawal) return prev;
      
      const newCount = (withdrawal.share_count || 0) + 1;
      const updatedWithdrawal = {
        ...withdrawal,
        share_count: newCount,
        status: newCount >= 3 ? "PENDING" : "PROCESSING"
      };
      
      if (newCount >= 3) {
        setWithdrawMessage("✓ Shared to 3+ members! Your payment will be processed soon.");
      }
      
      return {
        ...prev,
        [plan]: updatedWithdrawal
      };
    });
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
              onClick={goToWithdraw}
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

      {/* WELCOME BONUS CARD */}
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
                          ⏳ Withdrawal Pending - Click to Share & Speed Up!
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
                             hasPending ? '📤 View Withdrawal' : 'Withdraw'}
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
                        ⏳ Withdrawal Pending - Click "View Withdrawal" to Share!
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
                           hasPending ? '📤 View Withdrawal Status' :
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

 {/* WITHDRAW TAB - ENHANCED */}
{activeTab === "WITHDRAW" && (
  <section ref={withdrawRef} id="withdraw-section" className="tab-section">
    <div className="section-heading">
      <h3>Withdraw Your Earnings</h3>
      <p>Get paid directly to your mobile money account</p>
    </div>
    
    {/* ADDED: Go to Dashboard Button */}
    <div style={{
      marginBottom: '20px',
      textAlign: 'center'
    }}>
      <button 
        onClick={() => {
          setActiveTab("OVERVIEW");
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          padding: '0.8rem 1.5rem',
          fontSize: '1rem',
          fontWeight: '700',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.6)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        }}
      >
        <span>📊</span> Go to Dashboard
      </button>
    </div>
    
    <div className="withdraw-cards-container">
      {Object.entries(PLANS).map(([key, plan]) => {
        const activated = isActivated(key);
        const pending = pendingWithdrawals[key];
        
        return (
          <div key={key} className={`withdraw-card ${isCompleted(key) ? 'completed' : ''}`} style={{
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
              <span className={`status-indicator ${
                pending ? 'pending' : isCompleted(key) ? 'ready' : 'not-ready'
              }`}>
                {pending ? '⏳ Pending' : isCompleted(key) ? '✅ Ready' : '🔒 Locked'}
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
                  <strong className="available-amount">KES {isCompleted(key) ? plan.total : earnedSoFar(key)}</strong>
                </div>
                {pending && (
                  <div className="progress-row">
                    <span>Status:</span>
                    <strong style={{ color: '#f59e0b' }}>{pending.status}</strong>
                  </div>
                )}
              </div>
              
              <div className="withdraw-requirements">
                {!isCompleted(key) && (
                  <p className="requirement">
                    📝 Complete {TOTAL_SURVEYS - surveysDone(key)} more surveys to withdraw
                  </p>
                )}
                {isCompleted(key) && !activated && !pending && (
                  <p className="requirement">
                    🔓 Account activation required to withdraw
                  </p>
                )}
                {pending && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: 'rgba(251, 191, 36, 0.15)',
                    border: '2px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: '#f59e0b',
                    textAlign: 'center'
                  }}>
                    🚀 Share your referral link to 3+ people to speed up withdrawal!
                  </div>
                )}
              </div>
            </div>
            
            <div className="withdraw-card-footer">
              <button 
                className={`withdraw-btn ${isCompleted(key) ? 'ready' : 'disabled'}`}
                onClick={() => handleWithdrawClick(key)}
                disabled={!isCompleted(key)}
                style={{
                  background: isCompleted(key) && activated ? plan.gradient : 
                             isCompleted(key) ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                             'rgba(255, 255, 255, 0.1)',
                  color: isCompleted(key) ? 'white' : 'rgba(255, 255, 255, 0.5)',
                  boxShadow: isCompleted(key) ? `0 5px 20px ${plan.color}40` : 'none',
                  cursor: isCompleted(key) ? 'pointer' : 'not-allowed'
                }}
              >
                {!isCompleted(key) ? 'Complete Surveys First' :
                 !activated ? '🔓 Activate to Withdraw' :
                 pending ? '📤 Manage Withdrawal' :
                 `Withdraw KES ${plan.total}`}
              </button>
              
              {!isCompleted(key) && (
                <button className="complete-surveys-btn" onClick={goToSurveys}>
                  Complete Surveys →
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>

    {/* FIX: Only show withdrawal submitted section if there's a pending withdrawal AND we're not in modal form view */}
    {Object.keys(pendingWithdrawals).length > 0 && !activeWithdrawPlan && (
      <div className="withdrawal-submitted-section" style={{ 
        marginTop: '32px',
        animation: 'fadeIn 0.5s ease'
      }}>
        <div className="card withdrawal-submitted-card">
          {/* Success Header with Celebration */}
          <div className="withdrawal-success-header">
            <div style={{
              position: 'relative',
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
              animation: 'pulse 2s infinite'
            }}>
              <span style={{ fontSize: '40px' }}>🎉</span>
              <div style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'white',
                boxShadow: '0 3px 10px rgba(245, 158, 11, 0.4)'
              }}>
                ✓
              </div>
            </div>
            
            <h3 style={{ 
              textAlign: 'center', 
              color: '#10b981', 
              marginBottom: '8px',
              fontSize: '28px',
              fontWeight: '800'
            }}>
              Withdrawal Submitted Successfully!
            </h3>
            <p style={{ 
              textAlign: 'center', 
              fontSize: '16px',
              lineHeight: '1.6',
              marginBottom: '24px',
              fontWeight: '600',
              color: '#4b5563'
            }}>
              Your request is being processed. <strong style={{ color: '#f59e0b' }}>Share your referral link to speed up payment!</strong>
            </p>
          </div>

          {/* Show all pending withdrawals */}
          {Object.entries(pendingWithdrawals).map(([plan, withdrawal]) => {
            if (!withdrawal || (withdrawal.status === "APPROVED" || withdrawal.status === "REJECTED")) return null;
            
            return (
              <div key={plan} style={{ 
                marginBottom: '32px',
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.02))',
                border: '2px solid rgba(16, 185, 129, 0.1)',
                borderRadius: '16px'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    background: 'white',
                    padding: '12px',
                    borderRadius: '12px',
                    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '4px',
                      fontWeight: '600'
                    }}>Plan</div>
                    <div style={{
                      fontSize: '18px',
                      color: PLANS[plan]?.color || '#10b981',
                      fontWeight: '800'
                    }}>{PLANS[plan]?.name || plan} Plan</div>
                  </div>
                  
                  <div style={{
                    background: 'white',
                    padding: '12px',
                    borderRadius: '12px',
                    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '4px',
                      fontWeight: '600'
                    }}>Amount</div>
                    <div style={{
                      fontSize: '18px',
                      color: '#10b981',
                      fontWeight: '800'
                    }}>KES {withdrawal.amount?.toLocaleString()}</div>
                  </div>
                  
                  <div style={{
                    background: 'white',
                    padding: '12px',
                    borderRadius: '12px',
                    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '4px',
                      fontWeight: '600'
                    }}>Status</div>
                    <div style={{
                      fontSize: '18px',
                      color: '#f59e0b',
                      fontWeight: '800'
                    }}>{withdrawal.status}</div>
                  </div>
                  
                  <div style={{
                    background: 'white',
                    padding: '12px',
                    borderRadius: '12px',
                    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.05)'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '4px',
                      fontWeight: '600'
                    }}>Shares</div>
                    <div style={{
                      fontSize: '18px',
                      color: (withdrawal.share_count || 0) >= 3 ? '#10b981' : '#f59e0b',
                      fontWeight: '800'
                    }}>{withdrawal.share_count || 0}/3</div>
                  </div>
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button 
                    onClick={() => {
                      setActiveWithdrawPlan(plan);
                      // Scroll to ensure the modal is visible
                      setTimeout(() => {
                        if (withdrawRef.current) {
                          withdrawRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontSize: '16px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.6)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>📤</span>
                    Manage This Withdrawal
                  </button>
                </div>
              </div>
            );
          })}
          
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(30, 64, 175, 0.05))',
            border: '2px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <h4 style={{ 
              margin: '0 0 16px', 
              fontSize: '18px',
              fontWeight: '800',
              color: '#3b82f6'
            }}>
              📝 What Happens Next?
            </h4>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ 
                  fontSize: '14px',
                  color: '#3b82f6',
                  fontWeight: '800',
                  marginBottom: '8px'
                }}>Step 1</div>
                <div style={{ fontSize: '14px', color: '#4b5563' }}>
                  Share your referral link with friends
                </div>
              </div>
              
              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ 
                  fontSize: '14px',
                  color: '#3b82f6',
                  fontWeight: '800',
                  marginBottom: '8px'
                }}>Step 2</div>
                <div style={{ fontSize: '14px', color: '#4b5563' }}>
                  Reach 3+ shares for priority processing
                </div>
              </div>
              
              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ 
                  fontSize: '14px',
                  color: '#3b82f6',
                  fontWeight: '800',
                  marginBottom: '8px'
                }}>Step 3</div>
                <div style={{ fontSize: '14px', color: '#4b5563' }}>
                  Receive payment within 5-30 minutes
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setActiveTab("OVERVIEW");
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '14px 28px',
                fontSize: '16px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.6)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
              }}
            >
              <span style={{ fontSize: '20px' }}>📊</span>
              Continue to Dashboard
            </button>
          </div>
        </div>
      </div>
    )}

    {/* MODAL WITHDRAWAL SHARING INTERFACE (SHOWS WHEN CLICKING ON PENDING WITHDRAWAL) */}
    {activeWithdrawPlan && pendingWithdrawals[activeWithdrawPlan] && (
      <div 
        className="withdraw-form-container"
        onClick={(e) => {
          if (e.target.className === 'withdraw-form-container') {
            setActiveWithdrawPlan("");
          }
        }}
      >
        <div className="card withdraw-sharing-card">
          <button 
            onClick={() => setActiveWithdrawPlan("")}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            aria-label="Close"
          >
            ×
          </button>
          <div className="sharing-header">
            <div style={{
              fontSize: '48px',
              textAlign: 'center',
              marginBottom: '16px',
              animation: 'pulse 2s infinite'
            }}>
              🎉
            </div>
            <h3 style={{ textAlign: 'center', color: '#10b981', marginBottom: '8px' }}>
              Manage Your Withdrawal
            </h3>
            <p style={{ 
              textAlign: 'center', 
              fontSize: '15px',
              lineHeight: '1.6',
              marginBottom: '20px',
              fontWeight: '600'
            }}>
              Share your referral link to speed up processing!
            </p>
          </div>

          <div className="referral-code-box">
            <span className="code-label">Your Referral Code:</span>
            <span className="code-value">{pendingWithdrawals[activeWithdrawPlan].referral_code}</span>
          </div>

          <div className="share-progress">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span>Shares: {pendingWithdrawals[activeWithdrawPlan].share_count || 0}/3</span>
              <span style={{ 
                fontSize: '12px',
                color: (pendingWithdrawals[activeWithdrawPlan].share_count || 0) >= 3 ? '#10b981' : '#f59e0b',
                fontWeight: '700'
              }}>
                {(pendingWithdrawals[activeWithdrawPlan].share_count || 0) >= 3 ? 
                  '✅ Target Reached!' : 
                  `${3 - (pendingWithdrawals[activeWithdrawPlan].share_count || 0)} more needed`}
              </span>
            </div>
            <div className="progress-bar-share">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${Math.min(((pendingWithdrawals[activeWithdrawPlan].share_count || 0) / 3) * 100, 100)}%`,
                  transition: 'width 0.5s ease'
                }}
              ></div>
            </div>
          </div>

          <div style={{
            background: 'rgba(251, 191, 36, 0.1)',
            border: '2px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '20px',
            marginBottom: '20px'
          }}>
            <h4 style={{ 
              margin: '0 0 12px', 
              fontSize: '16px',
              fontWeight: '800',
              color: '#f59e0b',
              textAlign: 'center'
              }}>
              🚀 Why Share Your Referral?
            </h4>
            <ul style={{ 
              margin: '0',
              padding: '0 0 0 20px',
              fontSize: '14px',
              lineHeight: '1.8'
            }}>
              <li><strong>Priority Processing:</strong> Get your payment faster</li>
              <li><strong>Help Others Earn:</strong> Share the opportunity</li>
              <li><strong>Build Your Network:</strong> Earn from referrals</li>
              <li><strong>Instant Activation:</strong> 5+ shares = instant approval</li>
            </ul>
          </div>

          <p style={{ 
            fontSize: '16px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '12px',
            color: '#333'
          }}>
            Share via:
          </p>

          <div className="share-buttons-grid">
            <button 
              className="share-btn whatsapp-btn"
              onClick={() => shareToWhatsApp(activeWithdrawPlan)}
              title="Share on WhatsApp"
            >
              💬 WhatsApp
            </button>
            <button 
              className="share-btn email-btn"
              onClick={() => shareToEmail(activeWithdrawPlan)}
              title="Share via Email"
            >
              📧 Email
            </button>
            <button 
              className="share-btn sms-btn"
              onClick={() => shareToSMS(activeWithdrawPlan)}
              title="Share via SMS"
            >
              📱 SMS
            </button>
            <button 
              className="share-btn copy-btn"
              onClick={() => copyLink(activeWithdrawPlan)}
              title="Copy link"
            >
              📋 Copy
            </button>
          </div>

          <div style={{
            marginTop: '20px',
            textAlign: 'center'
          }}>
            <button 
              onClick={() => {
                setActiveTab("OVERVIEW");
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setActiveWithdrawPlan("");
              }}
              style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '0.6rem 1.2rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.6)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
            >
              <span>📊</span> Go to Dashboard
            </button>
          </div>

          {withdrawMessage && (
            <div className="success-message" style={{ marginTop: '16px' }}>
              <p>{withdrawMessage}</p>
            </div>
          )}

          <div className="withdrawal-status" style={{ marginTop: '20px' }}>
            <span className="status-label">Status:</span>
            <span className={`status-badge ${pendingWithdrawals[activeWithdrawPlan].status.toLowerCase()}`}>
              {pendingWithdrawals[activeWithdrawPlan].status === "APPROVED" ? "✅ APPROVED" :
               pendingWithdrawals[activeWithdrawPlan].status === "PENDING" ? "⏳ PENDING" :
               "🔄 PROCESSING"}
            </span>
          </div>

          <button 
            className="secondary-btn"
            style={{ marginTop: '16px' }}
            onClick={() => setActiveWithdrawPlan("")}
          >
            Close
          </button>
        </div>
      </div>
    )}

    {/* WITHDRAW FORM FOR NEW WITHDRAWALS */}
    {activeWithdrawPlan && !pendingWithdrawals[activeWithdrawPlan] && (
      <div 
        className="withdraw-form-container"
        onClick={(e) => {
          if (e.target.className === 'withdraw-form-container') {
            setActiveWithdrawPlan("");
          }
        }}
      >
        <div className="card withdraw-form">
          <button 
            onClick={() => setActiveWithdrawPlan("")}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              fontSize: '20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 10
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            aria-label="Close"
          >
            ×
          </button>
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

    {/* WITHDRAWAL HISTORY */}
    {withdrawalHistory.length > 0 && (
      <div style={{ marginTop: '32px' }}>
        <div className="section-heading">
          <h3>Withdrawal History</h3>
          <p>Track all your withdrawal requests</p>
        </div>
        
        <div className="withdrawal-history-list">
          {withdrawalHistory.map((withdrawal, index) => (
            <div key={index} className="withdrawal-history-item" style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontWeight: '700', fontSize: '16px' }}>
                  {PLANS[withdrawal.type]?.name || withdrawal.type} Plan
              </span>
                <span className={`status-badge ${withdrawal.status.toLowerCase()}`}>
                  {withdrawal.status === "APPROVED" ? "✅ PAID" :
                   withdrawal.status === "REJECTED" ? "❌ REJECTED" :
                   "⏳ PENDING"}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>
                <p>Amount: <strong>KES {withdrawal.amount}</strong></p>
                <p>Phone: {withdrawal.phone_number}</p>
                <p>Date: {new Date(withdrawal.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
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
        
        .withdrawal-submitted-section {
          animation: fadeIn 0.5s ease;
        }
        
        .withdrawal-submitted-card {
          background: white;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
          margin: 0 auto;
          max-width: 1000px;
        }
        
        @media (max-width: 768px) {
          .withdrawal-submitted-card {
            padding: 20px;
            margin: 0 16px;
          }
        }
      `}</style>
    </div>
  );
}