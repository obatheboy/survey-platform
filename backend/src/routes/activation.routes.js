const express = require("express");
const router = express.Router();
const User = require("../models/User"); // ✅ ADDED: Import User model for debug

const { protect } = require("../middlewares/auth.middleware");
const activationController = require("../controllers/activation.controller");

/**
 * =====================================
 * USER ACTIVATION ROUTES ONLY
 * Path: /api/activation
 * =====================================
 */

/**
 * POST /api/activation/submit
 * User submits activation payment
 * Protected: Regular user JWT token
 */
router.post("/submit", protect, activationController.submitActivationPayment);

/**
 * POST /api/activation/submit-initial
 * User submits initial account activation payment (100 KES)
 * Protected: Regular user JWT token
 */
router.post("/submit-initial", protect, activationController.submitInitialActivation);

/**
 * GET /api/activation/status
 * User checks activation status
 * Protected: Regular user JWT token
 */
router.get("/status", protect, activationController.checkInitialActivationStatus);

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