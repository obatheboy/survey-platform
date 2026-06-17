const User = require("../models/User");
const jwt = require("jsonwebtoken");
const megaPayService = require("../services/megapay.service");
const Notification = require("../models/Notification");
const { ACTIVATION_PLANS, buildPaymentRedirect, getRemainingActivationPlans, isPlanDone, isWelcomeBonusPaid, syncActivationStatus } = require("../utils/activationStatus");

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

const buildRedirect = (user) => buildPaymentRedirect(user);
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
      ? isWelcomeBonusPaid(user)
      : isPlanDone(user, planKey);
    if (isPaid) {
      return res.status(400).json({
        success: false,
        message: `${planKey} plan is already paid.`,
        already_paid: true
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
  const { transaction_request_id, phone, plan: planKey } = req.body;

  console.log(`🔔 CONFIRM PLAN PAYMENT REQUEST - txId: ${transaction_request_id}, phone: ${phone}, plan: ${planKey}`);

  if (!transaction_request_id) {
    return res.status(400).json({
      success: false,
      message: "Missing transaction_request_id. Please contact support.",
      paid: false
    });
  }

  if (!phone || !planKey) {
    return res.status(400).json({
      success: false,
      message: "Missing phone or plan parameter",
      paid: false
    });
  }

  const normalizedPlanKey = planKey.toUpperCase();
  if (!PLAN_FEES[normalizedPlanKey]) {
    return res.status(400).json({
      success: false,
      message: `Invalid plan: ${planKey}`,
      paid: false
    });
  }

  // Find user by phone number (no auth middleware on this route)
  // Supports both 07XXXXXXXX and 2547XXXXXXXX formats
  const rawPhone = phone.replace(/[^0-9]/g, '');
  const phoneWithoutZero = rawPhone.startsWith('0') ? rawPhone.substring(1) : rawPhone;
  const phoneWith254 = rawPhone.startsWith('0') ? '254' + rawPhone.substring(1) : rawPhone;
  const phoneWithoutLeading = rawPhone.startsWith('0') ? rawPhone.substring(1) : rawPhone;

  const user = await User.findOne({
    $or: [
      { phone: rawPhone },
      { phone: phoneWith254 },
      { phone: phoneWithoutZero },
      { phone: new RegExp(rawPhone) },
      { phone: new RegExp(phoneWith254) },
      { phone: new RegExp(phoneWithoutZero) }
    ]
  }).maxTimeMS(5000);

  console.log(`👤 User lookup: raw=${rawPhone}, 254form=${phoneWith254}, noZero=${phoneWithoutZero} → ${user ? `FOUND (${user._id}, ${user.full_name || user.email})` : 'NOT FOUND'}`);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found. Please login again.",
      paid: false
    });
  }

  if (user.plans_paid?.[normalizedPlanKey]) {
    return res.status(200).json({
      success: true,
      message: `${normalizedPlanKey} plan already paid.`,
      already_paid: true,
      all_plans_completed: user.all_plans_completed || false,
      plans_paid: user.plans_paid || {}
    });
  }

  // Verify with MegaPay (including exact amount match)
  const expectedAmount = PLAN_FEES[normalizedPlanKey];
  console.log(`💰 Verifying payment: txId=${transaction_request_id}, phone=${phone}, plan=${normalizedPlanKey}, expected=${expectedAmount}`);
  const statusResult = await megaPayService.checkTransactionStatus(transaction_request_id, expectedAmount);

  console.log(`📬 Status result:`, JSON.stringify(statusResult));

  if (!statusResult.success) {
    return res.status(500).json({
      success: false,
      message: "Failed to check transaction status: " + (statusResult.error || "Unknown error")
    });
  }

  if (!statusResult.completed) {
    return res.status(200).json({
      success: false,
      message: statusResult.resultDesc || statusResult.status || "Payment not yet confirmed by MegaPay",
      paid: false,
      status: statusResult.status || "Pending",
      resultCode: statusResult.resultCode,
      amount_received: statusResult.amount
    });
  }

  try {
  if (!user.plans_paid) user.plans_paid = {};
  user.plans_paid[normalizedPlanKey] = true;

  if (normalizedPlanKey === "WELCOME_BONUS") {
    user.welcome_bonus_paid = true;
    user.welcome_bonus_received = true;
  } else {
    user[`${normalizedPlanKey.toLowerCase()}_paid`] = true;
    if (user.plans && user.plans[normalizedPlanKey]) {
      user.plans[normalizedPlanKey].is_activated = true;
      user.plans[normalizedPlanKey].activated_at = new Date();
    }
  }

  syncActivationStatus(user);

    // Debug: Check user state before setting activation
    console.log(`🔍 Payment confirmation state check - User: ${user.full_name}`);
    console.log(`🔍 REGULAR_paid: ${user.regular_paid}, VIP_paid: ${user.vip_paid}, VVIP_paid: ${user.vvip_paid}`);
    console.log(`🔍 plans_paid: ${JSON.stringify(user.plans_paid || {})}`);
    console.log(`🔍 REGULAR_activated: ${user.plans?.REGULAR?.is_activated}, VIP_activated: ${user.plans?.VIP?.is_activated}, VVIP_activated: ${user.plans?.VVIP?.is_activated}`);

    // syncActivationStatus already set account_activated/all_plans_completed/is_activated correctly
    // Account activates when REGULAR + VIP + VVIP are ALL paid (Welcome Bonus optional)
    console.log(`🔍 Account activated: ${user.account_activated}, All plans completed: ${user.all_plans_completed}`);

    await user.save();

    const allPaid = user.account_activated === true || user.all_plans_completed === true;

    let creditEarnings = true;
    let earnings = PLAN_EARNINGS[normalizedPlanKey] || 0;
    if (normalizedPlanKey === "WELCOME_BONUS") {
      creditEarnings = false;
    }
    const oldBalance = user.total_earned || 0;
    if (creditEarnings) {
      user.total_earned = oldBalance + earnings;
    }

    const redirect = buildRedirect(user);
    const remainingSurveyPlans = getRemainingActivationPlans(user);
    const remainingSurveyText = remainingSurveyPlans.length > 0 ? remainingSurveyPlans.join(', ') : 'none';

    const nextPlan = redirect.next_plan;
    const redirectFocus = {
      plan: nextPlan || null,
      label: nextPlan || null,
      message: nextPlan
        ? `Next step: continue with ${nextPlan} on your dashboard.`
        : "All REGULAR, VIP, and VVIP plans are complete. You can withdraw now."
    };

    const successMessage = normalizedPlanKey === "WELCOME_BONUS"
      ? "✅ Welcome Bonus activated! Redirecting to Regular plan..."
      : allPaid
        ? "🎉 Congratulations! Your account is now ACTIVE!\nYou can now withdraw your earnings!"
        : `✅ You have successfully paid for ${normalizedPlanKey.replace(/_/g, ' ')}!\nRemaining survey plans: ${remainingSurveyText}`;

    // Clear pending payment info
    user.last_payment_reference = null;
    user.last_payment_plan = null;
    user.payment_method = null;

    await user.save();

    console.log(`✅ Plan payment confirmed - ${normalizedPlanKey} for user ${user.full_name}`);
    console.log(`💰 Added KES ${earnings} - Old: ${oldBalance}, New: ${user.total_earned}`);
    console.log(`📋 All plans completed: ${allPaid}`);
    console.log(`➡️ Redirect to: ${redirect.redirect_to}`);

    // Create notification
    try {
      const notification = new Notification({
        user_id: user._id,
        title: `✅ ${normalizedPlanKey.replace(/_/g, ' ')} Plan Paid!`,
        message: `You have successfully paid for ${normalizedPlanKey.replace(/_/g, ' ')} plan! KES ${earnings} has been added to your balance.${allPaid ? ' All plans completed! You can now withdraw.' : ''}`,
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

    const remainingLabels = redirect.remaining_plans;

    return res.status(200).json({
      success: true,
      message: successMessage,
      success_message: successMessage,
      plan_paid: normalizedPlanKey,
      redirect_to: redirect.redirect_to,
      redirect_focus: redirectFocus,
      all_plans_completed: allPaid,
      account_activated: user.account_activated === true,
      user_activated: user.is_activated || false,
      next_plan: redirect.next_plan,
      remaining_plans: remainingLabels,
      remaining_survey_plans: remainingSurveyPlans,
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        phone: user.phone,
        all_plans_completed: allPaid,
        account_activated: user.account_activated === true,
        user_activated: user.is_activated || false,
        plans_paid: user.plans_paid,
        regular_paid: user.regular_paid === true,
        vip_paid: user.vip_paid === true,
        vvip_paid: user.vvip_paid === true,
        welcome_bonus_paid: user.welcome_bonus_paid === true,
        has_seen_welcome_popup: user.has_seen_welcome_popup === true,
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
      const isPaid = isPlanDone(user, planKey) || (planKey === "WELCOME_BONUS" && isWelcomeBonusPaid(user));
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
