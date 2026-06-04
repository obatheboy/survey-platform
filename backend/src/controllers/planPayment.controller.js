const User = require("../models/User");
const jwt = require("jsonwebtoken");
const megaPayService = require("../services/megapay.service");
const Notification = require("../models/Notification");

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

const PLAN_ORDER = ["WELCOME_BONUS", "REGULAR", "VIP", "VVIP"];

/* =====================================
   INITIATE PLAN PAYMENT - SEND STK PUSH
   ===================================== */
exports.initiatePlanPayment = async (req, res) => {
  try {
    const { plan, phone_number, userId } = req.body;
    const userIdFromToken = req.user?.id;
    const targetUserId = userId || userIdFromToken;

    console.log("=== INITIATE PLAN PAYMENT ===");
    console.log("User ID:", targetUserId);
    console.log("Plan:", plan);
    console.log("Phone:", phone_number);

    const planKey = (plan?.toUpperCase() === "WELCOME" || plan?.toLowerCase() === "welcome") ? "WELCOME_BONUS" : plan?.toUpperCase();
    const amount = PLAN_FEES[planKey];

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan. Valid: welcome_bonus, regular, vip, vvip"
      });
    }

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    if (!phone_number) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already paid
    const isPaid = user.plans_paid?.[planKey];
    if (isPaid) {
      return res.status(400).json({
        success: false,
        message: `${planKey} plan is already paid.`,
        already_paid: true
      });
    }

    // Generate order reference
    const orderReference = `PLAN_${planKey}_${targetUserId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Store pending payment info
    user.last_payment_reference = orderReference;
    user.last_payment_plan = planKey;
    user.payment_method = "megapay";
    await user.save();

    // Send STK Push via MegaPay
    const paymentResult = await megaPayService.initiateSTKPush(amount, phone_number, orderReference);

    if (paymentResult.success) {
      const transactionRequestId = paymentResult.transaction_request_id || orderReference;
      user.last_payment_reference = transactionRequestId;
      await user.save();

      console.log(`✅ Plan STK Push sent for ${planKey} - User: ${user._id}`);

      return res.status(200).json({
        success: true,
        message: "STK Push sent! Check your M-Pesa and enter your PIN.",
        transaction_request_id: transactionRequestId,
        amount,
        plan: planKey,
        phone: paymentResult.phone
      });
    } else {
      user.last_payment_reference = null;
      user.last_payment_plan = null;
      await user.save();

      console.error("❌ Plan STK Push failed:", paymentResult.message);
      return res.status(400).json({
        success: false,
        message: paymentResult.message || "Failed to initiate STK Push. Please try again.",
        error_code: paymentResult.code || null,
        details: paymentResult.details || null
      });
    }
  } catch (error) {
    console.error("❌ Initiate plan payment error:", error);

    if (error.code === 'ENOTFOUND') {
      return res.status(503).json({ success: false, message: "Payment gateway temporarily unavailable.", error: "DNS_RESOLUTION_FAILED" });
    }
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ success: false, message: "Payment gateway connection refused.", error: "CONNECTION_REFUSED" });
    }
    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({ success: false, message: "Payment gateway timed out.", error: "TIMEOUT" });
    }

    return res.status(500).json({
      success: false,
      message: "Server error: " + (error.message || "Unknown error")
    });
  }
};

/* =====================================
   CONFIRM PLAN PAYMENT - AUTO VERIFY
   ===================================== */
exports.confirmPlanPayment = async (req, res) => {
  try {
    const { transaction_request_id, phone, plan } = req.body;

    console.log("=== CONFIRM PLAN PAYMENT ===");
    console.log("Transaction ID:", transaction_request_id);
    console.log("Phone:", phone);
    console.log("Plan:", plan);

    if (!transaction_request_id) {
      return res.status(400).json({ success: false, message: "Transaction ID is required" });
    }

    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    // Find user by phone (try multiple formats)
    let user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      let formattedPhone = phone.replace(/\s+/g, '').replace(/-/g, '');
      if (formattedPhone.startsWith("+")) formattedPhone = formattedPhone.substring(1);
      if (formattedPhone.startsWith("0")) formattedPhone = "254" + formattedPhone.substring(1);
      if (formattedPhone.startsWith("7") && formattedPhone.length === 9) formattedPhone = "254" + formattedPhone;
      if (!formattedPhone.startsWith("254")) formattedPhone = "254" + formattedPhone;
      user = await User.findOne({ phone: formattedPhone });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found. Please register first." });
    }

    // Determine which plan to mark as paid
    let planKey = plan?.toUpperCase();
    if (planKey === "WELCOME") planKey = "WELCOME_BONUS";

    // If plan not specified, use last_payment_plan
    if (!planKey || !PLAN_FEES[planKey]) {
      planKey = user.last_payment_plan || "REGULAR";
    }

    if (!PLAN_FEES[planKey]) {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    // Check if already paid
    const isAlreadyPaid = user.plans_paid?.[planKey];
    if (isAlreadyPaid) {
      return res.status(200).json({
        success: true,
        message: `${planKey} plan already paid.`,
        already_paid: true,
        all_plans_completed: user.all_plans_completed || false,
        plans_paid: user.plans_paid || {}
      });
    }

    // Verify with MegaPay
    const statusResult = await megaPayService.checkTransactionStatus(transaction_request_id);

    if (!statusResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to check transaction status: " + (statusResult.error || "Unknown error")
      });
    }

    if (!statusResult.completed) {
      return res.status(200).json({
        success: false,
        message: "Payment not yet confirmed by MegaPay",
        paid: false,
        status: statusResult.status || "Pending"
      });
    }

    // Payment confirmed! Mark plan as paid
    if (!user.plans_paid) user.plans_paid = {};
    user.plans_paid[planKey] = true;

    // Also mark the plan as activated in the plans structure
    if (user.plans && user.plans[planKey]) {
      user.plans[planKey].is_activated = true;
      user.plans[planKey].activated_at = new Date();
    }

    // Always set user.is_activated = true when ANY plan is paid
    user.is_activated = true;
    user.activated_at = new Date();

    // Credit earnings (skip WELCOME_BONUS — already given at registration)
    let creditEarnings = true;
    let earnings = PLAN_EARNINGS[planKey] || 0;
    if (planKey === "WELCOME_BONUS") {
      creditEarnings = false;
    }
    const oldBalance = user.total_earned || 0;
    if (creditEarnings) {
      user.total_earned = oldBalance + earnings;
    }

    // Special handling for welcome bonus
    if (planKey === "WELCOME_BONUS") {
      user.welcome_bonus_received = true;
    }

    // Check if all 4 plans are paid
    const allPaid = PLAN_ORDER.every(p => user.plans_paid[p] === true);
    user.all_plans_completed = allPaid;

    // Clear pending payment info
    user.last_payment_reference = null;
    user.last_payment_plan = null;
    user.payment_method = null;

    await user.save();

    console.log(`✅ Plan payment confirmed - ${planKey} for user ${user.full_name}`);
    console.log(`💰 Added KES ${earnings} - Old: ${oldBalance}, New: ${user.total_earned}`);
    console.log(`📋 All plans completed: ${allPaid}`);

    // Create notification
    try {
      const notification = new Notification({
        user_id: user._id,
        title: `✅ ${planKey.replace(/_/g, ' ')} Plan Paid!`,
        message: `You have successfully paid for ${planKey.replace(/_/g, ' ')} plan! KES ${earnings} has been added to your balance.${allPaid ? ' All plans completed! You can now withdraw.' : ''}`,
        action_route: "/activate",
        type: "payment"
      });
      await notification.save();
    } catch (notifError) {
      console.error("Notification error:", notifError);
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: `${planKey.replace(/_/g, ' ')} plan paid successfully!`,
      plan: planKey,
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        phone: user.phone,
        all_plans_completed: allPaid,
        plans_paid: user.plans_paid
      },
      balance_before: oldBalance,
      balance_added: earnings,
      new_balance: user.total_earned,
      all_plans_completed: allPaid
    });
  } catch (error) {
    console.error("❌ Confirm plan payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to confirm payment: " + (error.message || "Unknown error")
    });
  }
};

/* =====================================
   GET PLAN PAYMENT STATUS
   ===================================== */
exports.getPlanPaymentStatus = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const plans_paid = user.plans_paid || {};

    const plansStatus = PLAN_ORDER.map(planKey => {
      const isPaid = plans_paid[planKey] === true;
      const planData = user.plans?.[planKey];
      return {
        plan: planKey,
        paid: isPaid,
        activated: !!planData?.is_activated,
        fee: PLAN_FEES[planKey],
        earnings: PLAN_EARNINGS[planKey],
        label: planKey === "WELCOME_BONUS" ? "Welcome Bonus" : planKey
      };
    });

    const paidCount = plansStatus.filter(p => p.paid).length;
    const allCompleted = user.all_plans_completed || false;

    res.status(200).json({
      success: true,
      plans: plansStatus,
      paid_count: paidCount,
      total_plans: PLAN_ORDER.length,
      all_plans_completed: allCompleted,
      total_earned: user.total_earned || 0
    });
  } catch (error) {
    console.error("Get plan status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get plan status"
    });
  }
};

/* =====================================
   GET NEXT UNPAID PLAN
   ===================================== */
exports.getNextUnpaidPlan = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const plans_paid = user.plans_paid || {};

    // Find first unpaid plan in order
    let nextPlan = null;
    for (const planKey of PLAN_ORDER) {
      if (!plans_paid[planKey]) {
        nextPlan = {
          plan: planKey,
          fee: PLAN_FEES[planKey],
          earnings: PLAN_EARNINGS[planKey],
          label: planKey === "WELCOME_BONUS" ? "Welcome Bonus" : planKey
        };
        break;
      }
    }

    if (!nextPlan) {
      return res.status(200).json({
        success: true,
        next_plan: null,
        all_plans_completed: true,
        message: "All plans have been paid!"
      });
    }

    res.status(200).json({
      success: true,
      next_plan: nextPlan,
      all_plans_completed: false
    });
  } catch (error) {
    console.error("Get next plan error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get next plan"
    });
  }
};
