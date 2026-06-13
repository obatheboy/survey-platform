const express = require("express");
const router = express.Router();
const User = require("../models/User");

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
  VIP: 200,
  VVIP: 300,
  WELCOME_BONUS: 100
};

const PLAN_NAMES = {
  REGULAR: "SurveyEarn REGULAR",
  VIP: "SurveyEarn VIP",
  VVIP: "SurveyEarn VVIP",
  WELCOME_BONUS: "SurveyEarn Welcome Bonus"
};

// ✅ MANUAL PAYMENT ONLY - Auto-initiate/auto-verify routes removed

/**
 * POST /api/activation/submit
 * User submits activation payment (manual)
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
      login_fee_paid: user.login_fee_paid || false
    });
  } catch (error) {
    res.status(500).json({ message: "Error checking status" });
  }
});

/**
 * POST /api/activation/verify
 * Verify payment and activate plan (manual approval version)
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
    
    // Create pending request for admin approval
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
    
    res.json({ success: true, message: "Payment submitted for admin approval" });
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
 */
router.get("/debug/withdrawal-check", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
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
    
    const checks = {
      is_activated: user.is_activated === true,
      hasActivatedPlan: plansActivated.length > 0,
      hasCompletedSurveys: totalSurveysCompleted >= 10,
      is_activated_matches_plans: user.is_activated === (plansActivated.length > 0),
      hasPendingActivation: user.activation_requests?.some(req => req.status === 'SUBMITTED') || false,
      all_plans_paid: user.all_plans_completed === true
    };
    
    let failureReason = null;
    if (!checks.hasActivatedPlan) {
      failureReason = "No plan has been activated yet";
    } else if (!checks.hasCompletedSurveys) {
      failureReason = `Insufficient surveys completed: ${totalSurveysCompleted}/10`;
    } else if (!checks.all_plans_paid) {
      failureReason = "Not all plans have been paid yet";
    }
    
    res.json({
      timestamp: new Date().toISOString(),
      totals: {
        totalSurveysCompleted,
        surveysNeeded: 10,
        surveysRemaining: Math.max(0, 10 - totalSurveysCompleted),
        plansActivated,
        plansCompleted
      },
      withdrawal_check: {
        can_withdraw: checks.all_plans_paid && checks.hasActivatedPlan && checks.hasCompletedSurveys && user.is_activated === true,
        checks: checks,
        failure_reason: failureReason
      }
    });
  } catch (error) {
    console.error("Debug withdrawal check error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/activation/debug/fix-activation
 * DEBUG - Fix user.is_activated for testing
 */
router.post("/debug/fix-activation", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let hasActivatedPlan = false;
    if (user.plans) {
      for (const planData of Object.values(user.plans)) {
        if (planData && planData.is_activated) {
          hasActivatedPlan = true;
          break;
        }
      }
    }

    // Only activate account when ALL 4 plans are paid (not just one plan)
    const allPlansTypes = ["WELCOME_BONUS", "REGULAR", "VIP", "VVIP"];
    const allPaid = allPlansTypes.every(p => user.plans_paid[p] === true);
    user.all_plans_completed = allPaid;
    user.is_activated = allPaid;

    if (allPaid) {
      await user.save();

      return res.json({
        message: "✅ Fixed: user.is_activated has been set to true",
        before: { is_activated: false, hasActivatedPlan },
        after: { is_activated: true, hasActivatedPlan }
      });
    }

    await user.save();

    if (user.is_activated) {
      return res.json({
        message: "ℹ️ user.is_activated is already true",
        is_activated: true,
        hasActivatedPlan
      });
    }

    if (!hasActivatedPlan) {
      return res.json({
        message: "❌ Cannot fix: No activated plans found. Please complete activation first.",
        hasActivatedPlan: false
      });
    }

    return res.json({
      message: "⚠️ Not all plans paid yet. Account not activated.",
      is_activated: false,
      hasActivatedPlan,
      all_plans_completed: allPaid
    });
  } catch (error) {
    console.error("Debug fix activation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;