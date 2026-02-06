const mongoose = require("mongoose");
const User = require("../models/User");

const TOTAL_SURVEYS = 10;

/* =====================================================
   💳 ACTIVATION PAYMENTS — ADMIN CONTROLLER (PLAN SAFE)
===================================================== */

/**
 * 🔍 GET ALL ACTIVATION PAYMENTS
 */
exports.getActivationPayments = async (req, res) => {
  try {
    // Get all users with activation requests
    const users = await User.find({ 
      'activation_requests.0': { $exists: true } 
    })
    .select('full_name email phone activation_requests')
    .lean();

    // Flatten activation requests with user info
    const allPayments = [];
    
    users.forEach(user => {
      if (user.activation_requests && user.activation_requests.length > 0) {
        user.activation_requests.forEach(payment => {
          allPayments.push({
            id: payment._id || payment.id,
            user_id: user._id,
            user_name: user.full_name,
            email: user.email,
            phone: user.phone,
            plan: payment.plan,
            mpesa_code: payment.mpesa_code,
            amount: payment.amount,
            status: payment.status,
            created_at: payment.created_at || payment.submitted_at
          });
        });
      }
    });

    // Sort by creation date descending
    allPayments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(allPayments);
  } catch (error) {
    console.error("❌ Get activation payments error:", error);
    res.status(500).json({ message: "Failed to load activation payments" });
  }
};

/**
 * ⏳ GET ONLY PENDING ACTIVATIONS
 */
exports.getPendingActivations = async (req, res) => {
  try {
    // Get all users with pending activation requests
    const users = await User.find({ 
      'activation_requests.status': 'SUBMITTED' 
    })
    .select('full_name email phone activation_requests')
    .lean();

    // Filter only pending activations
    const pendingPayments = [];
    
    users.forEach(user => {
      if (user.activation_requests) {
        const pendingRequests = user.activation_requests.filter(
          req => req.status === 'SUBMITTED'
        );
        
        pendingRequests.forEach(payment => {
          pendingPayments.push({
            id: payment._id || payment.id,
            user_id: user._id,
            user_name: user.full_name,
            email: user.email,
            phone: user.phone,
            plan: payment.plan,
            mpesa_code: payment.mpesa_code,
            amount: payment.amount,
            created_at: payment.created_at || payment.submitted_at
          });
        });
      }
    });

    // Sort by creation date ascending (oldest first)
    pendingPayments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    res.json(pendingPayments);
  } catch (error) {
    console.error("❌ Get pending activations error:", error);
    res.status(500).json({ message: "Failed to load pending activations" });
  }
};

/**
 * ✅ APPROVE ACTIVATION (PLAN-BASED — FINAL)
 */
exports.approveActivation = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const paymentId = req.params.id;

    // Find user with the specific activation request
    const user = await User.findOne({
      'activation_requests._id': paymentId
    }).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Payment not found" });
    }

    // Find the specific payment
    const payment = user.activation_requests.find(
      req => req._id.toString() === paymentId
    );

    if (!payment) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== "SUBMITTED") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Payment already processed" });
    }

    const { plan, amount } = payment;

    // Check if user has completed required surveys for this plan
    if (!user.plans || !user.plans[plan]) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "User doesn't have this plan"
      });
    }

    const userPlan = user.plans[plan];

    if (!userPlan.completed || userPlan.surveys_completed !== TOTAL_SURVEYS) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "User has not completed required surveys",
        surveys_completed: userPlan.surveys_completed,
        required: TOTAL_SURVEYS
      });
    }

    if (userPlan.is_activated) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Plan already activated"
      });
    }

    // Update payment status
    payment.status = 'APPROVED';
    payment.processed_at = new Date();
    
    // Activate the plan
    user.plans[plan].is_activated = true;
    
    // Set global user activation if not already activated
    if (!user.is_activated) {
      user.is_activated = true;
    }
    
    // Add amount to total earned
    user.total_earned = (user.total_earned || 0) + (amount || 0);

    await user.save({ session });

    await session.commitTransaction();

    res.json({
      message: "✅ Activation approved",
      user_id: user._id,
      plan: plan,
      withdraw_unlocked: true,
      user_name: user.full_name,
      amount_credited: amount
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Approve activation error:", error);
    res.status(500).json({ message: "Failed to approve activation" });
  } finally {
    session.endSession();
  }
};

/**
 * ❌ REJECT ACTIVATION
 */
exports.rejectActivation = async (req, res) => {
  try {
    const paymentId = req.params.id;

    // Find user with the specific activation request
    const user = await User.findOne({
      'activation_requests._id': paymentId,
      'activation_requests.status': 'SUBMITTED'
    });

    if (!user) {
      return res.status(400).json({
        message: "Payment not found or already processed"
      });
    }

    // Find and update the specific payment
    const paymentIndex = user.activation_requests.findIndex(
      req => req._id.toString() === paymentId && req.status === 'SUBMITTED'
    );

    if (paymentIndex === -1) {
      return res.status(400).json({
        message: "Payment not found or already processed"
      });
    }

    // Update payment status
    user.activation_requests[paymentIndex].status = 'REJECTED';
    user.activation_requests[paymentIndex].processed_at = new Date();

    await user.save();

    const rejectedPayment = user.activation_requests[paymentIndex];

    res.json({
      message: "❌ Activation rejected",
      user_id: user._id,
      plan: rejectedPayment.plan,
      user_name: user.full_name
    });
  } catch (error) {
    console.error("❌ Reject activation error:", error);
    res.status(500).json({ message: "Failed to reject activation" });
  }
};

/**
 * 📊 GET ACTIVATION STATS (Optional - Useful for admin dashboard)
 */
exports.getActivationStats = async (req, res) => {
  try {
    const allUsers = await User.find({ 
      'activation_requests.0': { $exists: true } 
    }).select('activation_requests');

    let stats = {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      totalRevenue: 0
    };

    allUsers.forEach(user => {
      if (user.activation_requests) {
        user.activation_requests.forEach(payment => {
          stats.total++;
          
          if (payment.status === 'APPROVED') {
            stats.approved++;
            stats.totalRevenue += payment.amount || 0;
          } else if (payment.status === 'SUBMITTED') {
            stats.pending++;
          } else if (payment.status === 'REJECTED') {
            stats.rejected++;
          }
        });
      }
    });

    res.json(stats);
  } catch (error) {
    console.error("❌ Get activation stats error:", error);
    res.status(500).json({ message: "Failed to load activation stats" });
  }
};