const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { awardReferralCommission } = require("./affiliate.controller");

const TOTAL_SURVEYS = 10;

/* ===============================
   PLAN ACTIVATION FEES (AMOUNT USER PAYS)
================================ */
const PLAN_FEES = {
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
    console.log("PLAN_FEES for this plan:", PLAN_FEES[req.body.plan?.toUpperCase()]);
    
    const userId = req.user.id;
    const { mpesa_code, plan } = req.body;
    const paymentReference = String(mpesa_code || "").trim();

    if (!paymentReference) {
      return res.status(400).json({
        message: "Please enter the M-Pesa payment reference",
      });
    }

    if (!PLAN_FEES[plan]) {
      return res.status(400).json({
        message: "Invalid plan",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has the plan
    if (!user.plans || !user.plans[plan]) {
      return res.status(400).json({ message: "Survey plan not found" });
    }

    const userPlan = user.plans[plan];

    // Check if surveys are completed
    if (!userPlan.completed || userPlan.surveys_completed !== TOTAL_SURVEYS) {
      return res.status(400).json({
        message: "Complete all surveys before activation",
      });
    }

    // Check if already activated
    if (userPlan.is_activated) {
      return res.status(400).json({
        message: "Plan already activated",
      });
    }

    // Initialize activation_requests array if it doesn't exist
    if (!user.activation_requests) {
      user.activation_requests = [];
    }
    
    // Check for existing pending activation for this plan
    const existingRequest = user.activation_requests.find(
      req => req.plan === plan && req.status === 'SUBMITTED'
    );
    
    if (existingRequest) {
      return res.status(400).json({
        message: "Activation already submitted and pending approval",
      });
    }
    
    // Add new activation request
    user.activation_requests.push({
      plan: plan,
      mpesa_code: paymentReference,
      amount: PLAN_FEES[plan],
      status: 'SUBMITTED',
      created_at: new Date()
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

    return res.json({
      activation_status: "SUBMITTED",
      activation_required: true,
      withdraw_unlocked: false,
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

    // Check if user has the plan completed
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

    if (userPlan.is_activated) {
      return res.status(400).json({
        message: "Plan already activated",
      });
    }

    // Update activation request status
    activationRequest.status = 'APPROVED';
    activationRequest.processed_at = new Date();

    // Activate the plan
    user.plans[plan].is_activated = true;
    user.plans[plan].activated_at = new Date();
    
    // ALWAYS set user.is_activated = true when ANY plan is activated
    user.is_activated = true;
    
    // Add CORRECT earnings to user's balance
    const earningsToAdd = PLAN_EARNINGS[plan] || 0;
    const oldBalance = user.total_earned || 0;
    user.total_earned = oldBalance + earningsToAdd;
    
    console.log(`💰 Added KES ${earningsToAdd} to user balance for ${plan} plan activation`);
    console.log(`💰 Old balance: KES ${oldBalance}, New balance: KES ${user.total_earned}`);
    
    // Track which plan activated the user
    user.activated_by = plan;
    user.activated_at = new Date();
    
    await user.save();

    // Award referral commission to the referrer if this user was referred
    if (user.referred_by) {
      try {
        const commissionResult = await awardReferralCommission(user._id);
        if (commissionResult.success) {
          console.log(`💰 Referral commission of KES ${commissionResult.amount} awarded for user ${user.full_name}`);
        }
      } catch (commError) {
        console.error("Referral commission error:", commError);
      }
    }

    console.log(`✅ Activation approved - User: ${user.full_name || user.email}, Plan: ${plan}, Balance: KES ${user.total_earned}`);

    // Create notification for activation approval
    try {
      const notification = new Notification({
        user_id: user._id,
        title: `✅ ${plan} Plan Activated!`,
        message: `Your ${plan} plan has been successfully activated! KES ${earningsToAdd} has been added to your balance. You can now withdraw your earnings.`,
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
      balance_before: oldBalance,
      balance_added: earningsToAdd,
      new_balance: user.total_earned
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

/* =====================================
   USER — INITIATE DIRECT STK PUSH (NO REDIRECT)
   Customers pay directly on your app
   ===================================== */
exports.initiateDirectStkPush = async (req, res) => {
  try {
    const { plan, phone_number } = req.body;
    const userId = req.user.id;
    
    // Validate plan
    const planKey = plan?.toUpperCase();
    if (!PLAN_FEES[planKey]) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected"
      });
    }
    
    const amount = PLAN_FEES[planKey];
    
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Check if user has completed surveys
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
    
    // Check if already activated
    if (userPlan.is_activated) {
      return res.status(400).json({
        success: false,
        message: "Plan already activated"
      });
    }
    
    // Check for pending activation
    if (user.activation_requests?.some(r => r.plan === planKey && r.status === 'SUBMITTED')) {
      return res.status(400).json({
        success: false,
        message: "Activation already pending approval"
      });
    }
    
    // Create payment reference
    const reference = `PAYN_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Store payment info in user record
    user.last_payment_reference = reference;
    user.last_payment_attempt = new Date();
    user.last_payment_plan = planKey;
    user.payment_method = "paynecta_direct";
    await user.save();
    
    // Initialize Paynecta STK Push
    const paynectaService = require("../services/paynecta.service");
    
    const paymentResult = await paynectaService.initiateSTKPush(
      amount,
      phone_number,
      user.email,
      userId,
      `${planKey} Activation`
    );
    
    if (paymentResult.success) {
      return res.json({
        success: true,
        message: "STK Push sent! Check your phone and enter PIN.",
        reference: reference,
        checkout_request_id: paymentResult.checkout_request_id,
        amount: amount,
        plan: planKey
      });
    } else {
      // Clear the stored reference if payment failed
      user.last_payment_reference = null;
      await user.save();
      
      return res.status(400).json({
        success: false,
        message: paymentResult.message || "Failed to initiate payment. Please try again.",
        details: paymentResult.details
      });
    }
  } catch (error) {
    console.error("❌ Direct STK Push error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: " + error.message
    });
  }
};