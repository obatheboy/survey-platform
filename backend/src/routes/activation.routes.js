const express = require("express");
const router = express.Router();
const User = require("../models/User");
const paystackService = require("../services/paystack.service");

const { protect } = require("../middlewares/auth.middleware");
const activationController = require("../controllers/activation.controller");

/**
 * =====================================
 * USER ACTIVATION ROUTES ONLY
 * Path: /api/activation
 * =====================================
 */

const PLAN_FEES = {
  REGULAR: 100,
  VIP: 150,
  VVIP: 200,
  WELCOME_BONUS: 100
};

const PLAN_NAMES = {
  REGULAR: "SurveyEarn REGULAR",
  VIP: "SurveyEarn VIP",
  VVIP: "SurveyEarn VVIP",
  WELCOME_BONUS: "SurveyEarn Welcome Bonus"
};

/**
 * POST /api/activation/initiate
 * Initiate automatic STK push payment
 */
router.post("/initiate", protect, async (req, res) => {
  try {
    const { plan, is_welcome_bonus, phone } = req.body;
    const planKey = is_welcome_bonus ? "WELCOME_BONUS" : plan?.toUpperCase();
    const amount = PLAN_FEES[planKey];
    console.log("STK Initiate request:", { plan, planKey, amount, phone });
    
    if (!amount) {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Use provided phone or default to user's registered phone
    let formattedPhone = phone || user.phone;
    if (!formattedPhone.startsWith("254")) {
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "254" + formattedPhone.substring(1);
      } else {
        formattedPhone = "254" + formattedPhone;
      }
    }
    console.log("STK phone formatted:", formattedPhone);
    
    // Use Paystack for M-Pesa STK Push
    const description = is_welcome_bonus ? "SurveyEarn Welcome Bonus" : `SurveyEarn ${planKey}`;
    const payment = await paystackService.initializePayment(
      amount,
      "+" + formattedPhone,
      user.email || `user_${user._id}@surveyearn.com`,
      user._id.toString(),
      description
    );
    
    console.log("STK payment result:", payment);
    
    return res.json({
      success: true,
      message: "STK Push sent! Check your phone and enter PIN.",
      reference: payment.reference,
      amount,
      phone: "+" + formattedPhone
    });
  } catch (error) {
    console.error("Activate STK error:", error);
    return res.json({
      success: false,
      message: "STK Push failed. Please use manual payment below.",
      requires_manual: true
    });
  }
});

/**
 * POST /api/activation/submit
 * User submits activation payment (manual fallback)
 * Protected: Regular user JWT token
 */
router.post("/submit", protect, activationController.submitActivationPayment);

/**
 * GET /api/activation/status
 * User checks activation status
 * Protected: Regular user JWT token
 */
router.get("/status", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const plans = user.plans || {};
    res.json({
      regular: plans.REGULAR?.is_activated || false,
      vip: plans.VIP?.is_activated || false,
      vvip: plans.VVIP?.is_activated || false,
    });
  } catch (error) {
    res.status(500).json({ message: "Error checking status" });
  }
});

/**
 * POST /api/activation/verify
 * Verify STK payment and activate plan
 * Protected: Regular user JWT token
 */
router.post("/verify", protect, async (req, res) => {
  try {
    const { reference, plan, is_welcome_bonus } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const planKey = is_welcome_bonus ? "REGULAR" : plan?.toUpperCase();
    
    if (user.plans?.[planKey]?.is_activated) {
      return res.json({ success: true, message: "Plan already activated" });
    }
    
    // Check pending activation request
    const pendingRequest = user.activation_requests?.find(
      r => r.plan === planKey && r.status === "SUBMITTED"
    );
    
    if (pendingRequest) {
      return res.json({ 
        success: false, 
        message: "Payment pending approval",
        status: "pending" 
      });
    }
    
    // Create pending request for webhook to approve
    if (!user.activation_requests) {
      user.activation_requests = [];
    }
    
    user.activation_requests.push({
      plan: planKey,
      amount: PLAN_FEES[planKey],
      reference,
      status: "SUBMITTED",
      created_at: new Date()
    });
    
    await user.save();
    
    res.json({ success: true, message: "Verification initiated" });
  } catch (error) {
    res.status(500).json({ message: "Verification error" });
  }
});

/**
 * =====================================
 * DEBUG ENDPOINTS
 * =====================================
 */

/**
 * GET /api/activation/debug/withdrawal-check
 * DEBUG - Check complete withdrawal eligibility
 * Protected: Regular user JWT token
 */
router.get("/debug/withdrawal-check", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Calculate total surveys from all plans
    let totalSurveysCompleted = 0;
    let plansActivated = [];
    let plansCompleted = [];
    
    if (user.plans) {
      for (const [planName, planData] of Object.entries(user.plans)) {
        if (planData) {
          totalSurveysCompleted += planData.surveys_completed || 0;
          if (planData.is_activated) {
            plansActivated.push(planName);
          }
          if (planData.completed) {
            plansCompleted.push(planName);
          }
        }
      }
    }
    
    // Get the latest activation request
    const latestActivation = user.activation_requests && user.activation_requests.length > 0 
      ? user.activation_requests[user.activation_requests.length - 1] 
      : null;
    
    // Check all possible conditions that could block withdrawal
    const checks = {
      is_activated: user.is_activated === true,
      hasActivatedPlan: plansActivated.length > 0,
      hasCompletedSurveys: totalSurveysCompleted >= 10,
      // Check if user.is_activated matches plan activation (for debugging mismatch)
      is_activated_matches_plans: user.is_activated === (plansActivated.length > 0),
      // Check if there's any pending activation request
      hasPendingActivation: user.activation_requests?.some(req => req.status === 'SUBMITTED') || false
    };
    
    // Determine why withdrawal might be failing
    let failureReason = null;
    if (!checks.hasActivatedPlan) {
      failureReason = "No plan has been activated yet";
    } else if (!checks.hasCompletedSurveys) {
      failureReason = `Insufficient surveys completed: ${totalSurveysCompleted}/10`;
    } else if (!checks.is_activated && plansActivated.length > 0) {
      failureReason = "user.is_activated flag is false but plans are activated - this is the bug we fixed!";
    } else if (checks.hasPendingActivation) {
      failureReason = "There's a pending activation request waiting for admin approval";
    } else if (!checks.is_activated) {
      failureReason = "Account is not activated";
    }
    
    const debug = {
      timestamp: new Date().toISOString(),
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      },
      activation_status: {
        is_activated: user.is_activated,
        welcome_bonus_received: user.welcome_bonus_received,
        welcome_bonus_withdrawn: user.welcome_bonus_withdrawn,
        welcome_bonus: user.welcome_bonus
      },
      earnings: {
        total_earned: user.total_earned,
        balance: user.balance
      },
      plans: {
        REGULAR: {
          surveys_completed: user.plans?.REGULAR?.surveys_completed || 0,
          is_activated: user.plans?.REGULAR?.is_activated || false,
          completed: user.plans?.REGULAR?.completed || false,
          activated_at: user.plans?.REGULAR?.activated_at
        },
        VIP: {
          surveys_completed: user.plans?.VIP?.surveys_completed || 0,
          is_activated: user.plans?.VIP?.is_activated || false,
          completed: user.plans?.VIP?.completed || false,
          activated_at: user.plans?.VIP?.activated_at
        },
        VVIP: {
          surveys_completed: user.plans?.VVIP?.surveys_completed || 0,
          is_activated: user.plans?.VVIP?.is_activated || false,
          completed: user.plans?.VVIP?.completed || false,
          activated_at: user.plans?.VVIP?.activated_at
        }
      },
      activation_requests: user.activation_requests?.map(req => ({
        id: req._id,
        plan: req.plan,
        status: req.status,
        amount: req.amount,
        created_at: req.created_at,
        processed_at: req.processed_at
      })),
      latest_activation: latestActivation ? {
        plan: latestActivation.plan,
        status: latestActivation.status,
        created_at: latestActivation.created_at
      } : null,
      totals: {
        totalSurveysCompleted,
        surveysNeeded: 10,
        surveysRemaining: Math.max(0, 10 - totalSurveysCompleted),
        plansActivated,
        plansCompleted,
        hasActivatedPlan: plansActivated.length > 0,
        hasCompletedRequiredSurveys: totalSurveysCompleted >= 10
      },
      withdrawal_check: {
        can_withdraw: checks.hasActivatedPlan && checks.hasCompletedSurveys && user.is_activated === true,
        checks: checks,
        failure_reason: failureReason,
        // Direct from withdrawal controller logic
        withdrawal_controller_would: {
          check1_is_activated: user.is_activated ? "PASS" : "FAIL",
          check2_surveys_completed: totalSurveysCompleted >= 10 ? "PASS" : `FAIL (${totalSurveysCompleted}/10)`
        }
      },
      fix_applied: {
        note: "We've updated activation.controller.js to set user.is_activated=true for ANY plan approval",
        needs_admin_reapproval: plansActivated.length > 0 && !user.is_activated,
        suggested_fix: plansActivated.length > 0 && !user.is_activated 
          ? "Run this in MongoDB: db.users.updateOne({_id: ObjectId('" + user._id + "')}, {$set: {is_activated: true}})" 
          : "No fix needed"
      }
    };
    
    res.json(debug);
  } catch (error) {
    console.error("❌ Debug withdrawal check error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
});

/**
 * GET /api/activation/debug/fix-activation
 * DEBUG - Temporarily fix user.is_activated for testing
 * Protected: Regular user JWT token
 */
router.post("/debug/fix-activation", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if any plan is activated
    let hasActivatedPlan = false;
    if (user.plans) {
      for (const planData of Object.values(user.plans)) {
        if (planData && planData.is_activated) {
          hasActivatedPlan = true;
          break;
        }
      }
    }
    
    if (hasActivatedPlan && !user.is_activated) {
      // Fix the mismatch
      user.is_activated = true;
      await user.save();
      
      res.json({
        message: "✅ Fixed: user.is_activated has been set to true",
        before: { is_activated: false, hasActivatedPlan },
        after: { is_activated: true, hasActivatedPlan }
      });
    } else if (user.is_activated) {
      res.json({
        message: "ℹ️ user.is_activated is already true",
        is_activated: true,
        hasActivatedPlan
      });
    } else {
      res.json({
        message: "❌ Cannot fix: No activated plans found. Please complete activation first.",
        hasActivatedPlan: false,
        plans: user.plans
      });
    }
  } catch (error) {
    console.error("❌ Debug fix activation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;