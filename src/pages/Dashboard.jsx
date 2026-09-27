// ========================= Dashboard.jsx =========================
import { useEffect, useRef, useState } from "react";
  import { useNavigate, useLocation } from "react-router-dom";
  import api from "../api/api";
  import { useCurrency } from "../contexts/CurrencyContext.jsx";
import MainMenuDrawer from "./components/MainMenuDrawer.jsx";
import LiveWithdrawalFeed from "./components/LiveWithdrawalFeed.jsx";
import UserNotifications from "../components/UserNotifications.jsx";
import Testimonials from "../components/Testimonials.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import Achievements from "./components/Achievements.jsx";
import DailyRewardPopup from "./components/DailyRewardPopup.jsx";
import WelcomeBonusPopup from "./components/WelcomeBonusPopup.jsx";
import { gamificationApi } from "../api/api";
import { getDeferredPrompt, clearDeferredPrompt } from "../utils/pwaInstall";
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

/* =====================================================
   📋 60 INDIVIDUAL SURVEYS
   - KES 97 per survey, 5 surveys per day
   ==================================================== */
const SURVEY_TOTAL = 60;
  const SURVEY_DAILY_LIMIT = 5;
  const SURVEY_EARNINGS = 97;

  const CATEGORY_ICONS = {
    "daily lifestyle": "🏠",
    "food": "🍽️",
    "football": "⚽",
    "safaricom": "📶",
    "equity bank": "🏦",
    "communication": "💬",
  };

  const getCategoryIcon = (category) => {
    if (!category) return "📋";
    return CATEGORY_ICONS[String(category).trim().toLowerCase()] || "📋";
  };

// Theme removed - light mode only

  const SURVEY_TITLES_BY_CATEGORY = {
    "daily lifestyle": [
      "Morning Routine Habits",
      "Sleep Patterns & Quality",
      "Daily Productivity",
      "Weekend Activities",
      "Home Organization",
      "Personal Care & Grooming",
      "Stress Management",
      "Time Management",
      "Daily Commute Experience",
      "Evening Relaxation Habits"
    ],
    "food": [
      "Breakfast Habits Survey",
      "Fast Food Preferences",
      "Healthy Eating Patterns",
      "Restaurant Dining Experience",
      "Cooking Habits & Skills",
      "Dietary Restrictions",
      "Snacking Patterns",
      "Daily Water Intake",
      "Coffee & Tea Consumption",
      "Dining Out Preferences"
    ],
    "football": [
      "Premier League Fan Survey",
      "Fan Engagement & Passion",
      "Match Viewing Habits",
      "Fantasy Football Experience",
      "Football Memorabilia Collection",
      "Game Day Experience",
      "Youth Football Participation",
      "Women's Football Interest",
      "Football Streaming Habits",
      "Stadium Visit Experience"
    ],
    "safaricom": [
      "M-Pesa Usage Survey",
      "Network Quality & Coverage",
      "Customer Service Experience",
      "Safaricom App Usage",
      "Data Bundle Preferences",
      "Roaming Services Survey",
      "Bill Payments via Mobile",
      "Till Number Usage",
      "M-Shwari & Savings",
      "Safaricom Boda Service"
    ],
    "equity bank": [
      "Banking App Usage Survey",
      "Account Types & Usage",
      "Loan Services Experience",
      "Equity Agent Usage",
      "Mobile Banking Habits",
      "Savings & Investment",
      "Insurance Products Interest",
      "Remittance Services",
      "Equity Card Survey",
      "Branch Visit Experience"
    ],
    "communication": [
      "WhatsApp Usage Patterns",
      "Voice & Video Call Habits",
      "Social Media Platforms",
      "Email Communication",
      "Messaging App Preferences",
      "Video Streaming Habits",
      "SMS Usage Trends",
      "Phone Call Duration",
      "Group Chat Participation",
      "Digital Communication"
    ]
  };

  const generateSurveyQuestions = (surveyTitle) => [
    {
      id: "q1",
      question: `What is your primary experience with ${surveyTitle.toLowerCase()}?`,
      options: ["Excellent", "Good", "Average", "Poor", "Very Poor"]
    },
    {
      id: "q2",
      question: `How often do you engage with ${surveyTitle.toLowerCase()}?`,
      options: ["Daily", "Weekly", "Monthly", "Rarely", "Never"]
    },
    {
      id: "q3",
      question: `How satisfied are you with ${surveyTitle.toLowerCase()}?`,
      options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]
    },
    {
      id: "q4",
      question: `Would you recommend ${surveyTitle.toLowerCase()} to a friend?`,
      options: ["Yes", "No", "Maybe"]
    },
    {
      id: "q5",
      question: `How much time do you spend on ${surveyTitle.toLowerCase()} daily?`,
      options: ["< 30 min", "30-60 min", "1-2 hrs", "2-4 hrs", "> 4 hrs"]
    },
    {
      id: "q6",
      question: `What is your primary reason for using ${surveyTitle.toLowerCase()}?`,
      options: ["Convenience", "Cost", "Quality", "Social", "Other"]
    },
    {
      id: "q7",
      question: `How has ${surveyTitle.toLowerCase()} improved your daily life?`,
      options: ["Significantly", "Moderately", "Slightly", "Not at all", "Made it worse"]
    },
    {
      id: "q8",
      question: `Which feature of ${surveyTitle.toLowerCase()} do you use most?`,
      options: ["Feature A", "Feature B", "Feature C", "Feature D", "All of them"]
    },
    {
      id: "q9",
      question: `How easy is ${surveyTitle.toLowerCase()} to use?`,
      options: ["Very Easy", "Easy", "Neutral", "Difficult", "Very Difficult"]
    },
    {
      id: "q10",
      question: `Would you pay for a premium version of ${surveyTitle.toLowerCase()}?`,
      options: ["Definitely", "Maybe", "Not sure", "Probably not", "Definitely not"]
    }
  ];

  const HARDCODED_SURVEYS = (() => {
    const surveys = [];
    let counter = 1;
    Object.entries(SURVEY_TITLES_BY_CATEGORY).forEach(([category, titles]) => {
      titles.forEach(title => {
        surveys.push({
          _id: `survey-${String(counter).padStart(3, "0")}`,
          title,
          category,
          earnings: 97,
          estimatedTime: "5-10 min",
          totalQuestions: 10,
          questions: generateSurveyQuestions(title),
          isCompleted: false,
        });
        counter++;
      });
    });
    return surveys;
  })();

  export default function Dashboard() {
  const { format } = useCurrency();
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
  const [surveys, setSurveysState] = useState(HARDCODED_SURVEYS);
  const [dailySurveyCount, setDailySurveyCount] = useState(0);
  const [startingSurveyId, setStartingSurveyId] = useState(null);
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
   const [highlightPlan, setHighlightPlan] = useState(null);
   const [fullScreenNotification, setFullScreenNotification] = useState(null);
   const [show72HourAffiliatePrompt, setShow72HourAffiliatePrompt] = useState(false);

  /* =========================
     GAMIFICATION STATE
   ========================= */
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [canClaimDailyReward, setCanClaimDailyReward] = useState(false);
  const [showWelcomeBonus, setShowWelcomeBonus] = useState(false);
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
  const location = useLocation();
  
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

        // Today's survey count (5/day limit)
        const today = new Date().toISOString().split("T")[0];
        setDailySurveyCount(
          resUser.data.daily_survey_date === today ? (resUser.data.daily_survey_count || 0) : 0
        );

        // Surveys are hardcoded - always available
        
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

        // 72-hour affiliate prompt
        const withdrawalSubmittedAt = resUser.data.withdrawal_submitted_at;
        const withdrawalStatus = resUser.data.withdrawal_status;
        if (withdrawalSubmittedAt && withdrawalStatus === 'SUBMITTED') {
          const submittedTime = new Date(withdrawalSubmittedAt).getTime();
          const hoursPassed = (Date.now() - submittedTime) / (1000 * 60 * 60);
          if (hoursPassed >= 72) {
            setShow72HourAffiliatePrompt(true);
          }
        } else {
          setShow72HourAffiliatePrompt(false);
        }
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
      REDIRECT FOCUS HANDLER
      Redirects like /dashboard?focusPlan=WELCOME_BONUS&highlightPlan=WELCOME_BONUS
      land directly on the exact next plan card.
   ========================= */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const focusPlan = params.get("focusPlan") || params.get("highlightPlan");
    const highlight = params.get("highlightPlan") || focusPlan;

    if (focusPlan) {
      setHighlightPlan(highlight);
      window.history.replaceState(null, "", "/dashboard");
    }
  }, [location.search]);

  useEffect(() => {
    if (!highlightPlan || !user) return;

    const selector = highlightPlan === "WELCOME_BONUS"
      ? "#welcome-bonus-card"
      : `#plan-card-${highlightPlan}`;

    const focusTimer = setTimeout(() => {
      const element = document.querySelector(selector);

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("dashboard-focus-pulse");
        setTimeout(() => element.classList.remove("dashboard-focus-pulse"), 2200);
      }
    }, 250);

    return () => clearTimeout(focusTimer);
  }, [highlightPlan, user]);

  /* =========================
      PLAN PAYMENT REDIRECT HANDLER
   ========================= */
  useEffect(() => {
    const planParam = new URLSearchParams(location.search).get("plan");
    if (planParam && user?.plans_paid) {
      // After payment, scroll to surveys section to show next plan
      setTimeout(() => {
        const element = document.getElementById('surveys-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, [location.search, user]);

  /* =========================
      THEME EFFECT
   ========================= */
   // Theme removed - light mode only

   // Theme removed - light mode only

  /* =========================
      COMPLETE A SURVEY
   ========================= */
  const handleCompleteSurvey = async (surveyId) => {
    if (dailySurveyCount >= SURVEY_DAILY_LIMIT) {
      setToast("Daily limit reached - come back tomorrow");
      setTimeout(() => setToast(""), 4000);
      return;
    }

    // Check if survey already completed locally
    const survey = surveys.find(s => s._id === surveyId);
    if (survey?.isCompleted) {
      setToast("You already completed this survey");
      setTimeout(() => setToast(""), 3000);
      return;
    }

    setStartingSurveyId(surveyId);
    try {
      // Mark survey as completed locally
      const updatedSurveys = surveys.map(s =>
        s._id === surveyId ? { ...s, isCompleted: true } : s
      );
      // Surveys are hardcoded - always available
      // Since useState doesn't have setter, we need to use a ref or re-create
      // Actually we need to add a surveys state setter
      setSurveysState(updatedSurveys);

      const newDailyCount = dailySurveyCount + 1;
      setDailySurveyCount(newDailyCount);

      // Add KES 97 to balance
      const newBalance = (stats.availableBalance || 0) + SURVEY_EARNINGS;
      const newTotalEarned = (stats.totalEarned || 0) + SURVEY_EARNINGS;
      setStats(prev => ({
        ...prev,
        availableBalance: newBalance,
        totalEarned: newTotalEarned,
        totalSurveysCompleted: (prev.totalSurveysCompleted || 0) + 1
      }));

      setToast(`Survey completed! Earned ${format(SURVEY_EARNINGS)}`);
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to complete survey. Please try again.";
      setToast(message);
    } finally {
      setStartingSurveyId(null);
      setTimeout(() => setToast(""), 4000);
    }
  };

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
   GAMIFICATION - CHECK WELCOME BONUS POPUP ON FIRST SIGN-IN
   ========================= */
   useEffect(() => {
     if (!user) return;
     
     const isActivated = user.is_activated || user.account_activated;
     const hasSeenPopup = user.has_seen_welcome_popup === true;
     const welcomeBonusNotPaid = user.welcome_bonus_paid !== true;

     if (!hasSeenPopup && welcomeBonusNotPaid && !isActivated) {
       const showAfterDelay = setTimeout(() => {
         setShowWelcomeBonus(true);
         api.post("/auth/mark-welcome-popup-seen").catch(err => {
           console.error("Failed to mark welcome popup seen:", err);
         });
       }, 1500);
       
       return () => clearTimeout(showAfterDelay);
     }
   }, [user]);

  const handleWelcomeBonusClose = () => {
    setShowWelcomeBonus(false);
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
  const isActivated = (plan) => plans[plan]?.is_activated === true || user?.plans_paid?.[plan] === true || user?.[`${plan.toLowerCase()}_paid`] === true;

  const hasPendingActivation = (plan) => {
    return activationRequests.some(
      req => req.plan === plan && req.status === 'SUBMITTED'
    );
  };

  /* =========================
     SURVEY LIST DERIVED STATE
   ========================= */
  const completedSurveyCount = surveys.filter(s => s.isCompleted === true).length;
  const surveyProgressPercent = Math.min(100, (completedSurveyCount / SURVEY_TOTAL) * 100);

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
     WITHDRAW LOGIC - SIMPLIFIED
   ========================= */
  const handleWithdrawClick = async () => {
    const now = Date.now();
    const lastClickTime = localStorage.getItem("lastWithdrawClick");
    if (lastClickTime && (now - parseInt(lastClickTime)) < 2000) {
      setToast("Please wait before clicking again");
      setTimeout(() => setToast(""), 3000);
      return;
    }
    localStorage.setItem("lastWithdrawClick", now.toString());

    // Check if user has activated (paid KES 100)
    const accountActivated = user?.all_plans_completed === true ||
                        Object.values(plans || {}).some(p => p.is_activated);

    if (!accountActivated) {
      // Show notification card with bold ACTIVATE NOW button inside it
      setFullScreenNotification({
        message: "Activate your account first to unlock withdrawals.",
        redirect: "/activate",
        goDashboard: false,
        showActivateButton: true
      });
      return;
    }

    const totalCompleted = stats?.totalSurveysCompleted || 0;
    const remaining = 60 - totalCompleted;

    if (totalCompleted < 60) {
      setToast(`Complete ${remaining} more surveys to withdraw`);
      goToSurveys();
      setTimeout(() => setToast(""), 4000);
      return;
    }

    navigate("/withdraw-form");
  };

/* =========================
      WELCOME BONUS
   ========================= */
  const handleWelcomeBonusWithdraw = () => {
    navigate("/activate?welcome_bonus=true");
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
    window.open("https://whatsapp.com/channel/0029VbDaMReDeONE65SbVk0y", "_blank");
  };

  const handleInstallApp = async () => {
    const promptEvent = getDeferredPrompt();
    if (!promptEvent) {
      setToast('To install: open in Chrome/Edge → tap menu (⋮) → "Add to Home Screen" or "Install App"');
      setTimeout(() => setToast(''), 4000);
      return;
    }
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === 'accepted') {
      setToast('Installing app...');
    }
    clearDeferredPrompt();
    setTimeout(() => setToast(''), 3000);
  };

  // Reminder notification for unactivated plans
  useEffect(() => {
    if (!user || reminderShown) return;
    const allCompleted = user.all_plans_completed === true;
    if (allCompleted) return;
    const hasAnyActivated = Object.values(plans).some(p => p.is_activated);
    if (!hasAnyActivated) return;
    const timer = setTimeout(() => {
      setFullScreenNotification({
        message: `You have ${getRemainingPlansCount()} plan(s) remaining to activate. Complete them to unlock withdrawals and start earning your full potential!`,
        redirect: "/activate",
        goDashboard: false,
      });
      setReminderShown(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [user, plans, reminderShown]);

  const getRemainingPlansCount = () => {
    if (!user) return 0;
    const remaining = [];
    ['REGULAR', 'VIP', 'VVIP'].forEach(plan => {
      const isPaid = user.plans_paid?.[plan] || user[`${plan.toLowerCase()}_paid`];
      const isActivated = plans[plan]?.is_activated;
      if (!isPaid && !isActivated) remaining.push(plan);
    });
    return remaining.length;
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

  // Check if user has activated (paid KES 100)
  const accountActivated = user?.all_plans_completed === true ||
                      Object.values(plans || {}).some(p => p.is_activated);

  return (
    <div className="dashboard" ref={dashboardRef} style={{ paddingBottom: '80px' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}} />
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
              {fullScreenNotification.showActivateButton ? '🔓' : '🎁'}
            </div>
            
            <h3 style={{
              color: 'white',
              margin: '0 0 10px 0',
              fontSize: '22px',
              fontWeight: '700'
            }}>
              {fullScreenNotification.showActivateButton ? 'Activation Required' : 'Welcome Bonus!'}
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
              {fullScreenNotification.showActivateButton && (
                <button
                  onClick={() => {
                    document.body.style.overflow = '';
                    document.body.style.position = '';
                    document.body.style.width = '';
                    document.body.style.height = '';
                    
                    setFullScreenNotification(null);
                    navigate("/activate");
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '18px 24px',
                    fontSize: '18px',
                    fontWeight: '900',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    width: '100%',
                    boxShadow: '0 10px 30px rgba(245, 158, 11, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 15px 40px rgba(245, 158, 11, 0.7)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(245, 158, 11, 0.5)';
                  }}
                >
                  <span style={{ fontSize: '22px' }}>🔓</span>
                  ACTIVATE NOW
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

      {/* MAIN MENU HEADER */}
      <header className="dashboard-main-header">
        <div className="header-title-container">
          <button className="menu-btn" onClick={() => setMenuOpen(true)} style={{ position: 'absolute', left: '14px' }}>
            <span className="menu-icon">☰</span>
          </button>
          <button
            onClick={handleInstallApp}
            className="install-app-btn"
            title="Install App"
            style={{ margin: '0 auto' }}
          >
            📲 Install App
          </button>
            <button
              onClick={openWhatsAppSupport}
              className="whatsapp-header-btn"
              style={{ position: 'absolute', right: '14px' }}
              title="Contact Us on WhatsApp"
            >
              <span style={{ fontSize: '12px' }}>💬</span>
              <span style={{ fontSize: '11px', fontWeight: '600' }}>Contact Us</span>
            </button>
        </div>

        <div className="header-activation-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {user && (
            (() => {
              const hasAnyActivatedPlan = Object.values(plans).some(p => p.is_activated);
              const allPlansCompleted = user.all_plans_completed === true;
              if (allPlansCompleted) {
                return (
                  <button
                    disabled
                    className="activate-btn-pulse"
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #047857 100%)',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '11px',
                    cursor: 'default',
                    boxShadow: '0 4px 16px rgba(6, 182, 212, 0.4), 0 0 24px rgba(5, 150, 105, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}
                >
                  <span className="btn-icon" style={{ fontSize: '14px' }}>✅</span>
                  ALL PLANS COMPLETE - WITHDRAW READY
                  <span style={{ fontSize: '12px', marginLeft: '2px' }}>🎉</span>
                  </button>
                );
              }
              if (hasAnyActivatedPlan) {
                return (
                  <button
                    disabled
                    className="activate-btn-pulse"
                  style={{
                    background: 'linear-gradient(135deg, #ff7a7a 0%, #ff6b6b 50%, #d97706 100%)',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '11px',
                    cursor: 'not-allowed',
                    boxShadow: '0 4px 16px rgba(255, 122, 122, 0.4), 0 0 24px rgba(255, 107, 107, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    opacity: 0.9
                  }}
                >
                  <span className="btn-icon" style={{ fontSize: '14px' }}>⏳</span>
                  COMPLETE REMAINING PLANS
                  <span style={{ fontSize: '12px', marginLeft: '2px' }}>🔓</span>
                  </button>
                );
              }
              if (activationRequests.some(req => req.status === 'SUBMITTED')) {
                return (
                  <button
                    disabled
                    className="activate-btn-pulse"
                  style={{
                    background: 'linear-gradient(135deg, #ff7a7a 0%, #ff6b6b 50%, #d97706 100%)',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '11px',
                    cursor: 'not-allowed',
                    boxShadow: '0 4px 16px rgba(255, 122, 122, 0.4), 0 0 24px rgba(255, 107, 107, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    opacity: 0.9
                  }}
                >
                  <span className="btn-icon" style={{ fontSize: '14px' }}>⏳</span>
                  PENDING APPROVAL
                  <span style={{ fontSize: '12px', marginLeft: '2px' }}>⏰</span>
                  </button>
                );
              }
              return (
                <button
                  onClick={() => navigate('/activate?welcome_bonus=true')}
                  className="activate-btn-pulse"
                  style={{
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ef4444 50%, #c2410c 100%)',
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderRadius: '18px',
                    padding: '6px 14px',
                    color: 'white',
                    fontWeight: '700',
                    fontSize: '11px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(255, 107, 107, 0.4), 0 0 24px rgba(255, 107, 107, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    animation: 'pulse-glow 2s infinite',
                    transition: 'all 0.3s ease',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(255, 107, 107, 0.6), 0 0 40px rgba(255, 107, 107, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 107, 107, 0.4), 0 0 24px rgba(255, 107, 107, 0.25)';
                  }}
                >
                  <span className="btn-icon" style={{ fontSize: '12px' }}>🔓</span>
                  TAP HERE TO ACTIVATE ACCOUNT 
                  <span style={{ fontSize: '11px', marginLeft: '2px' }}>✨</span>
                </button>
              );
            })()
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

       {/* 72-HOUR AFFILIATE PROMPT - Shows after withdrawal processing delay */}
       {show72HourAffiliatePrompt && (
         <section className="dashboard-section" style={{ padding: '0 16px', marginTop: '8px' }}>
           <div style={{
             background: 'linear-gradient(135deg, #06b6d4 0%, #7c3aed 100%)',
             borderRadius: '16px',
             padding: '20px',
             boxShadow: '0 8px 25px rgba(6, 182, 212, 0.3)',
             border: '1px solid rgba(255,255,255,0.2)'
           }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
               <span style={{ fontSize: '32px' }}>🎁</span>
               <h3 style={{
                 margin: 0,
                 fontSize: '20px',
                 fontWeight: 900,
                 color: 'white',
                 textShadow: '0 2px 4px rgba(0,0,0,0.2)'
               }}>
                 Referral Program is Now Unlocked! 🎯
               </h3>
             </div>
             <p style={{
               margin: '0 0 16px 0',
               fontSize: '14px',
               color: 'rgba(255,255,255,0.9)',
               lineHeight: '1.5'
             }}>
               Your withdrawal has been processing for over 72 hours. Now you can earn {format(50)} instantly for every friend you refer! Invite friends to join and earn while you wait.
             </p>
             <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
               <button
                 onClick={() => {
                   setShow72HourAffiliatePrompt(false);
                   navigate('/affiliate');
                 }}
                 style={{
                   flex: 1,
                   background: 'linear-gradient(135deg, #ff6b6b, #ef4444)',
                   color: 'white',
                   border: 'none',
                   borderRadius: '12px',
                   padding: '12px 16px',
                   fontSize: '14px',
                   fontWeight: 800,
                   cursor: 'pointer',
                   boxShadow: '0 4px 15px rgba(255, 107, 107, 0.4)'
                 }}
               >
                 👥 Start Referring Friends
               </button>
               <button
                 onClick={() => setShow72HourAffiliatePrompt(false)}
                 style={{
                   flex: 1,
                   background: 'rgba(255,255,255,0.2)',
                   color: 'white',
                   border: '1px solid rgba(255,255,255,0.3)',
                   borderRadius: '12px',
                   padding: '12px 16px',
                   fontSize: '14px',
                   fontWeight: 600,
                   cursor: 'pointer'
                 }}
               >
                 Dismiss
               </button>
             </div>
           </div>
         </section>
       )}

      {/* COMBINED BALANCE & WELCOME BONUS CARD - EDGE-TO-EDGE, COMPACT */}
      <section ref={welcomeRef} style={{ margin: '6px 0', padding: '0 16px' }}>
        <div
          id="welcome-bonus-card"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
            border: highlightPlan === "WELCOME_BONUS" ? '2px solid #06b6d4' : '1px solid #5b21b6',
            borderRadius: '12px',
            padding: '0',
            boxShadow: highlightPlan === "WELCOME_BONUS" ? '0 0 0 4px rgba(6, 182, 212, 0.25), 0 12px 30px rgba(124, 58, 237, 0.18)' : '0 6px 25px rgba(124, 58, 237, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1)',
            width: '100%',
            transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
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
                  {format(stats.availableBalance)}
                </span>
              </div>
            </div>
<button
               onClick={() => navigate("/withdraw-form")}
               style={{
                 background: 'linear-gradient(135deg, #ff7a7a, #ef4444)',
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
                 boxShadow: '0 3px 10px rgba(255, 107, 107, 0.4)',
                 transition: 'all 0.2s ease'
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.transform = 'translateY(-1px)';
                 e.currentTarget.style.boxShadow = '0 4px 14px rgba(255, 107, 107, 0.5)';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.transform = 'translateY(0)';
                 e.currentTarget.style.boxShadow = '0 3px 10px rgba(255, 107, 107, 0.4)';
               }}
             >
               💰 Withdraw
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
                  {format(1200)}
                </span>
              </div>
            </div>
            <button
              className="start-survey-btn"
              onClick={handleWelcomeBonusWithdraw}
              style={{
                background: 'linear-gradient(135deg, #ff7a7a, #ef4444)',
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
                boxShadow: '0 3px 10px rgba(255, 107, 107, 0.4)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(255, 107, 107, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 3px 10px rgba(255, 107, 107, 0.4)';
              }}
            >
              CLAIM NOW
            </button>
          </div>
        </div>
      </section>
      {/* AVAILABLE SURVEYS - 60 individual surveys (single column) */}
      <section className="dashboard-section" id="surveys-section" ref={surveysSectionRef}>
        <div className="section-heading">
          <h3>Available Surveys</h3>
          <p>Complete surveys to earn {format(SURVEY_EARNINGS)} each</p>
        </div>

        {/* DAILY PROGRESS */}
        <div style={{
          background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
          border: '1px solid #7c3aed',
          borderRadius: '8px',
          padding: '10px 12px',
          marginBottom: '12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#5b21b6' }}>
              {completedSurveyCount}/{SURVEY_TOTAL} surveys completed • {dailySurveyCount}/{SURVEY_DAILY_LIMIT} today
            </span>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#7c3aed' }}>
              {format(completedSurveyCount * SURVEY_EARNINGS)} earned
            </span>
          </div>
          <div className="progress-bar" style={{
            height: '8px',
            background: '#ffffff',
            borderRadius: '4px',
            overflow: 'hidden',
            border: '1px solid rgba(124, 58, 237, 0.2)'
          }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${surveyProgressPercent}%`,
                height: '100%',
                background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                borderRadius: '4px',
                transition: 'width 0.5s ease'
              }}
            ></div>
          </div>
        </div>

        {/* 60 SURVEYS - SINGLE VERTICAL COLUMN */}
         <div className="survey-list" style={{
           display: 'flex',
           flexDirection: 'column',
           gap: '10px',
           width: '100%'
         }}>
           {surveys.map((survey, index) => {
              const isDone = survey.isCompleted === true;
              const limitReached = dailySurveyCount >= SURVEY_DAILY_LIMIT;
              const isStarting = startingSurveyId === survey._id;

              return (
                <div
                  key={survey._id || index}
                  className="survey-card"
                  style={{
                    background: '#ffffff',
                    border: isDone ? '1px solid #16a34a' : '1px solid #7c3aed',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    boxShadow: isDone
                      ? '0 2px 8px rgba(22, 163, 74, 0.12)'
                      : '0 2px 8px rgba(124, 58, 237, 0.08)',
                    opacity: isDone ? 0.9 : 1,
                    transition: 'box-shadow 0.2s ease, border-color 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span
                      className="survey-icon"
                      style={{
                        fontSize: '26px',
                        lineHeight: 1,
                        flexShrink: 0,
                        width: '42px',
                        height: '42px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                        borderRadius: '8px'
                      }}
                    >
                      {getCategoryIcon(survey.category)}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {survey.category && (
                        <span style={{
                          display: 'block',
                          fontSize: '10px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          color: '#7c3aed',
                          marginBottom: '2px'
                        }}>
                          {survey.category}
                        </span>
                      )}
                      <h4 style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: '800',
                        color: '#5b21b6',
                        lineHeight: 1.3
                      }}>
                        {survey.title}
                      </h4>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '6px',
                        flexWrap: 'wrap'
                      }}>
                        <span className="survey-earnings-badge" style={{
                          background: 'linear-gradient(135deg, #1f7405 0%, #2d9a07 100%)',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: '900',
                          padding: '3px 10px',
                          borderRadius: '12px'
                        }}>
{format(SURVEY_EARNINGS)}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#6b7280'
                        }}>
                          ⏱️ 5-10 min
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '10px' }}>
                    {isDone ? (
                      <span className="survey-completed-badge" style={{
                        display: 'block',
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                        border: '1px solid #16a34a',
                        color: '#15803d',
                        fontSize: '12px',
                        fontWeight: '800',
                        padding: '9px',
                        borderRadius: '6px'
                      }}>
                        ✓ Completed
                      </span>
                    ) : limitReached ? (
                      <div className="survey-limit-message" style={{
                        textAlign: 'center',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        border: '1px solid #d97706',
                        color: '#b45309',
                        fontSize: '12px',
                        fontWeight: '800',
                        padding: '9px',
                        borderRadius: '6px'
                      }}>
                        Limit Reached - Come Back Tomorrow
                      </div>
                    ) : (
                      <button
                        className="start-survey-btn"
                        onClick={() => navigate(`/surveys/${survey._id}`)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          fontSize: '12px',
                          fontWeight: '800',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                          color: 'white',
                          cursor: 'pointer',
                          opacity: isStarting ? 0.7 : 1,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isStarting ? '⏳ Submitting...' : '🚀 Start Survey'}
                      </button>
                    )}
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
            <div className="stats-card" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', borderRadius: '8px', padding: '14px' }}>
             <div className="stats-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
               <span className="stats-icon" style={{ fontSize: '20px' }}>💰</span>
               <h4 style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}>Total Earnings</h4>
             </div>
             <div className="stats-card-body">
               <span className="stats-value" style={{ color: '#ffffff', fontSize: '20px', fontWeight: '900', display: 'block' }}>{format(stats.totalEarned)}</span>
               <span className="stats-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px' }}>Lifetime earnings</span>
             </div>
           </div>

           <div className="stats-card" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', borderRadius: '8px', padding: '14px' }}>
            <div className="stats-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="stats-icon" style={{ fontSize: '20px' }}>💳</span>
              <h4 style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}>Available</h4>
            </div>
            <div className="stats-card-body">
              <span className="stats-value" style={{ color: '#ffffff', fontSize: '20px', fontWeight: '900', display: 'block' }}>{format(stats.availableBalance)}</span>
              <span className="stats-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px' }}>Ready to withdraw</span>
            </div>
           </div>

           <div className="stats-card" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', borderRadius: '8px', padding: '14px' }}>
             <div className="stats-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
               <span className="stats-icon" style={{ fontSize: '20px' }}>🎁</span>
               <h4 style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}>Affiliate</h4>
             </div>
             <div className="stats-card-body">
               <span className="stats-value" style={{ color: '#ffffff', fontSize: '20px', fontWeight: '900', display: 'block' }}>{format(stats.affiliateEarnings || 0)}</span>
               <span className="stats-label" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '10px' }}>From referrals</span>
             </div>
           </div>

           <div className="stats-card" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', borderRadius: '8px', padding: '14px' }}>
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
          <div className="feature-card" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
            <div className="feature-icon" style={{ fontSize: '28px', marginBottom: '6px' }}>⚡</div>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>Instant Withdrawals</h4>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)' }}>Request cash anytime.</p>
          </div>
          <div className="feature-card" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
            <div className="feature-icon" style={{ fontSize: '28px', marginBottom: '6px' }}>✅</div>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>Verified Surveys</h4>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)' }}>High-quality surveys.</p>
          </div>
          <div className="feature-card" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
            <div className="feature-icon" style={{ fontSize: '28px', marginBottom: '6px' }}>🔒</div>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'white', marginBottom: '4px' }}>Secure Payments</h4>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)' }}>Encrypted transactions.</p>
          </div>
          <div className="feature-card" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
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
               background: action.completed ? 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' : 'linear-gradient(135deg, #7c3aed, #7c3aed)',
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
                 background: action.completed ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg, #ff7a7a, #ef4444)',
                 border: action.completed ? '1px solid rgba(255,255,255,0.3)' : 'none',
                 borderRadius: '12px',
                 padding: '8px 16px',
                 fontWeight: '800',
                 fontSize: '12px',
                 color: 'white',
                 cursor: action.completed ? 'default' : 'pointer',
                 transition: 'all 0.2s ease',
                 flexShrink: 0,
                 boxShadow: action.completed ? 'none' : '0 3px 10px rgba(255, 107, 107, 0.4)'
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
        background: 'rgba(255, 255, 255, 0.97)',
        borderBottom: '1px solid #e2e8f0',
        padding: '8px 12px',
        boxShadow: '0 -2px 12px rgba(0, 0, 0, 0.08)',
        zIndex: 1000
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
            background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
                         cursor: 'pointer',
             minHeight: '50px'
          }}
        >
          <span className="nav-icon" style={{ fontSize: '20px', color: 'white' }}>📊</span>
          <span className="nav-label" style={{ fontSize: '10px', fontWeight: '600', color: 'white' }}>Home</span>
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
            background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            minHeight: '50px'
          }}
        >
          <span className="nav-icon" style={{ fontSize: '20px', color: 'white' }}>📝</span>
          <span className="nav-label" style={{ fontSize: '10px', fontWeight: '600', color: 'white' }}>Surveys</span>
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
              background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              minHeight: '50px'
            }}
          >
            <span className="nav-icon" style={{ fontSize: '20px', color: 'white' }}>👥</span>
            <span className="nav-label" style={{ fontSize: '10px', fontWeight: '600', color: 'white' }}>Affiliate</span>
          </button>

{user && (
            <button
              className="nav-btn"
              onClick={handleWithdrawClick}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                padding: '6px',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ef4444 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                minHeight: '50px'
              }}
            >
              <span className="nav-icon" style={{ fontSize: '20px', color: 'white' }}>💰</span>
              <span className="nav-label" style={{ fontSize: '10px', fontWeight: '600', color: 'white' }}>Withdraw</span>
            </button>
          )}
       </div>

      {/* GAMIFICATION SECTION */}
      <div className="gamification-section" style={{ marginTop: '30px', marginBottom: '30px' }}>
        <div className="gamification-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px'
        }}>
           <div className="level-streak-card" style={{
             background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
             borderRadius: '16px',
             padding: '20px',
             color: 'white'
           }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
               <div style={{
                 background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
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
                   background: 'linear-gradient(90deg, #a78bfa, #c4b5fd)',
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
              onClick={() => window.open("https://whatsapp.com/channel/0029VbDaMReDeONE65SbVk0y", "_blank")}
              style={{
                background: 'none',
                border: 'none',
                color: '#25D366',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '12px',
                margin: '0 5px'
              }}
            >
              Contact Us
            </button>
          </p>
          <p className="footer-note" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>© {new Date().getFullYear()} SurveyEarn. All rights reserved.</p>
        </footer>

{/* WELCOME BONUS POPUP */}
        <WelcomeBonusPopup
          isOpen={showWelcomeBonus}
          onClose={handleWelcomeBonusClose}
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