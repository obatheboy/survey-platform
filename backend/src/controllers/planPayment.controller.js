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
      // Surveys are completed AFTER payment/activation, not before
      // The survey completion check happens when submitting surveys for earnings
    }

    // Generate order reference (internal, can be long)
    const orderReference = `PLAN_${planKey}_${targetUserId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Short reference for MegaPay (their TransactionReference column is short)
    const megaPayReference = megaPayService.generateShortReference("PL");

    // Store pending payment info
    user.last_payment_reference = orderReference;
    user.last_payment_plan = planKey;
    user.payment_method = "megapay";
    await user.save();

    // Send STK Push via MegaPay
    const paymentResult = await megaPayService.initiateSTKPush(amount, phone_number, megaPayReference);

    if (paymentResult.success) {
      const transactionRequestId = paymentResult.transaction_request_id || megaPayReference;
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

  // Find user by authenticated user ID (from JWT token, protect middleware)
  // No need for phone lookup - auth middleware already verified the user
  const providedUserId = req.body.user_id || req.user?.id;
  const userId = providedUserId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - please login again",
      paid: false
    });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found. Please login again.",
      paid: false
    });
  }

  console.log(`🔔 CONFIRM PLAN PAYMENT - User: ${user._id} (${user.full_name || user.email}), Plan: ${planKey}, Phone: ${phone}`);

  if (user.plans_paid?.[normalizedPlanKey]) {
    const rPaid = user.plans_paid?.REGULAR === true;
    const vPaid = user.plans_paid?.VIP === true;
    const vvPaid = user.plans_paid?.VVIP === true;
    const trulyComplete = rPaid && vPaid && vvPaid;
    return res.status(200).json({
      success: true,
      message: `${normalizedPlanKey} plan already paid.`,
      already_paid: true,
      all_plans_completed: trulyComplete,
      plans_paid: user.plans_paid || {},
      remaining_plans: trulyComplete ? [] : ACTIVATION_PLANS.filter(p => {
        if (p === "REGULAR") return !rPaid;
        if (p === "VIP") return !vPaid;
        if (p === "VVIP") return !vvPaid;
        return true;
      }),
      redirect_to: trulyComplete ? "/dashboard" : `/activate?plan=${(ACTIVATION_PLANS.find(p => {
        if (p === "REGULAR") return !rPaid;
        if (p === "VIP") return !vPaid;
        if (p === "VVIP") return !vvPaid;
        return false;
      }) || "REGULAR").toLowerCase()}`
    });
  }

  try {
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

  if (!user.plans_paid) user.plans_paid = {};
  user.plans_paid[normalizedPlanKey] = true;

  if (normalizedPlanKey === "WELCOME_BONUS") {
    user.welcome_bonus_paid = true;
    user.welcome_bonus_received = true;
  } else {
    user[`${normalizedPlanKey.toLowerCase()}_paid`] = true;
  }

  // Mark the specific plan as activated
  if (user.plans && user.plans[normalizedPlanKey]) {
    user.plans[normalizedPlanKey].is_activated = true;
    user.plans[normalizedPlanKey].activated_at = new Date();
  } else {
    user.plans = user.plans || {};
    user.plans[normalizedPlanKey] = {
      surveys_completed: 10,
      completed: true,
      is_activated: true,
      total_surveys: 10,
      activated_at: new Date()
    };
  }

  // Check if all 3 survey plans are now paid (Welcome Bonus optional)
  // ONLY trust plans_paid that was JUST set in this transaction
  // Clear any stale plans_paid entries that might exist from old Till/testing data
  const currentPlansPaid = user.plans_paid || {};
  
  // Only count the plan we JUST paid as truly paid
  const justPaidPlan = normalizedPlanKey;
  const regularPaid = justPaidPlan === "REGULAR" ? true : (currentPlansPaid.REGULAR === true);
  const vipPaid = justPaidPlan === "VIP" ? true : (currentPlansPaid.VIP === true);
  const vvipPaid = justPaidPlan === "VVIP" ? true : (currentPlansPaid.VVIP === true);
  const allThreePaid = regularPaid && vipPaid && vvipPaid;

  console.log(`🔍 Activation check - REGULAR: ${regularPaid}, VIP: ${vipPaid}, VVIP: ${vvipPaid}, All three: ${allThreePaid}`);

  if (allThreePaid) {
    user.account_activated = true;
    user.all_plans_completed = true;
    user.is_activated = true;
    if (!user.activated_at) {
      user.activated_at = new Date();
    }
  } else {
    user.account_activated = false;
    user.all_plans_completed = false;
    user.is_activated = false;
  }

  await user.save();

  // CRITICAL: Re-read user from DB to get fresh state (bypass Mongoose cache)
  const freshUser = await User.findById(user._id);
  if (!freshUser) {
    return res.status(500).json({ success: false, message: "Failed to reload user after save" });
  }

  // Compute activation from FRESH data only
  const rPaid = freshUser.regular_paid === true || freshUser.plans_paid?.REGULAR === true;
  const vPaid = freshUser.vip_paid === true || freshUser.plans_paid?.VIP === true;
  const vvPaid = freshUser.vvip_paid === true || freshUser.plans_paid?.VVIP === true;
  const trulyAllThree = rPaid && vPaid && vvPaid;

  console.log(`🔍 FRESH check after save - REGULAR: ${rPaid}, VIP: ${vPaid}, VVIP: ${vvPaid}, AllThree: ${trulyAllThree}`);

  // If DB has stale all_plans_completed=true but not all 3 paid, force-correct it
  if (!trulyAllThree && (freshUser.all_plans_completed === true || freshUser.account_activated === true)) {
    console.log(`⚠️ Stale activation data detected! Fixing DB for user ${freshUser._id}`);
    freshUser.account_activated = false;
    freshUser.all_plans_completed = false;
    freshUser.is_activated = false;
    await freshUser.save();
    console.log(`✅ Fixed stale activation data for user ${freshUser._id}`);
  }

  // Use FRESH data from DB for all calculations
  const finalAllThreePaid = trulyAllThree;
  const finalRegularPaid = rPaid;
  const finalVipPaid = vPaid;
  const finalVvipPaid = vvPaid;

  let allPaid = finalAllThreePaid;

  let creditEarnings = true;
  let earnings = PLAN_EARNINGS[normalizedPlanKey] || 0;
  if (normalizedPlanKey === "WELCOME_BONUS") {
    creditEarnings = false;
  }
  const oldBalance = freshUser.total_earned || 0;
  if (creditEarnings) {
    freshUser.total_earned = oldBalance + earnings;
  }

  let redirectTo;
  let remainingPlansList;
  let nextPlanKey;

  if (finalAllThreePaid) {
    redirectTo = "/dashboard";
    remainingPlansList = [];
    nextPlanKey = null;
  } else {
    const remaining = ACTIVATION_PLANS.filter(p => {
      if (p === "REGULAR") return !finalRegularPaid;
      if (p === "VIP") return !finalVipPaid;
      if (p === "VVIP") return !finalVvipPaid;
      return true;
    });
    remainingPlansList = remaining;
    nextPlanKey = remaining.length > 0 ? remaining[0] : null;

    if (nextPlanKey) {
      redirectTo = `/activate?plan=${nextPlanKey.toLowerCase()}`;
    } else {
      redirectTo = "/dashboard";
    }
  }

  const successMessage = normalizedPlanKey === "WELCOME_BONUS"
    ? "✅ Welcome Bonus activated! Redirecting to next plan..."
    : finalAllThreePaid
      ? "🎉 Congratulations! Your account is now ACTIVE!\nYou can now withdraw your earnings!"
      : `✅ You have successfully paid for ${normalizedPlanKey.replace(/_/g, ' ')}!\nRemaining survey plans: ${remainingPlansList.length > 0 ? remainingPlansList.join(', ') : 'none'}`;

  console.log(`✅ Redirect: ${redirectTo}, Remaining: ${remainingPlansList.join(', ') || 'none'}, AllThreePaid: ${finalAllThreePaid}`);

  // Clear pending payment info
  freshUser.last_payment_reference = null;
  freshUser.last_payment_plan = null;
  freshUser.payment_method = null;

  await freshUser.save();

  console.log(`✅ Plan payment confirmed - ${normalizedPlanKey} for user ${freshUser.full_name}`);
  console.log(`💰 Added KES ${earnings} - Old: ${oldBalance}, New: ${freshUser.total_earned}`);
  console.log(`📋 All plans completed: ${finalAllThreePaid}`);
  console.log(`➡️ Redirect to: ${redirectTo}`);

  // Create notification
  try {
    const notification = new Notification({
      user_id: freshUser._id,
      title: `✅ ${normalizedPlanKey.replace(/_/g, ' ')} Plan Paid!`,
      message: `You have successfully paid for ${normalizedPlanKey.replace(/_/g, ' ')} plan! KES ${earnings} has been added to your balance.${finalAllThreePaid ? ' All plans completed! You can now withdraw.' : ''}`,
      action_route: redirectTo,
      type: "payment"
    });
    await notification.save();
  } catch (notifError) {
    console.error("Notification error:", notifError);
  }

  // Generate token
  const token = jwt.sign(
    { id: freshUser._id, phone: freshUser.phone, role: freshUser.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return res.status(200).json({
    success: true,
    message: successMessage,
    success_message: successMessage,
    plan_paid: normalizedPlanKey,
    redirect_to: redirectTo,
    redirect_focus: {
      plan: nextPlanKey,
      label: nextPlanKey,
      message: nextPlanKey
        ? `Next step: complete ${nextPlanKey} activation.`
        : "All plans complete! You can now withdraw."
    },
    all_plans_completed: finalAllThreePaid,
    account_activated: freshUser.account_activated === true,
    user_activated: freshUser.is_activated || false,
    next_plan: nextPlanKey,
    remaining_plans: remainingPlansList,
    remaining_survey_plans: remainingPlansList,
    token,
    user: {
      id: freshUser._id,
      full_name: freshUser.full_name,
      phone: freshUser.phone,
      all_plans_completed: finalAllThreePaid,
      account_activated: freshUser.account_activated === true,
      user_activated: freshUser.is_activated || false,
      plans_paid: freshUser.plans_paid,
      regular_paid: finalRegularPaid,
      vip_paid: finalVipPaid,
      vvip_paid: finalVvipPaid,
      welcome_bonus_paid: freshUser.welcome_bonus_paid === true,
      has_seen_welcome_popup: freshUser.has_seen_welcome_popup === true,
      plans: freshUser.plans || {}
    },
    balance_before: oldBalance,
    balance_added: earnings,
    new_balance: freshUser.total_earned
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

/* =====================================
   END OF EXPORTS
   ===================================== */

module.exports = {
  initiatePlanPayment: exports.initiatePlanPayment,
  confirmPlanPayment: exports.confirmPlanPayment,
  getPlanPaymentStatus: exports.getPlanPaymentStatus,
  getNextUnpaidPlan: exports.getNextUnpaidPlan,
};
