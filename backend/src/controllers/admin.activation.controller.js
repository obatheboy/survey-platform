const mongoose = require("mongoose");
const User = require("../models/User");

const TOTAL_SURVEYS = 10;

/* =====================================================
   💳 ACTIVATION PAYMENTS — ADMIN CONTROLLER (PLAN SAFE)
===================================================== */

/**
 * 🔍 GET ALL ACTIVATION PAYMENTS
 * ✅ UPDATED: Includes welcome bonus payments
 */
exports.getActivationPayments = async (req, res) => {
  try {
    console.log("📞 GET /admin/activations called");
    
    // Get all users with activation requests OR welcome bonus withdrawals
    const users = await User.find({
      $or: [
        { 'activation_requests.0': { $exists: true } },
        { 'welcome_bonus_withdrawn': true } // Include users with welcome bonus
      ]
    })
    .select('full_name email phone activation_requests withdrawal_requests welcome_bonus_withdrawn')
    .lean();

    console.log(`✅ Found ${users.length} users with payments`);

    const allPayments = [];
    
    users.forEach(user => {
      // 1. Regular activation payments
      if (user.activation_requests && user.activation_requests.length > 0) {
        user.activation_requests.forEach(payment => {
          // Check if this is a welcome bonus payment
          const isWelcomeBonus = payment.plan === 'WELCOME_BONUS' || payment.type === 'welcome_bonus_withdrawal';
          
          // Skip approved welcome bonuses (already processed)
          if (isWelcomeBonus && payment.status === 'APPROVED') {
            return;
          }
          
          allPayments.push({
            id: payment._id || payment.id,
            user_id: user._id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            plan: payment.plan,
            mpesa_code: payment.mpesa_code,
            amount: payment.amount,
            status: payment.status,
            created_at: payment.created_at || payment.submitted_at,
            type: isWelcomeBonus ? 'welcome_bonus' : 'activation'
          });
        });
      }
      
      // 2. Welcome bonus withdrawals from withdrawal_requests
      if (user.withdrawal_requests && user.withdrawal_requests.length > 0) {
        user.withdrawal_requests.forEach(withdrawal => {
          if (withdrawal.type === 'welcome_bonus' && withdrawal.status === 'SUBMITTED') {
            // Check if not already added from activation_requests
            const alreadyAdded = allPayments.some(p => 
              p.type === 'welcome_bonus' && 
              p.user_id.toString() === user._id.toString() &&
              p.mpesa_code === withdrawal.mpesa_code
            );
            
            if (!alreadyAdded) {
              allPayments.push({
                id: withdrawal._id || withdrawal.id,
                user_id: user._id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                plan: 'WELCOME_BONUS',
                mpesa_code: withdrawal.mpesa_code || 'N/A',
                amount: 1200,
                status: withdrawal.status,
                created_at: withdrawal.created_at,
                type: 'welcome_bonus'
              });
            }
          }
        });
      }
    });

    // Sort by creation date descending
    allPayments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    console.log(`📊 Returning ${allPayments.length} payments`);
    console.log(`📝 Breakdown: ${allPayments.filter(p => p.type === 'activation').length} activations, ${allPayments.filter(p => p.type === 'welcome_bonus').length} welcome bonuses`);
    
    if (allPayments.length > 0) {
      console.log("📝 Sample payment:", {
        id: allPayments[0].id,
        full_name: allPayments[0].full_name,
        email: allPayments[0].email,
        phone: allPayments[0].phone,
        plan: allPayments[0].plan,
        type: allPayments[0].type,
        status: allPayments[0].status
      });
    }

    res.json({
      success: true,
      count: allPayments.length,
      payments: allPayments
    });
  } catch (error) {
    console.error("❌ Get activation payments error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to load activation payments",
      error: error.message 
    });
  }
};

/**
 * ⏳ GET ONLY PENDING ACTIVATIONS
 * ✅ UPDATED: Includes pending welcome bonus payments
 */
exports.getPendingActivations = async (req, res) => {
  try {
    console.log("📞 GET /admin/activations/pending called");
    
    // Get all users with pending activation requests OR pending welcome bonus
    const users = await User.find({
      $or: [
        { 'activation_requests.status': 'SUBMITTED' },
        { 'withdrawal_requests': { $elemMatch: { type: 'welcome_bonus', status: 'SUBMITTED' } } }
      ]
    })
    .select('full_name email phone activation_requests withdrawal_requests')
    .lean();

    console.log(`✅ Found ${users.length} users with pending payments`);

    const pendingPayments = [];
    
    users.forEach(user => {
      // 1. Regular pending activation payments
      if (user.activation_requests) {
        const pendingRequests = user.activation_requests.filter(
          req => req.status === 'SUBMITTED'
        );
        
        pendingRequests.forEach(payment => {
          pendingPayments.push({
            id: payment._id || payment.id,
            user_id: user._id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            plan: payment.plan,
            mpesa_code: payment.mpesa_code,
            amount: payment.amount,
            created_at: payment.created_at || payment.submitted_at,
            type: (payment.plan === 'WELCOME_BONUS' || payment.type === 'welcome_bonus_withdrawal') ? 'welcome_bonus' : 'activation'
          });
        });
      }
      
      // 2. Pending welcome bonus withdrawals
      if (user.withdrawal_requests) {
        const pendingWelcome = user.withdrawal_requests.filter(
          req => req.type === 'welcome_bonus' && req.status === 'SUBMITTED'
        );
        
        pendingWelcome.forEach(withdrawal => {
          // Check if not already added from activation_requests
          const alreadyAdded = pendingPayments.some(p => 
            p.type === 'welcome_bonus' && 
            p.user_id.toString() === user._id.toString() &&
            p.mpesa_code === withdrawal.mpesa_code
          );
          
          if (!alreadyAdded) {
            pendingPayments.push({
              id: withdrawal._id || withdrawal.id,
              user_id: user._id,
              full_name: user.full_name,
              email: user.email,
              phone: user.phone,
              plan: 'WELCOME_BONUS',
              mpesa_code: withdrawal.mpesa_code || 'N/A',
              amount: 1200,
              created_at: withdrawal.created_at,
              type: 'welcome_bonus'
            });
          }
        });
      }
    });

    // Sort by creation date ascending (oldest first)
    pendingPayments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    console.log(`📊 Returning ${pendingPayments.length} pending payments`);
    console.log(`📝 Pending breakdown: ${pendingPayments.filter(p => p.type === 'activation').length} activations, ${pendingPayments.filter(p => p.type === 'welcome_bonus').length} welcome bonuses`);
    
    res.json({
      success: true,
      count: pendingPayments.length,
      payments: pendingPayments
    });
  } catch (error) {
    console.error("❌ Get pending activations error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to load pending activations",
      error: error.message 
    });
  }
};

/**
 * ✅ APPROVE ACTIVATION (PLAN-BASED — FINAL)
 * ✅ UPDATED: Handles welcome bonus approvals
 */
exports.approveActivation = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const paymentId = req.params.id;
    console.log(`✅ Processing payment approval: ${paymentId}`);

    // Find user with the specific request (check both activation_requests and withdrawal_requests)
    const user = await User.findOne({
      $or: [
        { 'activation_requests._id': paymentId },
        { 'withdrawal_requests._id': paymentId }
      ]
    }).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false,
        message: "Payment not found" 
      });
    }

    // Check if it's in activation_requests or withdrawal_requests
    let payment = user.activation_requests?.find(
      req => req._id.toString() === paymentId
    );
    
    let isWelcomeBonus = false;
    let isFromWithdrawal = false;
    
    if (!payment) {
      // Check withdrawal_requests
      payment = user.withdrawal_requests?.find(
        req => req._id.toString() === paymentId
      );
      isFromWithdrawal = true;
      
      if (payment) {
        isWelcomeBonus = payment.type === 'welcome_bonus';
      }
    } else {
      isWelcomeBonus = payment.plan === 'WELCOME_BONUS' || payment.type === 'welcome_bonus_withdrawal';
    }

    if (!payment) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false,
        message: "Payment not found" 
      });
    }

    if (payment.status !== "SUBMITTED") {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: "Payment already processed" 
      });
    }

    // 🔥 Handle welcome bonus approval
    if (isWelcomeBonus) {
      console.log(`🎁 Approving welcome bonus for user: ${user.full_name}`);
      
      // Update payment status
      payment.status = 'APPROVED';
      payment.processed_at = new Date();
      
      // Also update corresponding request in other array if exists
      if (isFromWithdrawal) {
        // Find and update activation request with same M-Pesa code
        const activationRequest = user.activation_requests?.find(
          req => req.mpesa_code === payment.mpesa_code && 
                (req.plan === 'WELCOME_BONUS' || req.type === 'welcome_bonus_withdrawal')
        );
        if (activationRequest && activationRequest.status === 'SUBMITTED') {
          activationRequest.status = 'APPROVED';
          activationRequest.processed_at = new Date();
        }
      } else {
        // Find and update withdrawal request with same M-Pesa code
        const withdrawalRequest = user.withdrawal_requests?.find(
          req => req.type === 'welcome_bonus' && 
                req.mpesa_code === payment.mpesa_code &&
                req.status === 'SUBMITTED'
        );
        if (withdrawalRequest) {
          withdrawalRequest.status = 'APPROVED';
          withdrawalRequest.processed_at = new Date();
        }
      }
      
      // Welcome bonus is already marked as withdrawn, just approve
      
      await user.save({ session });
      await session.commitTransaction();

      console.log(`✅ Welcome bonus approved for user: ${user.full_name}`);

      return res.json({
        success: true,
        message: "✅ Welcome bonus withdrawal approved",
        user_id: user._id,
        plan: 'WELCOME_BONUS',
        full_name: user.full_name,
        amount_credited: 1200
      });
    }
    
    // 🔥 Handle regular activation approval (existing logic)
    const { plan, amount } = payment;
    console.log(`📋 Processing regular activation: ${plan} plan, KES ${amount}`);

    // Check if user has completed required surveys for this plan
    if (!user.plans || !user.plans[plan]) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "User doesn't have this plan"
      });
    }

    const userPlan = user.plans[plan];

    if (!userPlan.completed || userPlan.surveys_completed !== TOTAL_SURVEYS) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "User has not completed required surveys",
        surveys_completed: userPlan.surveys_completed,
        required: TOTAL_SURVEYS
      });
    }

    if (userPlan.is_activated) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
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

    console.log(`✅ Activation approved for user: ${user.full_name}`);

    res.json({
      success: true,
      message: "✅ Activation approved",
      user_id: user._id,
      plan: plan,
      withdraw_unlocked: true,
      full_name: user.full_name,
      amount_credited: amount
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("❌ Approve activation error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to approve activation",
      error: error.message 
    });
  } finally {
    session.endSession();
  }
};

/**
 * ❌ REJECT ACTIVATION
 * ✅ UPDATED: Handles welcome bonus rejections
 */
exports.rejectActivation = async (req, res) => {
  try {
    const paymentId = req.params.id;
    console.log(`❌ Processing payment rejection: ${paymentId}`);

    // Find user with the specific request
    const user = await User.findOne({
      $or: [
        { 'activation_requests._id': paymentId },
        { 'withdrawal_requests._id': paymentId }
      ]
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Payment not found or already processed"
      });
    }

    // Check if it's in activation_requests or withdrawal_requests
    let payment = user.activation_requests?.find(
      req => req._id.toString() === paymentId && req.status === 'SUBMITTED'
    );
    
    let isWelcomeBonus = false;
    let isFromWithdrawal = false;
    
    if (!payment) {
      payment = user.withdrawal_requests?.find(
        req => req._id.toString() === paymentId && req.status === 'SUBMITTED'
      );
      isFromWithdrawal = true;
      
      if (payment) {
        isWelcomeBonus = payment.type === 'welcome_bonus';
      }
    } else {
      isWelcomeBonus = payment.plan === 'WELCOME_BONUS' || payment.type === 'welcome_bonus_withdrawal';
    }

    if (!payment) {
      return res.status(400).json({
        success: false,
        message: "Payment not found or already processed"
      });
    }

    // Update payment status
    payment.status = 'REJECTED';
    payment.processed_at = new Date();
    
    // Also update corresponding request in other array if exists
    if (isWelcomeBonus) {
      if (isFromWithdrawal) {
        // Find and update activation request with same M-Pesa code
        const activationRequest = user.activation_requests?.find(
          req => req.mpesa_code === payment.mpesa_code && 
                (req.plan === 'WELCOME_BONUS' || req.type === 'welcome_bonus_withdrawal')
        );
        if (activationRequest && activationRequest.status === 'SUBMITTED') {
          activationRequest.status = 'REJECTED';
          activationRequest.processed_at = new Date();
        }
        
        // Allow resubmission by resetting welcome_bonus_withdrawn
        user.welcome_bonus_withdrawn = false;
      } else {
        // Find and update withdrawal request with same M-Pesa code
        const withdrawalRequest = user.withdrawal_requests?.find(
          req => req.type === 'welcome_bonus' && 
                req.mpesa_code === payment.mpesa_code &&
                req.status === 'SUBMITTED'
        );
        if (withdrawalRequest) {
          withdrawalRequest.status = 'REJECTED';
          withdrawalRequest.processed_at = new Date();
        }
        
        // Allow resubmission by resetting welcome_bonus_withdrawn
        user.welcome_bonus_withdrawn = false;
      }
    }

    await user.save();

    console.log(`❌ Payment rejected for user: ${user.full_name}`);

    res.json({
      success: true,
      message: isWelcomeBonus ? "❌ Welcome bonus rejected - User can resubmit" : "❌ Activation rejected",
      user_id: user._id,
      plan: isWelcomeBonus ? 'WELCOME_BONUS' : payment.plan,
      full_name: user.full_name,
      can_resubmit: isWelcomeBonus // Indicate if user can resubmit
    });
  } catch (error) {
    console.error("❌ Reject activation error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to reject activation",
      error: error.message 
    });
  }
};

/**
 * 📊 GET ACTIVATION STATS (Optional - Useful for admin dashboard)
 * ✅ UPDATED: Includes welcome bonus stats
 */
exports.getActivationStats = async (req, res) => {
  try {
    console.log("📊 Getting activation stats");
    
    const allUsers = await User.find({
      $or: [
        { 'activation_requests.0': { $exists: true } },
        { 'welcome_bonus_withdrawn': true }
      ]
    }).select('activation_requests withdrawal_requests');

    let stats = {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      totalRevenue: 0,
      welcomeBonuses: {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0
      },
      regularActivations: {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0
      }
    };

    allUsers.forEach(user => {
      // Process activation_requests
      if (user.activation_requests) {
        user.activation_requests.forEach(payment => {
          const isWelcomeBonus = payment.plan === 'WELCOME_BONUS' || payment.type === 'welcome_bonus_withdrawal';
          
          stats.total++;
          
          if (isWelcomeBonus) {
            stats.welcomeBonuses.total++;
            
            if (payment.status === 'APPROVED') {
              stats.welcomeBonuses.approved++;
              stats.approved++;
            } else if (payment.status === 'SUBMITTED') {
              stats.welcomeBonuses.pending++;
              stats.pending++;
            } else if (payment.status === 'REJECTED') {
              stats.welcomeBonuses.rejected++;
              stats.rejected++;
            }
          } else {
            stats.regularActivations.total++;
            
            if (payment.status === 'APPROVED') {
              stats.regularActivations.approved++;
              stats.approved++;
              stats.totalRevenue += payment.amount || 0;
            } else if (payment.status === 'SUBMITTED') {
              stats.regularActivations.pending++;
              stats.pending++;
            } else if (payment.status === 'REJECTED') {
              stats.regularActivations.rejected++;
              stats.rejected++;
            }
          }
        });
      }
      
      // Process withdrawal_requests for welcome bonuses
      if (user.withdrawal_requests) {
        user.withdrawal_requests.forEach(withdrawal => {
          if (withdrawal.type === 'welcome_bonus') {
            stats.total++;
            stats.welcomeBonuses.total++;
            
            if (withdrawal.status === 'APPROVED') {
              stats.welcomeBonuses.approved++;
              stats.approved++;
            } else if (withdrawal.status === 'SUBMITTED') {
              stats.welcomeBonuses.pending++;
              stats.pending++;
            } else if (withdrawal.status === 'REJECTED') {
              stats.welcomeBonuses.rejected++;
              stats.rejected++;
            }
          }
        });
      }
    });

    console.log("📈 Activation stats:", stats);

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error("❌ Get activation stats error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to load activation stats",
      error: error.message 
    });
  }
};