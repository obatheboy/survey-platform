const User = require("../models/User");
const jwt = require("jsonwebtoken");
const megaPayService = require("../services/megapay.service");
const Notification = require("../models/Notification");
const { ACTIVATION_PLANS, syncActivationStatus } = require("../utils/activationStatus");

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

const PLAN_STATUS_ORDER = ["WELCOME_BONUS", ...ACTIVATION_PLANS];

const isPlanDone = (user, planKey) => {
  return user.plans_paid?.[planKey] === true || user.plans?.[planKey]?.is_activated === true;
};

const getRemainingActivationPlans = (user) => {
  return ACTIVATION_PLANS.filter(planKey => !isPlanDone(user, planKey));
};

const buildRedirect = (user) => {
  const remainingPlans = getRemainingActivationPlans(user);
  if (remainingPlans.length === 0) {
    return {
      redirect_to: "/withdraw-form",
      next_plan: null,
      remaining_plans: []
    };
  }

  const nextPlan = remainingPlans[0];
  return {
    redirect_to: `/dashboard?focusPlan=${nextPlan}&highlightPlan=${nextPlan}`,
    next_plan: nextPlan,
    remaining_plans: remainingPlans
  };
};

const assertPlanOrder = (user, planKey) => {
  if (planKey === "WELCOME_BONUS") {
    return { ok: true };
  }

  const planIndex = ACTIVATION_PLANS.indexOf(planKey);
  for (let i = 0; i < planIndex; i += 1) {
    if (!isPlanDone(user, ACTIVATION_PLANS[i])) {
      return {
        ok: false,
        next_plan: ACTIVATION_PLANS[i],
        message: `Complete ${ACTIVATION_PLANS[i]} before ${planKey}.`
      };
    }
  }

  return { ok: true };
};

const assertSurveyCompleted = (user, planKey) => {
  const planData = user.plans?.[planKey];
  if (!planData) {
    return {
      ok: false,
      message: "Plan not found"
    };
  }

  if ((planData.surveys_completed || 0) < 10 || planData.completed !== true) {
    return {
      ok: false,
      message: `Complete all 10 surveys for ${planKey} before activation.`
    };
  }

  return { ok: true };
};

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
    const isPaid = planKey === "WELCOME_BONUS"
      ? user.welcome_bonus_received === true || user.plans_paid?.WELCOME_BONUS === true
      : user.plans_paid?.[planKey];
    if (isPaid) {
      return res.status(400).json({
        success: false,
        message: `${planKey} plan is already paid.`,
        already_paid: true
      });
    }

    const orderCheck = assertPlanOrder(user, planKey);
    if (!orderCheck.ok) {
      const redirect = buildRedirect(user);
      return res.status(400).json({
        success: false,
        message: orderCheck.message,
        next_plan: orderCheck.next_plan,
        redirect_to: redirect.redirect_to
      });
    }

    if (planKey !== "WELCOME_BONUS") {
      const surveyCheck = assertSurveyCompleted(user, planKey);
      if (!surveyCheck.ok) {
        return res.status(400).json({
          success: false,
          message: surveyCheck.message,
          redirect_to: `/dashboard?focusPlan=${planKey}&highlightPlan=${planKey}`
        });
      }
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
    const isAlreadyPaid = planKey === "WELCOME_BONUS"
      ? user.welcome_bonus_received === true || user.plans_paid?.WELCOME_BONUS === true
      : user.plans_paid?.[planKey] || user.plans?.[planKey]?.is_activated;
    if (isAlreadyPaid) {
      syncActivationStatus(user);
      const redirect = buildRedirect(user);
      await user.save();

      return res.status(200).json({
        success: true,
        message: `${planKey} plan already paid.`,
        already_paid: true,
        all_plans_completed: user.all_plans_completed || false,
        plans_paid: user.plans_paid || {},
        redirect_to: redirect.redirect_to,
        next_plan: redirect.next_plan,
        remaining_plans: redirect.remaining_plans,
        user: {
          id: user._id,
          is_activated: user.is_activated,
          all_plans_completed: user.all_plans_completed || false,
          plans_paid: user.plans_paid || {},
          plans: user.plans || {}
        }
      });
    }

    const orderCheck = assertPlanOrder(user, planKey);
    if (!orderCheck.ok) {
      const redirect = buildRedirect(user);
      return res.status(409).json({
        success: false,
        message: orderCheck.message,
        next_plan: orderCheck.next_plan,
        redirect_to: redirect.redirect_to,
        remaining_plans: redirect.remaining_plans
      });
    }

    if (planKey !== "WELCOME_BONUS") {
      const surveyCheck = assertSurveyCompleted(user, planKey);
      if (!surveyCheck.ok) {
        return res.status(400).json({
          success: false,
          message: surveyCheck.message,
          redirect_to: `/dashboard?focusPlan=${planKey}&highlightPlan=${planKey}`
        });
      }
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

    syncActivationStatus(user);
    await user.save();

    const allPaid = user.all_plans_completed === true;

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
      if (!user.plans_paid) user.plans_paid = {};
      user.plans_paid.WELCOME_BONUS = true;
    }

    const redirect = buildRedirect(user);

    // Add a focused message for the next unpaid plan.
    const nextPlan = redirect.next_plan;
    const redirectFocus = {
      plan: nextPlan || null,
      label: nextPlan || null,
      message: nextPlan
        ? `Next step: continue with ${nextPlan} on your dashboard.`
        : "All REGULAR, VIP, and VVIP plans are complete. You can withdraw now."
    };

    // Clear pending payment info
    user.last_payment_reference = null;
    user.last_payment_plan = null;
    user.payment_method = null;

    await user.save();

    console.log(`✅ Plan payment confirmed - ${planKey} for user ${user.full_name}`);
    console.log(`💰 Added KES ${earnings} - Old: ${oldBalance}, New: ${user.total_earned}`);
    console.log(`📋 All plans completed: ${allPaid}`);
    console.log(`➡️ Redirect to: ${redirect.redirect_to}`);

    // Create notification
    try {
      const notification = new Notification({
        user_id: user._id,
        title: `✅ ${planKey.replace(/_/g, ' ')} Plan Paid!`,
        message: `You have successfully paid for ${planKey.replace(/_/g, ' ')} plan! KES ${earnings} has been added to your balance.${allPaid ? ' All plans completed! You can now withdraw.' : ''}`,
        action_route: redirect.redirect_to,
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

    // Format plan label for message
    const planLabel = planKey === "WELCOME_BONUS" ? "Welcome Bonus" : planKey;
    const remainingLabels = redirect.remaining_plans;

    return res.status(200).json({
      success: true,
      message: `You have successfully paid for ${planLabel} Plan!`,
      plan_paid: planKey,
      redirect_to: redirect.redirect_to,
      redirect_focus: redirectFocus,
      all_plans_completed: allPaid,
      user_activated: user.is_activated || false,
      next_plan: redirect.next_plan,
      remaining_plans: remainingLabels,
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        phone: user.phone,
        all_plans_completed: allPaid,
        user_activated: user.is_activated || false,
        plans_paid: user.plans_paid,
        plans: user.plans || {}
      },
      balance_before: oldBalance,
      balance_added: earnings,
      new_balance: user.total_earned
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

    syncActivationStatus(user);

    const plansStatus = PLAN_STATUS_ORDER.map(planKey => {
      const isPaid = plans_paid[planKey] === true || user.plans?.[planKey]?.is_activated === true;
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

    const paidCount = ACTIVATION_PLANS.filter(p => isPlanDone(user, p)).length;
    const allCompleted = user.all_plans_completed || false;
    const remainingPlans = getRemainingActivationPlans(user);
    const nextPlan = remainingPlans[0] || null;
    const redirect = buildRedirect(user);

    res.status(200).json({
      success: true,
      plans: plansStatus,
      paid_count: paidCount,
      total_plans: ACTIVATION_PLANS.length,
      all_plans_completed: allCompleted,
      user_activated: user.is_activated || false,
      next_plan: nextPlan ? {
        plan: nextPlan,
        fee: PLAN_FEES[nextPlan],
        earnings: PLAN_EARNINGS[nextPlan],
        label: nextPlan
      } : null,
      redirect_to: redirect.redirect_to,
      remaining_plans: remainingPlans,
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

    syncActivationStatus(user);

    const remainingPlans = getRemainingActivationPlans(user);
    const nextPlanKey = remainingPlans[0] || null;

    if (!nextPlanKey) {
      return res.status(200).json({
        success: true,
        next_plan: null,
        all_plans_completed: true,
        user_activated: user.is_activated || false,
        redirect_to: "/withdraw-form",
        message: "All plans have been paid!"
      });
    }

    const redirect = buildRedirect(user);

    res.status(200).json({
      success: true,
      next_plan: {
        plan: nextPlanKey,
        fee: PLAN_FEES[nextPlanKey],
        earnings: PLAN_EARNINGS[nextPlanKey],
        label: nextPlanKey
      },
      all_plans_completed: user.all_plans_completed || false,
      user_activated: user.is_activated || false,
      redirect_to: redirect.redirect_to,
      remaining_plans: remainingPlans
    });
  } catch (error) {
    console.error("Get next plan error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get next plan"
    });
  }
};
