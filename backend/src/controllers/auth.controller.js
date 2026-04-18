/* eslint-disable no-undef */
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Notification = require("../models/Notification"); // ✅ ADDED: Import Notification model
const { registerWithReferral, awardReferralCommission } = require("./affiliate.controller");

const TOTAL_SURVEYS = 10;

/* ===============================
   🍪 COOKIE CONFIG (RENDER + VERCEL SAFE)
================================ */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/* ===============================
   REGISTER
================================ */
exports.register = async (req, res) => {
  try {
    const fullName = req.body.fullName || req.body.name || req.body.full_name;
    const { phone, referral_code } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ message: "Full name and phone number are required" });
    }

    // ✅ CHANGED: MongoDB findOne instead of pool.query
    const exists = await User.findOne({ phone });
    if (exists) {
      return res.status(409).json({ message: "Phone already registered" });
    }

    // Generate unique referral code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let newReferralCode = '';
    for (let i = 0; i < 8; i++) {
      newReferralCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // ✅ CHANGED: MongoDB create instead of pool.query
    const user = new User({
      full_name: fullName,
      phone,
      email: null,
      password_hash: null,
      is_activated: false,
      login_fee_paid: true, // Free access - no payment required
      login_fee_paid_at: new Date(),
      total_earned: 1200,
      welcome_bonus_received: true,
      welcome_bonus: 1200, // Add this field
      referral_code: newReferralCode, // ✅ Generate referral code
      // Initialize empty plans structure
      plans: {
        REGULAR: {
          surveys_completed: 0,
          completed: false,
          is_activated: false,
          total_surveys: 10
        },
        VIP: {
          surveys_completed: 0,
          completed: false,
          is_activated: false,
          total_surveys: 10
        },
        VVIP: {
          surveys_completed: 0,
          completed: false,
          is_activated: false,
          total_surveys: 10
        }
      }
    });

    await user.save();

    // ✅ Handle referral - associate new user with referrer
    if (referral_code) {
      try {
        await registerWithReferral(user._id, referral_code);
      } catch (refError) {
        console.error("Referral registration error:", refError);
        // Don't fail registration if referral fails
      }
    }

    // ---------------------------
    // 🌟 WELCOME BONUS LOGIC - UPDATED
    // ---------------------------
    try {
      // ✅ UPDATED: Use Notification model
      const notification = new Notification({
        user_id: user._id,
        title: "🎉 Welcome Bonus Unlocked!",
        message: "You've received KES 1,200 as a welcome bonus. Activate your account to withdraw.",
        action_route: "/dashboard",
        type: "welcome_bonus"
      });
      
      await notification.save();
      console.log("✅ Welcome bonus notification created for user:", user._id);
    } catch (bonusError) {
      console.error("WELCOME BONUS NOTIFICATION ERROR:", bonusError);
      // Don't block registration if notification fails
    }

    // ✅ CHANGED: Use user._id instead of user.id
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, COOKIE_OPTIONS);

    // Check if login fee is required (newly registered users haven't paid)
    if (!user.login_fee_paid) {
      user.login_fee_paid = true;
      user.login_fee_paid_at = new Date();
      await user.save();
    }
      
    return res.status(201).json({
      message: "Registration successful",
      token: token,
      user: {
        id: user._id,
        full_name: user.full_name,
        phone: user.phone,
        email: user.email,
        is_activated: user.is_activated,
        welcome_bonus_received: user.welcome_bonus_received,
        welcome_bonus: user.welcome_bonus || 1200,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    // ✅ ADDED: Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ message: "Phone already registered" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   LOGIN
=============================== */
exports.login = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Find user by phone number - no password needed
    const user = await User.findOne({ phone });
    if (!user) return res.status(401).json({ message: "Phone number not found. Please register first." });

    // Give free access - no payment required
    if (!user.login_fee_paid) {
      user.login_fee_paid = true;
      user.login_fee_paid_at = new Date();
      await user.save();
    }
    
    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, COOKIE_OPTIONS);
    
    return res.json({
      message: "Login successful",
      token: token,
      user: {
        id: user._id,
        phone: user.phone,
        login_fee_paid: true,
        survey_onboarding_completed: user.survey_onboarding_completed || false
      }
    });
} catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ message: "Login failed" });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out successfully" });
};

/* ===============================
   GET ME (FIXED VERSION - Correct active plan logic)
================================ */
exports.getMe = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Invalid session" });

    // ✅ CHANGED: MongoDB findById instead of pool.query
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: "Invalid session" });

    // Calculate active plan and totals from plans structure
    let activePlan = null;
    let recommendedPlan = null; // Plan that user should activate
    let totalSurveysCompleted = 0;
    let surveysCompleted = 0;
    let surveysLocked = false;

    // Define plan hierarchy (highest to lowest)
    const PLAN_HIERARCHY = ['VVIP', 'VIP', 'REGULAR'];
    
    // Check if user has plans structure
    if (user.plans) {
      // First pass: Find the highest COMPLETED but not activated plan
      for (const planKey of PLAN_HIERARCHY) {
        const planData = user.plans[planKey];
        
        if (planData && typeof planData === 'object') {
          // Accumulate total surveys completed across all plans
          totalSurveysCompleted += planData.surveys_completed || 0;
          
          // Check if this plan is completed but not activated
          const isCompleted = planData.completed === true || 
                             planData.surveys_completed >= TOTAL_SURVEYS;
          const isNotActivated = planData.is_activated === false;
          
          if (isCompleted && isNotActivated) {
            // This is the plan that should be activated
            recommendedPlan = planKey;
            surveysCompleted = planData.surveys_completed || 0;
            surveysLocked = true;
            
            // Also set as active plan for backward compatibility
            if (!activePlan) {
              activePlan = planKey;
            }
            break; // Found highest completed plan, stop searching
          }
        }
      }
      
      // Second pass: If no completed plan found, find first non-activated plan
      if (!activePlan) {
        for (const planKey of PLAN_HIERARCHY) {
          const planData = user.plans[planKey];
          
          if (planData && typeof planData === 'object' && planData.is_activated === false) {
            activePlan = planKey;
            surveysCompleted = planData.surveys_completed || 0;
            surveysLocked = planData.completed === true || planData.surveys_completed >= TOTAL_SURVEYS;
            break;
          }
        }
      }
      
      // If still no active plan found, use the first plan
      if (!activePlan && user.plans.REGULAR) {
        activePlan = 'REGULAR';
        surveysCompleted = user.plans.REGULAR.surveys_completed || 0;
        surveysLocked = user.plans.REGULAR.completed === true || user.plans.REGULAR.surveys_completed >= TOTAL_SURVEYS;
      }
    }

    // Add debug logging to help diagnose
    console.log(`🔍 GET ME DEBUG for user ${user._id}:`, {
      activePlan,
      recommendedPlan,
      plans: {
        REGULAR: user.plans?.REGULAR,
        VIP: user.plans?.VIP,
        VVIP: user.plans?.VVIP
      }
    });

    res.json({
      id: user._id,
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      is_activated: user.is_activated,
      total_earned: user.total_earned,
      referral_commission_earned: user.referral_commission_earned || 0,
      welcome_bonus: user.welcome_bonus || 1200, // Include welcome_bonus field
      welcome_bonus_received: user.welcome_bonus_received,
      welcome_bonus_withdrawn: user.welcome_bonus_withdrawn || false,
      survey_onboarding_completed: user.survey_onboarding_completed || false,
      active_plan: activePlan,
      recommended_plan: recommendedPlan, // New field: which plan should be activated
      surveys_completed: surveysCompleted,
      total_surveys_completed: totalSurveysCompleted,
      surveys_locked: surveysLocked,
      plans: user.plans || {},
      activation_requests: user.activation_requests || [], // Include pending activation requests
    });
  } catch (error) {
    console.error("GET ME ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   SAVE SURVEY ONBOARDING ANSWERS
============================== */
exports.saveSurveyOnboarding = async (req, res) => {
  try {
    const { answers } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.survey_onboarding_completed = true;
    user.survey_answers = answers || {};
    await user.save();

    res.json({ 
      success: true, 
      message: "Survey answers saved successfully" 
    });
  } catch (error) {
    console.error("SAVE SURVEY ONBOARDING ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};