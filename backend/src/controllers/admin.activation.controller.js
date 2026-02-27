const mongoose = require("mongoose");
const User = require("../models/User");

const TOTAL_SURVEYS = 10;

/* ===============================
   PLAN EARNINGS (AMOUNT USER RECEIVES)
================================ */
const PLAN_EARNINGS = {
  REGULAR: 1500,
  VIP: 2000,
  VVIP: 3000,
  WELCOME_BONUS: 1200
};

/* =====================================================
   💳 ACTIVATION PAYMENTS — ADMIN CONTROLLER (FIXED WITH EARNINGS)
===================================================== */

/**
 * 🔍 GET ALL ACTIVATION PAYMENTS
 */
exports.getActivationPayments = async (req, res) => {
  try {
    console.log("📞 GET /admin/activations called");
    
    const users = await User.find({
      $or: [
        { 'activation_requests.0': { $exists: true } },
        { 'welcome_bonus_withdrawn': true }
      ]
    })
    .select('full_name email phone activation_requests withdrawal_requests welcome_bonus_withdrawn')
    .lean();

    console.log(`✅ Found ${users.length} users with payments`);

    const allPayments = [];
    
    users.forEach(user => {
      // ✅ NEW: Initial account activation payments
      if (user.initial_activation_request && user.initial_activation_request.is_initial) {
        allPayments.push({
          id: user._id + '_initial',
          user_id: user._id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          plan: 'INITIAL_ACTIVATION',
          mpesa_code: user.initial_activation_request.mpesa_code,
          amount: user.initial_activation_request.amount || 100,
          status: user.initial_activation_request.status,
          created_at: user.initial_activation_request.created_at,
          type: 'initial_activation',
          is_initial: true
        });
      }

      // 1. Regular activation payments
      if (user.activation_requests && user.activation_requests.length > 0) {
        user.activation_requests.forEach(payment => {
          const isWelcomeBonus = payment.plan === 'WELCOME_BONUS' || payment.type === 'welcome_bonus_withdrawal';
          
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

    allPayments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
 */
exports.getPendingActivations = async (req, res) => {
  try {
    console.log("📞 GET /admin/activations/pending called");
    
    const users = await User.find({
      $or: [
        { 'activation_requests.status': 'SUBMITTED' },
        { 'withdrawal_requests': { $elemMatch: { type: 'welcome_bonus', status: 'SUBMITTED' } } }
      ]
    })
    .select('full_name email phone activation_requests withdrawal_requests')
    .lean();

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
      
      if (user.withdrawal_requests) {
        const pendingWelcome = user.withdrawal_requests.filter(
          req => req.type === 'welcome_bonus' && req.status === 'SUBMITTED'
        );
        
        pendingWelcome.forEach(withdrawal => {
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

    pendingPayments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

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
 * ✅ APPROVE ACTIVATION (FIXED WITH CORRECT EARNINGS)
 */
exports.approveActivation = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();
    
    const paymentId = req.params.id;
    console.log(`✅ Processing payment approval: ${paymentId}`);

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

    let payment = user.activation_requests?.find(
      req => req._id.toString() === paymentId
    );
    
    let isWelcomeBonus = false;
    let isFromWithdrawal = false;
    let isInitialActivation = false;
    
    // ✅ NEW: Check if this is initial activation
    if (!payment && paymentId.includes('_initial')) {
      const userId = paymentId.replace('_initial', '');
      const initialUser = await User.findById(userId).session(session);
      if (initialUser && initialUser.initial_activation_request) {
        payment = initialUser.initial_activation_request;
        isInitialActivation = true;
        // Also update the user reference
        user = initialUser;
      }
    }
    
    if (!payment) {
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
      
      payment.status = 'APPROVED';
      payment.processed_at = new Date();
      
      // 🔥 ADD WELCOME BONUS TO BALANCE
      const oldBalance = user.total_earned || 0;
      user.total_earned = oldBalance + PLAN_EARNINGS.WELCOME_BONUS;
      
      console.log(`💰 Added KES ${PLAN_EARNINGS.WELCOME_BONUS} welcome bonus to ${user.full_name}`);
      console.log(`💰 Old balance: ${oldBalance}, New balance: ${user.total_earned}`);
      
      if (isFromWithdrawal) {
        const activationRequest = user.activation_requests?.find(
          req => req.mpesa_code === payment.mpesa_code && 
                (req.plan === 'WELCOME_BONUS' || req.type === 'welcome_bonus_withdrawal')
        );
        if (activationRequest && activationRequest.status === 'SUBMITTED') {
          activationRequest.status = 'APPROVED';
          activationRequest.processed_at = new Date();
        }
      } else {
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
      
      await user.save({ session });
      await session.commitTransaction();

      // 🎁 Award referral commission to upline (if user was referred)
      if (user.referred_by) {
        const REFERRAL_BONUS = 50;
        const referrer = await User.findById(user.referred_by).session(session);
        
        if (referrer) {
          // Check if already earned from this user (max once per invitee)
          const alreadyPaid = referrer.referral_commissions?.some(
            comm => comm.referred_user_id?.toString() === user._id.toString() && comm.from_activation === true
          );
          
          if (!alreadyPaid) {
            // Award referral bonus
            const oldReferralBalance = referrer.referral_commission_earned || 0;
            referrer.referral_commission_earned = oldReferralBalance + REFERRAL_BONUS;
            
            // Add to referral_commissions array
            if (!referrer.referral_commissions) referrer.referral_commissions = [];
            referrer.referral_commissions.push({
              referred_user_id: user._id,
              referred_user_name: user.full_name,
              amount: REFERRAL_BONUS,
              status: 'CREDITED',
              from_activation: true,
              created_at: new Date()
            });
            
            await referrer.save({ session });
            console.log(`🎁 Awarded KES ${REFERRAL_BONUS} referral commission to referrer ${referrer.full_name} for inviting ${user.full_name}`);
          } else {
            console.log(`⚠️ Referrer already earned commission from this user - skipping`);
          }
        }
      }

      return res.json({
        success: true,
        message: "✅ Welcome bonus approved",
        user_id: user._id,
        plan: 'WELCOME_BONUS',
        full_name: user.full_name,
        balance_added: PLAN_EARNINGS.WELCOME_BONUS,
        new_balance: user.total_earned
      });
    }
    
    // 🔥 Handle regular activation approval
    const { plan } = payment;
    console.log(`📋 Processing regular activation: ${plan} plan`);

    // Check if user has this plan
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
    user.plans[plan].activated_at = new Date();
    
    // Set global user activation
    user.is_activated = true;
    
    // 🔥 ADD PLAN EARNINGS TO BALANCE (using correct amounts)
    const earningsToAdd = PLAN_EARNINGS[plan] || 0;
    const oldBalance = user.total_earned || 0;
    user.total_earned = oldBalance + earningsToAdd;
    
    console.log(`💰 Added KES ${earningsToAdd} to user balance for ${plan} plan activation`);
    console.log(`💰 Old balance: ${oldBalance}, New balance: ${user.total_earned}`);

    await user.save({ session });
    await session.commitTransaction();

    // 🎁 Award referral commission to upline (if user was referred)
    if (user.referred_by) {
      const REFERRAL_BONUS = 50;
      const referrer = await User.findById(user.referred_by).session(session);
      
      if (referrer) {
        // Check if already earned from this user (max once per invitee)
        const alreadyPaid = referrer.referral_commissions?.some(
          comm => comm.referred_user_id?.toString() === user._id.toString() && comm.from_activation === true
        );
        
        if (!alreadyPaid) {
          // Award referral bonus
          const oldReferralBalance = referrer.referral_commission_earned || 0;
          referrer.referral_commission_earned = oldReferralBalance + REFERRAL_BONUS;
          
          // Add to referral_commissions array
          if (!referrer.referral_commissions) referrer.referral_commissions = [];
          referrer.referral_commissions.push({
            referred_user_id: user._id,
            referred_user_name: user.full_name,
            amount: REFERRAL_BONUS,
            status: 'CREDITED',
            from_activation: true,
            created_at: new Date()
          });
          
          await referrer.save({ session });
          console.log(`🎁 Awarded KES ${REFERRAL_BONUS} referral commission to referrer ${referrer.full_name} for inviting ${user.full_name}`);
        } else {
          console.log(`⚠️ Referrer already earned commission from this user - skipping`);
        }
      }
    }

    console.log(`✅ Activation approved for user: ${user.full_name}`);

    res.json({
      success: true,
      message: "✅ Activation approved",
      user_id: user._id,
      plan: plan,
      full_name: user.full_name,
      balance_added: earningsToAdd,
      new_balance: user.total_earned,
      withdraw_unlocked: true
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
 */
exports.rejectActivation = async (req, res) => {
  try {
    const paymentId = req.params.id;
    console.log(`❌ Processing payment rejection: ${paymentId}`);

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

    payment.status = 'REJECTED';
    payment.processed_at = new Date();
    
    if (isWelcomeBonus) {
      if (isFromWithdrawal) {
        const activationRequest = user.activation_requests?.find(
          req => req.mpesa_code === payment.mpesa_code && 
                (req.plan === 'WELCOME_BONUS' || req.type === 'welcome_bonus_withdrawal')
        );
        if (activationRequest && activationRequest.status === 'SUBMITTED') {
          activationRequest.status = 'REJECTED';
          activationRequest.processed_at = new Date();
        }
        user.welcome_bonus_withdrawn = false;
      } else {
        const withdrawalRequest = user.withdrawal_requests?.find(
          req => req.type === 'welcome_bonus' && 
                req.mpesa_code === payment.mpesa_code &&
                req.status === 'SUBMITTED'
        );
        if (withdrawalRequest) {
          withdrawalRequest.status = 'REJECTED';
          withdrawalRequest.processed_at = new Date();
        }
        user.welcome_bonus_withdrawn = false;
      }
    }

    await user.save();

    res.json({
      success: true,
      message: isWelcomeBonus ? "❌ Welcome bonus rejected - User can resubmit" : "❌ Activation rejected",
      user_id: user._id,
      plan: isWelcomeBonus ? 'WELCOME_BONUS' : payment.plan,
      full_name: user.full_name,
      can_resubmit: isWelcomeBonus
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
 * 📊 GET ACTIVATION STATS
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

/* =====================================================
   ✅ NEW: INITIAL ACCOUNT ACTIVATION CONTROLLERS
===================================================== */

/**
 * 🔍 GET INITIAL ACTIVATION PAYMENTS
 * Get all users who have submitted initial activation requests
 */
exports.getInitialActivations = async (req, res) => {
  try {
    console.log("📞 GET /admin/activations/initial called");
    
    const users = await User.find({
      'initial_activation_request.0': { $exists: true }
    })
    .select('full_name email phone initial_activation_request created_at')
    .lean();

    console.log(`✅ Found ${users.length} users with initial activations`);

    const activations = users.map(user => ({
      id: user._id + '_initial',
      user_id: user._id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      mpesa_code: user.initial_activation_request?.mpesa_code,
      amount: user.initial_activation_request?.amount || 100,
      status: user.initial_activation_request?.status,
      created_at: user.initial_activation_request?.created_at,
      user_created_at: user.created_at
    }));

    res.json({
      success: true,
      activations
    });
  } catch (error) {
    console.error("❌ Error fetching initial activations:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✅ APPROVE INITIAL ACTIVATION
 */
exports.approveInitialActivation = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`✅ Approving initial activation for user: ${userId}`);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.initial_activation_request) {
      return res.status(400).json({ success: false, message: "No initial activation request found" });
    }

    if (user.initial_activation_request.status !== "SUBMITTED") {
      return res.status(400).json({ success: false, message: "Activation already processed" });
    }

    // Update the initial activation status
    user.initial_activation_request.status = 'APPROVED';
    user.initial_activation_request.processed_at = new Date();
    user.initial_activation_paid = true; // ✅ Mark as paid

    await user.save();

    console.log(`✅ Initial activation approved for user: ${userId}`);

    res.json({
      success: true,
      message: "Initial activation approved successfully"
    });
  } catch (error) {
    console.error("❌ Error approving initial activation:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ❌ REJECT INITIAL ACTIVATION
 */
exports.rejectInitialActivation = async (req, res) => {
  try {
    const { userId } = req.params;
    const { admin_notes } = req.body;
    console.log(`❌ Rejecting initial activation for user: ${userId}`);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.initial_activation_request) {
      return res.status(400).json({ success: false, message: "No initial activation request found" });
    }

    // Update the initial activation status
    user.initial_activation_request.status = 'REJECTED';
    user.initial_activation_request.processed_at = new Date();
    user.initial_activation_request.admin_notes = admin_notes || 'Payment rejected';

    await user.save();

    console.log(`❌ Initial activation rejected for user: ${userId}`);

    res.json({
      success: true,
      message: "Initial activation rejected"
    });
  } catch (error) {
    console.error("❌ Error rejecting initial activation:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};