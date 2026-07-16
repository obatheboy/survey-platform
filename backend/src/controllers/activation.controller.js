const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { awardReferralCommission } = require("./affiliate.controller");
const megaPayService = require("../services/megapay.service");
const { ACTIVATION_PLANS, syncActivationStatus, buildActivationRedirect } = require("../utils/activationStatus");

const TOTAL_SURVEYS = 10;

/* ===============================
   PLAN ACTIVATION FEES (AMOUNT USER PAYS)
================================ */
const PLAN_FEES = {
  WELCOME_BONUS: 100,
  REGULAR: 100,
  VIP: 200,
  VVIP: 300,
};

/* ===============================
   PLAN EARNINGS (AMOUNT USER CAN WITHDRAW)
================================ */
const PLAN_EARNINGS = {
  REGULAR: 1500,
  VIP: 2000,
  VVIP: 3000,
  WELCOME_BONUS: 1200,
};

/* =====================================
   USER — SUBMIT ACTIVATION PAYMENT
   ===================================== */
exports.submitActivationPayment = async (req, res) => {
  try {
    console.log("🔍 ACTIVATION SUBMISSION DEBUG:");
    console.log("User ID:", req.user.id);
    console.log("Request body:", req.body);
    console.log("Plan received:", req.body.plan);
    console.log("Plan uppercase:", req.body.plan?.toUpperCase());
    
    const userId = req.user.id;
    const { mpesa_code, plan, is_welcome_bonus } = req.body;
    const paymentReference = String(mpesa_code || "").trim();
    // Determine plan key - welcome bonus uses REGULAR plan
    const planKey = is_welcome_bonus ? "WELCOME_BONUS" : (plan?.toUpperCase());

    console.log("PLAN_FEES for this plan:", PLAN_FEES[planKey]);
    
    if (!paymentReference) {
      return res.status(400).json({
        message: "Please enter the M-Pesa payment reference",
      });
    }

    if (!PLAN_FEES[planKey]) {
      return res.status(400).json({
        message: "Invalid plan",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Welcome bonus does not use the REGULAR/VIP/VVIP plan structure.
    if (planKey !== "WELCOME_BONUS") {
      if (!user.plans || !user.plans[planKey]) {
        return res.status(400).json({ message: "Survey plan not found" });
      }
    }

    const userPlan = user.plans?.[planKey];

    // Skip survey completion check for welcome bonus
    if (planKey !== "WELCOME_BONUS") {
      if (!userPlan.completed || userPlan.surveys_completed !== TOTAL_SURVEYS) {
        return res.status(400).json({
          message: "Complete all surveys before activation",
        });
      }
    }

    // Check if already activated
    if (planKey !== "WELCOME_BONUS" && userPlan?.is_activated) {
      return res.status(400).json({
        message: "Plan already activated",
      });
    }

    // Initialize activation_requests array if it doesn't exist
    if (!user.activation_requests) {
      user.activation_requests = [];
    }
    
    // Add new activation request (include is_welcome_bonus flag)
    // Users can submit multiple payment attempts - admin will see all
user.activation_requests.push({
       plan: planKey,
       mpesa_code: paymentReference,
       amount: PLAN_FEES[planKey],
       status: 'SUBMITTED',
       created_at: new Date(),
       is_welcome_bonus: !!is_welcome_bonus,
       payment_method: "megapay"
     });
    
    await user.save();

    // Debug: Check what was saved
    const savedRequest = user.activation_requests[user.activation_requests.length - 1];
    console.log("💾 Saved activation request:", {
      plan: savedRequest.plan,
      amount: savedRequest.amount,
      status: savedRequest.status
    });

    // Create notification for activation submission
    try {
      const notification = new Notification({
        user_id: user._id,
        title: `📝 ${plan} Activation Submitted`,
        message: `Your ${plan} plan activation request has been submitted. Awaiting admin approval.`,
        action_route: "/dashboard",
        type: "activation"
      });
      await notification.save();
    } catch (notifError) {
      console.error("❌ Activation submission notification error:", notifError);
    }

    const redirect = buildActivationRedirect(user);

    return res.json({
      activation_status: "SUBMITTED",
      activation_required: true,
      withdraw_unlocked: user.is_activated === true,
      user_activated: user.is_activated === true,
      all_plans_completed: user.all_plans_completed === true,
      redirect_to: redirect.redirect_to,
      redirect_focus: {
        plan: redirect.next_plan,
        label: redirect.next_plan,
        message: redirect.next_plan ? `Next step: continue with ${redirect.next_plan} on your dashboard.` : "All plans are complete. You can withdraw now."
      },
      remaining_plans: redirect.remaining_plans,
      message: "Payment submitted successfully. Awaiting admin approval.",
    });
  } catch (error) {
    console.error("❌ Activation submit error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =====================================
   ADMIN — APPROVE ACTIVATION
   ===================================== */
exports.approveActivation = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const { userId, activationId } = req.body;

    if (!userId || !activationId) {
      return res.status(400).json({ 
        message: "User ID and Activation ID required" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the activation request
    const activationRequest = user.activation_requests.id(activationId);
    if (!activationRequest) {
      return res.status(404).json({ message: "Activation request not found" });
    }

    if (activationRequest.status !== 'SUBMITTED') {
      return res.status(400).json({
        message: "Activation already processed",
      });
    }

    const plan = activationRequest.plan;
    const isWelcomeBonus = activationRequest.is_welcome_bonus === true;

    // For non-welcome-bonus, enforce survey completion; for welcome bonus skip this check
    if (!isWelcomeBonus) {
      if (!user.plans || !user.plans[plan]) {
        return res.status(400).json({
          message: "User has not completed required surveys",
        });
      }

      const userPlan = user.plans[plan];
      
      if (!userPlan.completed || userPlan.surveys_completed !== TOTAL_SURVEYS) {
        return res.status(400).json({
          message: "User has not completed required surveys",
        });
      }
    } else {
      if (!user.plans) user.plans = {};
    }

    // Check if already activated
    if (plan !== "WELCOME_BONUS" && user.plans[plan]?.is_activated) {
      return res.status(400).json({
        message: "Plan already activated",
      });
    }

    // Update activation request status
    activationRequest.status = 'APPROVED';
    activationRequest.processed_at = new Date();

    // Activate the plan
    if (plan !== "WELCOME_BONUS" && user.plans[plan]) {
      user.plans[plan].is_activated = true;
      user.plans[plan].activated_at = new Date();
    }
    
    // Mark plan as paid
    if (plan !== "WELCOME_BONUS") {
      if (!user.plans_paid) user.plans_paid = {};
      user.plans_paid[plan] = true;
    }

    // Check if all plans are paid OR all plans are activated (manual activation)
    syncActivationStatus(user);
    const shouldActivate = user.is_activated === true;
    const allPaid = ACTIVATION_PLANS.every(p => user.plans_paid?.[p] === true);
    
    const redirect = buildActivationRedirect(user);
    
    user.all_plans_completed = shouldActivate;
    user.is_activated = shouldActivate;
    if (shouldActivate && !user.activated_at) {
      user.activated_at = new Date();
      user.activated_by = plan;
    }

    // Credit earnings to total_earned:
    // Welcome bonus: credited here only (earnings were earned via signup, not surveys)
    // Regular/VIP/VVIP: earnings already credited on 10th survey completion (survey.controller.js)
    let creditAmount;
    if (isWelcomeBonus) {
      creditAmount = user.welcome_bonus || 1200;
      user.welcome_bonus_received = true;
      if (!user.plans_paid) user.plans_paid = {};
      user.plans_paid.WELCOME_BONUS = true;
    } else {
      creditAmount = 0; // Earnings already credited when 10th survey was completed
    }
    
    const oldBalance = user.total_earned || 0;
    // Only apply credit for welcome bonus; keep existing balance for normal plans
    if (creditAmount > 0) {
      user.total_earned = oldBalance + creditAmount;
    }
    
    console.log(`💰 Added KES ${creditAmount} to user balance for ${plan} plan activation${isWelcomeBonus ? ' (welcome bonus)' : ''}`);
    console.log(`💰 Old balance: KES ${oldBalance}, New balance: KES ${user.total_earned}`);

    await user.save();

    // Calculate remaining unpaid plans for redirect
    const redirectTo = redirect.redirect_to;

    console.log(`➡️ Redirect to: ${redirectTo}`);

    // Create notification for activation approval
    try {
      const notification = new Notification({
        user_id: user._id,
        title: `✅ ${plan} Plan Activated!`,
        message: `Your ${plan} plan has been successfully activated! You can now withdraw your earnings of KES ${PLAN_EARNINGS[plan] || 0}.`,
        action_route: "/withdraw",
        type: "activation"
      });
      await notification.save();
    } catch (notifError) {
      console.error("❌ Activation approval notification error:", notifError);
    }

    return res.json({
      success: true,
      message: "Activation approved",
      plan: plan,
      withdraw_unlocked: true,
      user_activated: user.is_activated,
      all_plans_completed: allPaid,
      balance_before: oldBalance,
      balance_added: creditAmount,
      new_balance: user.total_earned,
      redirect_to: redirectTo,
      redirect_focus: {
        plan: redirect.next_plan,
        label: redirect.next_plan,
        message: redirect.next_plan ? `Next step: continue with ${redirect.next_plan} on your dashboard.` : "All plans are complete. You can withdraw now."
      },
      remaining_plans: redirect.remaining_plans
    });
  } catch (error) {
    console.error("❌ Approve activation error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

/* =====================================
   ADMIN — REJECT ACTIVATION
===================================== */
exports.rejectActivation = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const { userId, activationId } = req.body;

    if (!userId || !activationId) {
      return res.status(400).json({ 
        message: "User ID and Activation ID required" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the activation request
    const activationRequest = user.activation_requests.id(activationId);
    if (!activationRequest) {
      return res.status(404).json({ 
        message: "Activation request not found" 
      });
    }

    if (activationRequest.status !== 'SUBMITTED') {
      return res.status(400).json({
        message: "Activation already processed",
      });
    }

    // Update activation request status
    activationRequest.status = 'REJECTED';
    activationRequest.processed_at = new Date();
    
    await user.save();

    // Create notification for activation rejection
    try {
      const notification = new Notification({
        user_id: user._id,
        title: `❌ ${activationRequest.plan} Activation Rejected`,
        message: `Your ${activationRequest.plan} plan activation request was rejected. Please check your M-Pesa payment and try again.`,
        action_route: "/activation",
        type: "system"
      });
      await notification.save();
    } catch (notifError) {
      console.error("❌ Activation rejection notification error:", notifError);
    }

    return res.json({ 
      success: true,
      message: "Activation rejected",
      user_id: userId,
      activation_id: activationId
    });
  } catch (error) {
    console.error("❌ Reject activation error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

/* =====================================
   ADMIN — GET PENDING ACTIVATIONS
===================================== */
exports.getPendingActivations = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    // Find all users with pending activation requests
    const users = await User.find({
      'activation_requests.status': 'SUBMITTED'
    }).select('full_name phone email activation_requests');

    // Format the response
    const pendingActivations = [];
    
    users.forEach(user => {
      user.activation_requests.forEach(activation => {
        if (activation.status === 'SUBMITTED') {
          pendingActivations.push({
            id: activation._id,
            user_id: user._id,
            full_name: user.full_name,
            phone: user.phone,
            email: user.email,
            plan: activation.plan,
            mpesa_code: activation.mpesa_code,
            amount: activation.amount,
            status: activation.status,
            created_at: activation.created_at
          });
        }
      });
    });

    return res.json({
      success: true,
      count: pendingActivations.length,
      payments: pendingActivations,
      message: "Pending activations retrieved successfully"
    });
  } catch (error) {
    console.error("❌ Get pending activations error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

/* =====================================
   ADMIN — GET ALL ACTIVATIONS (PENDING, APPROVED, REJECTED)
===================================== */
exports.getAllActivations = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    console.log("📞 GET /admin/activations called");
    
    // Find all users with activation requests
    const users = await User.find({
      'activation_requests.0': { $exists: true }
    }).select('full_name phone email activation_requests');

    console.log(`✅ Found ${users.length} users with payments`);
    
    // Format the response
    const allActivations = [];
    
    users.forEach(user => {
      user.activation_requests.forEach(activation => {
        allActivations.push({
          id: activation._id,
          user_id: user._id,
          full_name: user.full_name,
          phone: user.phone,
          email: user.email,
          plan: activation.plan,
          mpesa_code: activation.mpesa_code,
          amount: activation.amount,
          status: activation.status,
          created_at: activation.created_at,
          processed_at: activation.processed_at
        });
      });
    });

    // Sort by creation date (newest first)
    allActivations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    console.log(`📊 Returning ${allActivations.length} payments`);

    return res.json({
      success: true,
      count: allActivations.length,
      payments: allActivations,
      message: "Activations retrieved successfully"
    });
  } catch (error) {
    console.error("❌ Get all activations error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

/* =====================================
   WELCOME BONUS APPROVAL
   ===================================== */
exports.approveWelcomeBonus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const { userId, bonusId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add welcome bonus to balance
    const WELCOME_BONUS_AMOUNT = 1200;
    const oldBalance = user.total_earned || 0;
    user.total_earned = oldBalance + WELCOME_BONUS_AMOUNT;
    user.welcome_bonus_received = true;

    await user.save();

    console.log(`🎁 Welcome bonus approved - Added KES ${WELCOME_BONUS_AMOUNT} to ${user.full_name}`);

    return res.json({
      success: true,
      message: "Welcome bonus approved",
      balance_before: oldBalance,
      balance_added: WELCOME_BONUS_AMOUNT,
      new_balance: user.total_earned
    });
  } catch (error) {
    console.error("❌ Welcome bonus approval error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

/* =====================================
   WELCOME BONUS APPROVAL
   ===================================== */
exports.initiateDirectStkPush = async (req, res) => {
  try {
    const { plan, phone_number, is_welcome_bonus } = req.body;
    const userId = req.user.id;

    // Determine plan key - welcome bonus uses REGULAR plan
    const planKey = is_welcome_bonus ? "WELCOME_BONUS" : (plan?.toUpperCase());

    // Validate plan
    if (!megaPayService.getPlanAmountByKey(planKey)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected"
      });
    }

    const amount = megaPayService.getPlanAmountByKey(planKey);

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Skip survey completion check for welcome bonus
    if (!is_welcome_bonus) {
      if (!user.plans || !user.plans[planKey]) {
        return res.status(400).json({
          success: false,
          message: "Complete all surveys before activation"
        });
      }

      const userPlan = user.plans[planKey];

      if (!userPlan.completed || userPlan.surveys_completed !== TOTAL_SURVEYS) {
        return res.status(400).json({
          success: false,
          message: `Complete ${TOTAL_SURVEYS - (userPlan.surveys_completed || 0)} more surveys to activate`
        });
      }
    }

    // Check if already activated
    const userPlan = user.plans?.[planKey];
    if (userPlan && userPlan.is_activated) {
      return res.status(400).json({
        success: false,
        message: "Plan already activated"
      });
    }

    // Generate unique order reference for MegaPay (internal, can be long)
    const orderReference = `SURVEY_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Short reference for MegaPay (their TransactionReference column is short)
    const megaPayReference = megaPayService.generateShortReference("AC");

    // Store payment info in user record
    if (!user.activation_requests) {
      user.activation_requests = [];
    }

    user.activation_requests.push({
      plan: planKey,
      mpesa_code: orderReference,
      amount: amount,
      status: 'SUBMITTED',
      created_at: new Date(),
      is_welcome_bonus: !!is_welcome_bonus,
      payment_method: "megapay"
    });

    user.last_payment_reference = orderReference;
    user.last_payment_attempt = new Date();
    user.last_payment_plan = planKey;
    user.payment_method = "megapay";
    await user.save();

    // Send STK Push via MegaPay
    const paymentResult = await megaPayService.initiateSTKPush(
      amount,
      phone_number,
      megaPayReference
    );

    if (paymentResult.success) {
      // Get actual MegaPay transaction_request_id from response
      const transactionRequestId = paymentResult.transaction_request_id || megaPayReference;

      // Update activation request with actual MegaPay reference
      const lastRequest = user.activation_requests[user.activation_requests.length - 1];
      lastRequest.mpesa_code = transactionRequestId;
      user.last_payment_reference = transactionRequestId;
      await user.save();

      return res.json({
        success: true,
        message: "STK Push sent! Check your phone and enter PIN.",
        reference: transactionRequestId,
        transaction_request_id: paymentResult.transaction_request_id || null,
        amount: amount,
        plan: planKey
      });
    } else {
      // Clear the stored reference if payment failed
      user.activation_requests.pop();
      user.last_payment_reference = null;
      await user.save();

      return res.status(400).json({
        success: false,
        message: paymentResult.message || "Failed to initiate payment. Please try again.",
        details: paymentResult.details
      });
    }
  } catch (error) {
    console.error("❌ MegaPay STK Push error:", error);

    // Handle DNS/connection errors
    if (error.code === 'ENOTFOUND' || (error.message && error.message.includes("ENOTFOUND"))) {
      return res.status(503).json({
        success: false,
        message: "Payment gateway temporarily unavailable. Please try again in a few minutes.",
        error: "DNS_RESOLUTION_FAILED"
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: "Payment gateway connection refused. Please try again later.",
        error: "CONNECTION_REFUSED"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error: " + error.message
    });
  }
};

/* =====================================
   DEBUG - Test endpoint format
===================================== */
exports.testActivationFormat = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    console.log("🧪 TEST: Checking getAllActivations format");
    
    const users = await User.find({
      'activation_requests.0': { $exists: true }
    }).limit(1).select('full_name phone email activation_requests');

    const allActivations = [];
    
    users.forEach(user => {
      user.activation_requests.forEach(activation => {
        allActivations.push({
          id: activation._id,
          user_id: user._id,
          full_name: user.full_name,
          phone: user.phone,
          email: user.email,
          plan: activation.plan,
          mpesa_code: activation.mpesa_code,
          amount: activation.amount,
          status: activation.status,
          created_at: activation.created_at,
          processed_at: activation.processed_at
        });
      });
    });

    console.log("🧪 TEST: Sample item:", allActivations[0] || 'No items');
    
    return res.json({
      success: true,
      count: allActivations.length,
      payments: allActivations,
      message: "Test format successful"
    });
  } catch (error) {
    console.error("🧪 TEST Error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Test error",
      error: error.message 
    });
  }
};