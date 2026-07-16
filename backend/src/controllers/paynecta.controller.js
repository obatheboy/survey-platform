const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");
const jwt = require("jsonwebtoken");
const megaPayService = require("../services/megapay.service");

const TOTAL_SURVEYS = 10;

/* ===============================
   PLAN PAYMENT AMOUNTS
=============================== */
const PLAN_FEES = {
  WELCOME_BONUS: 100,
  REGULAR: 100,
  VIP: 200,
  VVIP: 300,
};

const PLAN_EARNINGS = {
  REGULAR: 1500,
  VIP: 2000,
  VVIP: 3000,
  WELCOME_BONUS: 1200,
};

/* =====================================
     MEGAPAY STK PUSH - INITIATE PAYMENT (ONLY ACTIVE GATEWAY)
     ===================================== */
exports.initiatePaynectaPayment = async (req, res) => {
  try {
    const { plan, phone_number } = req.body;
    const userId = req.user?.id || req.body?.userId;

    console.log("=== MEGAPAY INITIATE PAYMENT ===");
    console.log("User ID:", userId);
    console.log("Plan:", plan);
    console.log("Phone:", phone_number);

    // Validate plan
    const planKey = (plan?.toUpperCase() === "WELCOME_BONUS" || plan?.toLowerCase() === "welcome") ? "WELCOME_BONUS" : (plan?.toUpperCase() || "");
    const amount = PLAN_FEES[planKey];

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected. Valid plans: welcome_bonus, regular, vip, vvip"
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    // Validate phone number
    if (!phone_number) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate temporary internal reference (will be replaced with Paynecta's reference after success)
    const tempReference = `TEMP_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Store payment info in user record for admin verification
    if (!user.activation_requests) {
      user.activation_requests = [];
    }

    const isWelcomeBonus = planKey === "WELCOME_BONUS";

    // Generate unique order reference for MegaPay (internal, can be long)
    const orderReference = `SURVEY_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Short reference for MegaPay (their TransactionReference column is short)
    const megaPayReference = megaPayService.generateShortReference("AC");

    // Add activation request for admin tracking (temporary reference)
    user.activation_requests.push({
      plan: planKey,
      mpesa_code: orderReference,
      amount: amount,
      status: 'SUBMITTED',
      created_at: new Date(),
      is_welcome_bonus: isWelcomeBonus,
      payment_method: "megapay"
    });

    // Store last payment reference temporarily
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

      console.log(`✅ MegaPay STK Push sent for ${planKey} - User: ${user._id}`);

      // Send notification to user
      try {
        const notification = new Notification({
          user_id: user._id,
          title: `🔔 ${isWelcomeBonus ? 'Welcome Bonus' : planKey} Payment`,
          message: `STK push of KES ${amount} sent to ${phone_number}. Enter your M-Pesa PIN to complete payment. Your plan will be activated after payment is confirmed.`,
          action_route: "/activate",
          type: "payment"
        });
        await notification.save();
      } catch (notifError) {
        console.error("Notification error:", notifError);
      }

      return res.status(200).json({
        success: true,
        message: "STK Push sent! Check your M-Pesa and enter your PIN.",
        reference: transactionRequestId,
        transaction_request_id: paymentResult.transaction_request_id || null,
        amount: amount,
        plan: planKey,
        phone: paymentResult.phone,
        requires_manual_approval: true,
        instructions: "Please check your phone for the STK push and enter your PIN to complete payment."
      });
    } else {
      // Clear the stored reference if payment failed
      user.activation_requests.pop();
      user.last_payment_reference = null;
      await user.save();

      console.error("❌ MegaPay STK Push failed:", paymentResult.message);

      return res.status(400).json({
        success: false,
        message: paymentResult.message || "Failed to initiate STK Push. Please try again.",
        error_code: paymentResult.code || null,
        details: paymentResult.details || null
      });
    }
  } catch (error) {
    console.error("❌ MegaPay initiation error:", error);

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

    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({
        success: false,
        message: "Payment gateway timed out. Please try again.",
        error: "TIMEOUT"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error: " + (error.message || "Unknown error")
    });
  }
};

/* =====================================
   GET USER PAYMENT STATUS
   ===================================== */
exports.getUserPaymentStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check plan activation status
    const plans = user.plans || {};
    const activationStatus = {
      regular: {
        activated: !!plans.REGULAR?.is_activated,
        completed: !!plans.REGULAR?.completed,
        surveys_completed: plans.REGULAR?.surveys_completed || 0
      },
      vip: {
        activated: !!plans.VIP?.is_activated,
        completed: !!plans.VIP?.completed,
        surveys_completed: plans.VIP?.surveys_completed || 0
      },
      vvip: {
        activated: !!plans.VVIP?.is_activated,
        completed: !!plans.VVIP?.completed,
        surveys_completed: plans.VVIP?.surveys_completed || 0
      },
      welcome_bonus: user.welcome_bonus_received || false
    };

    // Check for pending payments (MegaPay)
    const pendingPayments = user.activation_requests?.filter(
      r => r.status === 'SUBMITTED' && r.payment_method === 'megapay'
    ) || [];

    res.status(200).json({
      success: true,
      activation_status: activationStatus,
      pending_payments: pendingPayments.map(p => ({
        id: p._id,
        plan: p.plan,
        amount: p.amount,
        status: p.status,
        reference: p.mpesa_code,
        created_at: p.created_at
      })),
      user_activated: user.is_activated || false
    });
  } catch (error) {
    console.error("Payment status check error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check payment status"
    });
  }
};

/* =====================================
   GET LAST PAYMENT REFERENCE
   ===================================== */
exports.getLastPaymentReference = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "Authentication required" });
    }

    const user = await User.findById(userId).select('last_payment_reference last_payment_plan payment_method');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      last_payment_reference: user.last_payment_reference || null,
      last_payment_plan: user.last_payment_plan || null,
      payment_method: user.payment_method || null
    });
  } catch (error) {
    console.error("Get payment reference error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payment reference"
    });
  }
};

/* =====================================
    ADMIN - MANUAL APPROVAL AFTER MEGAPAY VERIFICATION
    ===================================== */
exports.manualApprovePaynectaPayment = async (req, res) => {
  try {
    const { userId, activationId, notes } = req.body;
    const adminId = req.user?.id;

    console.log("=== MANUAL MEGAPAY APPROVAL ===");
    console.log("Admin ID:", adminId);
    console.log("User ID:", userId);
    console.log("Activation ID:", activationId);

    if (!userId || !activationId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Activation ID are required"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Find the activation request
    const activationRequest = user.activation_requests.id(activationId);
    if (!activationRequest) {
      return res.status(404).json({
        success: false,
        message: "Activation request not found"
      });
    }

    if (activationRequest.status !== 'SUBMITTED') {
      return res.status(400).json({
        success: false,
        message: "Activation already processed"
      });
    }

    // Ensure it's a MegaPay payment
    if (activationRequest.payment_method !== 'megapay') {
      return res.status(400).json({
        success: false,
        message: "This activation request is not for a MegaPay payment"
      });
    }

    const plan = activationRequest.plan;
    const isWelcomeBonus = activationRequest.is_welcome_bonus === true;

    // For welcome bonus, ensure user has a plan entry
    if (isWelcomeBonus) {
      if (!user.plans) user.plans = {};
      if (!user.plans.REGULAR) {
        user.plans.REGULAR = {
          surveys_completed: 0,
          completed: false,
          is_activated: false,
          total_surveys: 10,
          activated_at: null
        };
      }
    }

    // Check if already activated
    const userPlan = user.plans?.[plan];
    if (userPlan && userPlan.is_activated) {
      return res.status(400).json({
        success: false,
        message: "Plan already activated"
      });
    }

    // Update activation request status
    activationRequest.status = 'APPROVED';
    activationRequest.processed_at = new Date();
    activationRequest.approved_by = adminId;
    activationRequest.admin_notes = notes || "Manually approved after MegaPay verification";

    // Mark plan as paid in plans_paid
    if (!user.plans_paid) user.plans_paid = {};
    user.plans_paid[plan] = true;

    // Activate the plan
    if (userPlan) {
      userPlan.is_activated = true;
      userPlan.activated_at = new Date();
    }

    const allPlansTypes = ["REGULAR", "VIP", "VVIP"];
    const allPaid = allPlansTypes.every(p => user.plans_paid?.[p] === true);
    user.all_plans_completed = allPaid;
    user.is_activated = allPaid;
    if (allPaid) {
      user.activated_by = plan;
      user.activated_at = new Date();
    }

    // Credit earnings
    let creditAmount;
    if (isWelcomeBonus) {
      creditAmount = user.welcome_bonus || PLAN_EARNINGS.WELCOME_BONUS;
      user.welcome_bonus_received = true;
    } else {
      creditAmount = PLAN_EARNINGS[plan] || 0;
    }

    const oldBalance = user.total_earned || 0;
    user.total_earned = oldBalance + creditAmount;

    console.log(`✅ Manually approved MegaPay payment - ${plan} plan for user ${user.full_name}`);
    console.log(`💰 Added KES ${creditAmount} - Old: ${oldBalance}, New: ${user.total_earned}`);

    await user.save();

    // Calculate remaining unpaid plans for redirect
    const planOrderForRedirect = ["REGULAR", "VIP", "VVIP"];
    const remainingPlans = planOrderForRedirect.filter(p => user.plans_paid?.[p] !== true);
    const nextPlanKey = remainingPlans.length > 0 ? remainingPlans[0] : null;
    const redirectTo = allPaid ? "/withdraw" : (nextPlanKey ? `/dashboard?focusPlan=${nextPlanKey}&highlightPlan=${nextPlanKey}` : "/dashboard");

    console.log(`➡️ Redirect to: ${redirectTo}`);

    // Create notification
    try {
      const notification = new Notification({
        user_id: user._id,
        title: `✅ ${isWelcomeBonus ? 'Welcome Bonus' : plan} Plan Activated!`,
        message: `Your ${isWelcomeBonus ? 'Welcome Bonus' : plan} plan has been activated! KES ${creditAmount} has been added to your balance.`,
        action_route: isWelcomeBonus ? "/withdraw" : "/withdraw-form",
        type: "activation"
      });
      await notification.save();
    } catch (notifError) {
      console.error("Notification error:", notifError);
    }

    // Generate token for user
    const token = jwt.sign(
      { id: user._id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: `${isWelcomeBonus ? 'Welcome Bonus' : plan} plan approved successfully`,
      plan: plan,
      token: token,
      user: {
        id: user._id,
        full_name: user.full_name,
        phone: user.phone,
        is_activated: user.is_activated,
        all_plans_completed: allPaid,
        plans_paid: user.plans_paid
      },
      balance_before: oldBalance,
      balance_added: creditAmount,
      new_balance: user.total_earned,
      redirect_to: redirectTo,
      remaining_plans: remainingPlans.map(p => p === "WELCOME_BONUS" ? "Welcome Bonus" : p)
    });
  } catch (error) {
    console.error("❌ Manual approval error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve payment: " + error.message
    });
  }
};

/* =====================================
    ADMIN - REJECT MEGAPAY PAYMENT
    ===================================== */
exports.rejectPaynectaPayment = async (req, res) => {
  try {
    const { userId, activationId, reason } = req.body;

    if (!userId || !activationId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Activation ID are required"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const activationRequest = user.activation_requests.id(activationId);
    if (!activationRequest) {
      return res.status(404).json({
        success: false,
        message: "Activation request not found"
      });
    }

    if (activationRequest.status !== 'SUBMITTED') {
      return res.status(400).json({
        success: false,
        message: "Activation already processed"
      });
    }

    // Ensure it's a MegaPay payment
    if (activationRequest.payment_method !== 'megapay') {
      return res.status(400).json({
        success: false,
        message: "This activation request is not for a MegaPay payment"
      });
    }

    activationRequest.status = 'REJECTED';
    activationRequest.processed_at = new Date();
    activationRequest.admin_notes = reason || "Payment verification failed";

    await user.save();

    // Create notification
    try {
      const notification = new Notification({
        user_id: user._id,
        title: `❌ ${activationRequest.plan} Activation Rejected`,
        message: `Your ${activationRequest.plan} plan activation was rejected. Reason: ${reason || 'Payment not verified'}. Please try again.`,
        action_route: "/activate",
        type: "system"
      });
      await notification.save();
    } catch (notifError) {
      console.error("Notification error:", notifError);
    }

    return res.status(200).json({
      success: true,
      message: "Activation request rejected",
      user_id: userId,
      activation_id: activationId
    });
  } catch (error) {
    console.error("❌ Reject payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject payment: " + error.message
    });
  }
};

/* =====================================
    ADMIN - GET PENDING MEGAPAY PAYMENTS
    ===================================== */
exports.getPendingPaynectaPayments = async (req, res) => {
  try {
    const users = await User.find({
      'activation_requests.status': 'SUBMITTED',
      'activation_requests.payment_method': 'megapay'
    }).select('full_name phone email activation_requests created_at');

    const pendingPayments = [];

    users.forEach(user => {
      user.activation_requests.forEach(activation => {
        if (activation.status === 'SUBMITTED' && activation.payment_method === 'megapay') {
          pendingPayments.push({
            id: activation._id,
            user_id: user._id,
            full_name: user.full_name,
            phone: user.phone,
            email: user.email,
            plan: activation.plan,
            reference: activation.mpesa_code,
            amount: activation.amount,
            status: activation.status,
            is_welcome_bonus: activation.is_welcome_bonus || false,
            created_at: activation.created_at
          });
        }
      });
    });

    res.status(200).json({
      success: true,
      count: pendingPayments.length,
      payments: pendingPayments
    });
  } catch (error) {
    console.error("Get pending payments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pending payments"
    });
  }
};

/* =====================================
    ADMIN - GET ALL MEGAPAY PAYMENTS
    ===================================== */
exports.getAllPaynectaPayments = async (req, res) => {
  try {
    const users = await User.find({
      'activation_requests.0': { $exists: true }
    }).select('full_name phone email activation_requests');

    const allPayments = [];

    users.forEach(user => {
      user.activation_requests.forEach(activation => {
        if (activation.payment_method === 'megapay') {
          allPayments.push({
            id: activation._id,
            user_id: user._id,
            full_name: user.full_name,
            phone: user.phone,
            email: user.email,
            plan: activation.plan,
            reference: activation.mpesa_code,
            amount: activation.amount,
            status: activation.status,
            is_welcome_bonus: activation.is_welcome_bonus || false,
            created_at: activation.created_at,
            processed_at: activation.processed_at
          });
        }
      });
    });

    allPayments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.status(200).json({
      success: true,
      count: allPayments.length,
      payments: allPayments
    });
  } catch (error) {
    console.error("Get all payments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payments"
    });
  }
};

/* =====================================
    ADMIN - GET MEGAPAY PLAN AMOUNTS
    ===================================== */
exports.getPlanAmounts = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      amounts: megaPayService.PLAN_AMOUNTS
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get plan amounts"
    });
  }
};
