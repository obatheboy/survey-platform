/**
 * =============================================================================
 * KIFARUPAY PAYMENT CONTROLLER - DISABLED
 * =============================================================================
 * This gateway has been disabled. Only MegaPay is active.
 * All endpoints return Payment gateway disabled error.
 * =============================================================================
 */

const User = require("../models/User");

// All Kifarupay endpoints are disabled - only MegaPay is active
module.exports = {
  initiateKifarupayPayment: async (req, res) => {
    return res.status(503).json({
      success: false,
      message: "Payment gateway disabled. Please use MegaPay instead.",
      gateway: "DISABLED"
    });
  },
  getUserPaymentStatus: async (req, res) => {
    return res.status(503).json({
      success: false,
      message: "Payment gateway disabled. Please use MegaPay instead.",
      gateway: "DISABLED"
    });
  },
  getLastPaymentReference: async (req, res) => {
    return res.status(503).json({
      success: false,
      message: "Payment gateway disabled. Please use MegaPay instead.",
      gateway: "DISABLED"
    });
  },
  manualApproveKifarupayPayment: async (req, res) => {
    return res.status(503).json({
      success: false,
      message: "Payment gateway disabled. Please use MegaPay instead.",
      gateway: "DISABLED"
    });
  },
  rejectKifarupayPayment: async (req, res) => {
    return res.status(503).json({
      success: false,
      message: "Payment gateway disabled. Please use MegaPay instead.",
      gateway: "DISABLED"
    });
  },
  getPendingKifarupayPayments: async (req, res) => {
    return res.status(200).json({
      success: true,
      count: 0,
      payments: [],
      message: "Kifarupay gateway disabled - no active payments"
    });
  },
  getAllKifarupayPayments: async (req, res) => {
    return res.status(200).json({
      success: true,
      count: 0,
      payments: [],
      message: "Kifarupay gateway disabled - no payments found"
    });
  },
  getPlanAmounts: async (req, res) => {
    return res.status(503).json({
      success: false,
      message: "Payment gateway disabled. Use MegaPay endpoints.",
      gateway: "DISABLED"
    });
  }
};
  try {
    const { plan, phone_number } = req.body;
    const userId = req.user?.id || req.body?.userId;

    console.log("=== KIFARUPAY INITIATE PAYMENT ===");
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

    // Generate payment reference
    const reference = `KFY_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Store payment info in user record for admin verification
    if (!user.activation_requests) {
      user.activation_requests = [];
    }

    const isWelcomeBonus = planKey === "WELCOME_BONUS";

    // Add activation request for admin tracking
    user.activation_requests.push({
      plan: planKey,
      mpesa_code: reference, // Using our reference as the payment identifier
      amount: amount,
      status: 'SUBMITTED',
      created_at: new Date(),
      is_welcome_bonus: isWelcomeBonus,
      payment_method: "kifarupay"
    });

    // Store last payment reference for lookup
    user.last_payment_reference = reference;
    user.last_payment_attempt = new Date();
    user.last_payment_plan = planKey;
    user.payment_method = "kifarupay";
    await user.save();

    // Determine description based on plan
    const description = isWelcomeBonus
      ? "Welcome Bonus Activation"
      : `${planKey} Plan Activation`;

    // Send STK Push via Kifarupay
    const paymentResult = await kifarupayService.initiateSTKPush(
      amount,
      phone_number,
      userId,
      description,
      reference
    );

    if (paymentResult.success) {
      console.log(`✅ Kifarupay STK Push sent for ${planKey} - User: ${user._id}`);

      // Send notification to user
      try {
        const notification = new Notification({
          user_id: user._id,
          title: `🔔 ${isWelcomeBonus ? 'Welcome Bonus' : planKey} Payment`,
          message: `STK push of KES ${amount} sent to ${phone_number}. Complete payment to activate your plan. Admin will verify and activate.`,
          action_route: "/activate",
          type: "payment"
        });
        await notification.save();
      } catch (notifError) {
        console.error("Notification error:", notifError);
      }

      return res.status(200).json({
        success: true,
        message: "STK Push sent! Check your phone and enter PIN.",
        reference: reference,
        checkout_request_id: paymentResult.checkout_request_id,
        amount: amount,
        plan: planKey,
        phone: paymentResult.phone,
        requires_manual_approval: true,
        instructions: "Please check your phone for the M-Pesa STK push, enter your PIN. Admin will verify and activate your plan."
      });
    } else {
      // Clear the stored reference if payment failed
      user.activation_requests.pop();
      user.last_payment_reference = null;
      await user.save();

      console.error("❌ Kifarupay STK Push failed:", paymentResult.message);

      return res.status(400).json({
        success: false,
        message: paymentResult.message || "Failed to initiate STK Push. Please try again.",
        error_code: paymentResult.code || null,
        details: paymentResult.details || null
      });
    }
  } catch (error) {
    console.error("❌ Kifarupay initiation error:", error);

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

    // Check for pending payments
    const pendingPayments = user.activation_requests?.filter(
      r => r.status === 'SUBMITTED' && r.payment_method === 'kifarupay'
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
   ADMIN - MANUAL APPROVAL AFTER KIFARUPAY VERIFICATION
   ===================================== */
exports.manualApproveKifarupayPayment = async (req, res) => {
  try {
    const { userId, activationId, notes } = req.body;
    const adminId = req.user?.id;

    console.log("=== MANUAL KIFARUPAY APPROVAL ===");
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
    activationRequest.admin_notes = notes || "Manually approved after Kifarupay verification";

    // Activate the plan
    if (userPlan) {
      userPlan.is_activated = true;
      userPlan.activated_at = new Date();
    }

    // Only activate account when ALL 4 plans are paid (not just one plan)
    const allPlansTypes = ["WELCOME_BONUS", "REGULAR", "VIP", "VVIP"];
    const allPaid = allPlansTypes.every(p => user.plans_paid[p] === true);
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

    console.log(`✅ Manually approved Kifarupay payment - ${plan} plan for user ${user.full_name}`);
    console.log(`💰 Added KES ${creditAmount} - Old: ${oldBalance}, New: ${user.total_earned}`);

    await user.save();

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
        is_activated: user.is_activated
      },
      balance_before: oldBalance,
      balance_added: creditAmount,
      new_balance: user.total_earned
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
   ADMIN - REJECT KIFARUPAY PAYMENT
   ===================================== */
exports.rejectKifarupayPayment = async (req, res) => {
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
   ADMIN - GET PENDING KIFARUPAY PAYMENTS
   ===================================== */
exports.getPendingKifarupayPayments = async (req, res) => {
  try {
    const users = await User.find({
      'activation_requests.status': 'SUBMITTED',
      'activation_requests.payment_method': 'kifarupay'
    }).select('full_name phone email activation_requests created_at');

    const pendingPayments = [];

    users.forEach(user => {
      user.activation_requests.forEach(activation => {
        if (activation.status === 'SUBMITTED' && activation.payment_method === 'kifarupay') {
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
   ADMIN - GET ALL KIFARUPAY PAYMENTS
   ===================================== */
exports.getAllKifarupayPayments = async (req, res) => {
  try {
    const users = await User.find({
      'activation_requests.0': { $exists: true }
    }).select('full_name phone email activation_requests');

    const allPayments = [];

    users.forEach(user => {
      user.activation_requests.forEach(activation => {
        if (activation.payment_method === 'kifarupay') {
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
   ADMIN - GET KIFARUPAY PLAN AMOUNTS
   ===================================== */
exports.getPlanAmounts = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      amounts: kifarupayService.PLAN_AMOUNTS
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get plan amounts"
    });
  }
};