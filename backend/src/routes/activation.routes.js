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

/**
 * POST /api/activation/initiate
 * Initiate M-Pesa STK Push via Paystack (Direct STK - No Redirect)
 * NOTE: Paystack is now disabled - Use Paynecta instead
 */
router.post("/initiate", protect, async (req, res) => {
  try {
    const { plan, is_welcome_bonus, phone } = req.body;
    const planKey = is_welcome_bonus ? "WELCOME_BONUS" : plan?.toUpperCase();
    const amount = PLAN_FEES[planKey];
    
    if (!amount) {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const phoneNumber = phone || user.phone;
    
    console.log("========== STARTING PAYSTACK STK PUSH (DISABLED) ==========");
    console.log("Phone:", phoneNumber);
    console.log("Amount:", amount);
    console.log("Plan:", planKey);
    console.log("================================================");
    
    // Paystack is disabled - return message to use Paynecta
    return res.json({
      success: false,
      message: "Please use Paynecta widget to complete payment.",
      use_paynecta: true
    });
  } catch (error) {
    console.error("Activation error:", error.message);
    return res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
});

/**
 * POST /api/activation/initiate-paynecta
 * Initiate Paynecta payment for plan activation
 */
router.post("/initiate-paynecta", protect, async (req, res) => {
  try {
    const { plan, is_welcome_bonus, amount } = req.body;
    const planKey = is_welcome_bonus ? "REGULAR" : plan?.toUpperCase();
    const paymentAmount = amount || PLAN_FEES[planKey];
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("=== INITIATE PAYNECTA PAYMENT ===");
    console.log("User:", user.phone);
    console.log("Plan:", planKey);
    console.log("Amount:", paymentAmount);
    
    // Create payment reference
    const reference = `PAYN_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Store reference for verification
    user.last_payment_reference = reference;
    user.last_payment_attempt = new Date();
    user.last_payment_plan = planKey;
    user.payment_method = "paynecta";
    await user.save();
    
    // Generate payment URL
    const paymentUrl = `https://paynecta.co.ke/pay/survey-app?amount=${paymentAmount}&phone=${user.phone}&reference=${reference}`;
    
    return res.json({
      success: true,
      message: "Payment initiated via Paynecta",
      reference: reference,
      paymentUrl: paymentUrl,
      amount: paymentAmount,
      phone: user.phone
    });
    
  } catch (error) {
    console.error("Paynecta initiate error:", error.message);
    return res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
});

/**
 * POST /api/activation/verify-paynecta
 * Verify Paynecta payment and activate plan
 */
router.post("/verify-paynecta", protect, async (req, res) => {
  try {
    const { reference, plan, is_welcome_bonus } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const planKey = is_welcome_bonus ? "REGULAR" : plan?.toUpperCase();
    const amount = PLAN_FEES[planKey];
    
    console.log("=== VERIFY PAYNECTA PAYMENT ===");
    console.log("Reference:", reference);
    console.log("Plan:", planKey);
    
    // Verify the payment reference matches
    if (user.last_payment_reference !== reference) {
      return res.status(400).json({ success: false, message: "Invalid payment reference" });
    }
    
    // Activate the plan
    if (!user.plans) user.plans = {};
    if (!user.plans[planKey]) user.plans[planKey] = {};
    
    user.plans[planKey].is_activated = true;
    user.plans[planKey].activated_at = new Date();
    user.is_activated = true;
    user.account_activated = true;
    
    // Create activation record
    if (!user.activation_requests) user.activation_requests = [];
    user.activation_requests.push({
      plan: planKey,
      amount: amount,
      reference: reference,
      status: "APPROVED",
      payment_method: "paynecta",
      created_at: new Date(),
      processed_at: new Date()
    });
    
    await user.save();
    
    console.log("✅ Plan activated via Paynecta:", planKey);
    
    return res.json({
      success: true,
      message: "Payment verified! Plan activated.",
      activated: true,
      plan: planKey
    });
    
  } catch (error) {
    console.error("Paynecta verify error:", error.message);
    return res.status(500).json({ success: false, message: "Verification failed: " + error.message });
  }
});

/**
 * POST /api/activation/submit
 * User submits activation payment (manual fallback)
 * Protected: Regular user JWT token
 */
router.post("/submit", protect, activationController.submitActivationPayment);

/**
 * POST /api/activation/verify-stk
 * Verify payment status (admin can use this to check before approving)
 * Protected: Regular user JWT token
 */
router.post("/verify-stk", protect, async (req, res) => {
  try {
    const { reference, plan, is_welcome_bonus } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!reference) {
      return res.status(400).json({ success: false, message: "Missing payment reference" });
    }

    // ✅ Use Paystack to verify payment
    const result = await paystackService.verifyPayment(reference);

    if (result.success && result.verified) {
      const planKey = is_welcome_bonus ? "REGULAR" : plan?.toUpperCase() || "REGULAR";
      const amount = PLAN_FEES[planKey];

      // Activate the plan
      if (!user.plans) user.plans = {};
      if (!user.plans[planKey]) user.plans[planKey] = {};
      
      user.plans[planKey].is_activated = true;
      user.plans[planKey].activated_at = new Date();
      user.is_activated = true;
      user.account_activated = true;

      // Create activation record
      if (!user.activation_requests) user.activation_requests = [];
      user.activation_requests.push({
        plan: planKey,
        amount: amount,
        reference: result.reference,
        status: "APPROVED",
        mpesa_receipt: result.receipt,
        created_at: new Date(),
        processed_at: new Date()
      });

      await user.save();

      return res.json({
        success: true,
        message: "Payment verified! Account activated.",
        activated: true,
        receipt: result.receipt
      });
    }

    return res.json({
      success: false,
      message: result.message || "Payment not yet completed. Admin will approve manually.",
      status: "pending"
    });
  } catch (error) {
    console.error("Verify STK error:", error.message);
    res.status(500).json({ success: false, message: "Verification failed: " + error.message });
  }
});

/**
 * POST /api/activation/webhook
 * ❌ REMOVED - No webhook needed for manual approval
 * (Keeping endpoint but not processing auto-approval)
 */
router.post("/webhook", async (req, res) => {
  // Manual approval only - no auto processing
  console.log("Webhook received but manual approval mode is enabled. No auto-approval.");
  res.status(200).json({ received: true, manual_approval: true });
});

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
      hasPendingActivation: user.activation_requests?.some(req => req.status === 'SUBMITTED') || false
    };
    
    let failureReason = null;
    if (!checks.hasActivatedPlan) {
      failureReason = "No plan has been activated yet";
    } else if (!checks.hasCompletedSurveys) {
      failureReason = `Insufficient surveys completed: ${totalSurveysCompleted}/10`;
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
        can_withdraw: checks.hasActivatedPlan && checks.hasCompletedSurveys && user.is_activated === true,
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
    
    if (hasActivatedPlan && !user.is_activated) {
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
        hasActivatedPlan: false
      });
    }
  } catch (error) {
    console.error("Debug fix activation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;