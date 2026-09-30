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

    // Mark plan as paid in plans_paid
    if (!user.plans_paid) user.plans_paid = {};
    user.plans_paid[plan] = true;

    // Activate the plan
    if (userPlan) {
      userPlan.is_activated = true;
      userPlan.activated_at = new Date();
    }

    // Single-fee model: paying the one-time KES 100 activation fee (welcome bonus
    // claim or any plan fee) activates the account and unlocks surveys.
    const welcomePaid = isWelcomeBonus || user.welcome_bonus_paid === true;
    const accountActive = welcomePaid || user.plans_paid?.REGULAR === true ||
      user.plans_paid?.VIP === true || user.plans_paid?.VVIP === true;

    user.all_plans_completed = accountActive;
    user.account_activated = accountActive;
    user.is_activated = accountActive;
    if (accountActive) {
      if (!user.activated_at) user.activated_at = new Date();
      user.activated_by = plan;
      if (isWelcomeBonus) {
        user.welcome_bonus_paid = true;
        user.welcome_bonus_received = true;
        if (!user.plans) user.plans = {};
        user.plans.WELCOME_BONUS = {
          surveys_completed: 10, completed: true, is_activated: true,
          total_surveys: 10, activated_at: new Date(),
        };
      }
    }

    // 💰 Activation is a FEE, not earnings - no balance credit here.
    const oldBalance = user.total_earned || 0;

    console.log(`✅ Manually approved Kifarupay payment - ${plan} plan for user ${user.full_name}`);
    console.log(`💰 Balance unchanged: KES ${oldBalance} (activation is a fee, not earnings)`);
    console.log(`🔓 Account activated: ${accountActive}`);

    await user.save();

    // Payment only unlocks the account - always send the user to their surveys.
    const redirectTo = "/dashboard";

    console.log(`➡️ Redirect to: ${redirectTo}`);

    // Create notification
    try {
      const notification = new Notification({
        user_id: user._id,
        title: `✅ ${isWelcomeBonus ? 'Account' : `${plan} Plan`} Activated!`,
        message: "Your account is now active! You can start taking surveys and earning.",
        action_route: "/dashboard",
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
      message: "Payment approved. Your account is now active!",
      plan: plan,
      token: token,
      redirect_to: redirectTo,
      user: {
        id: user._id,
        full_name: user.full_name,
        phone: user.phone,
        is_activated: user.is_activated,
        account_activated: user.account_activated,
        all_plans_completed: user.all_plans_completed,
        plans_paid: user.plans_paid
      },
      balance_before: oldBalance,
      balance_added: 0,
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
