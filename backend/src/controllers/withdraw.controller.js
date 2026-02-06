const mongoose = require("mongoose");
const User = require("../models/User");

/* ===============================
   CONFIG
================================ */
const MIN_WITHDRAW = 200;
const MAX_WITHDRAW = 500000;
const DAILY_WITHDRAW_LIMIT = 93;
const TOTAL_SURVEYS = 10;

/* ===============================
   PLAN WITHDRAW FEES (KES)
================================ */
const WITHDRAW_FEES = {
  REGULAR: 10,
  VIP: 5,
  VVIP: 0,
};

/* =====================================
   USER — REQUEST WITHDRAWAL
===================================== */
exports.requestWithdraw = async (req, res) => {
  try {
    const userId = req.user.id;
    let { phone_number, amount, type } = req.body;

    if (!phone_number || !amount) {
      return res.status(400).json({
        message: "Phone number and amount are required",
      });
    }

    const withdrawAmount = Number(amount);
    phone_number = String(phone_number).trim();

    if (!Number.isFinite(withdrawAmount)) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (withdrawAmount < MIN_WITHDRAW || withdrawAmount > MAX_WITHDRAW) {
      return res.status(400).json({
        message: `Withdrawal must be between KES ${MIN_WITHDRAW} and ${MAX_WITHDRAW}`,
      });
    }

    // ✅ CHANGED: MongoDB find instead of pool.query
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate total surveys completed
    let totalSurveysCompleted = 0;
    if (user.plans) {
      for (const planKey in user.plans) {
        if (user.plans[planKey]) {
          totalSurveysCompleted += user.plans[planKey].surveys_completed || 0;
        }
      }
    }

    // -------------------------------
    // 🌟 SPECIAL LOGIC FOR WELCOME BONUS
    // -------------------------------
    if (type === "welcome_bonus") {
      if (user.welcome_bonus_withdrawn) {
        return res.status(400).json({ message: "Welcome bonus already withdrawn" });
      }

      if (!user.is_activated) {
        return res.status(403).json({
          message: "⚠️ Account not activated. Activate your account with KSh 100 to withdraw your welcome bonus",
        });
      }

      if (withdrawAmount > (user.welcome_bonus || 0)) {
        return res.status(400).json({
          message: "Withdrawal amount exceeds available welcome bonus",
        });
      }

      // Initialize withdrawal_requests array if it doesn't exist
      if (!user.withdrawal_requests) {
        user.withdrawal_requests = [];
      }

      // Add withdrawal request
      user.withdrawal_requests.push({
        phone_number: phone_number,
        amount: withdrawAmount,
        fee: 0,
        net_amount: withdrawAmount,
        status: 'PROCESSING',
        type: 'welcome_bonus',
        created_at: new Date()
      });

      // Mark welcome bonus as withdrawn
      user.welcome_bonus_withdrawn = true;

      await user.save();

      return res.json({
        message: "🎉 Your welcome bonus withdrawal request is being processed!",
        status: "PROCESSING",
        gross_amount: withdrawAmount,
        fee: 0,
        net_amount: withdrawAmount,
      });
    }

    // -------------------------------
    // 🌟 NORMAL BALANCE WITHDRAWAL
    // -------------------------------
    if (!user.is_activated) {
      return res.status(403).json({ message: "Account not activated" });
    }

    // Check if user has completed the required surveys
    if (totalSurveysCompleted < TOTAL_SURVEYS) {
      return res.status(403).json({
        message: `Please complete all ${TOTAL_SURVEYS} surveys before withdrawal. You have completed ${totalSurveysCompleted || 0} surveys.`,
      });
    }

    // Check for existing PENDING/PROCESSING withdrawal for THIS SPECIFIC PLAN
    if (user.withdrawal_requests) {
      const activeWithdrawal = user.withdrawal_requests.find(
        req => req.type === type && ['PROCESSING', 'PENDING'].includes(req.status)
      );
      
      if (activeWithdrawal) {
        return res.status(409).json({
          message: `You already have a ${type} withdrawal pending. Please share your referral link to speed up processing!`,
        });
      }
    }

    const fee = WITHDRAW_FEES[user.plan] ?? WITHDRAW_FEES.REGULAR;

    if (withdrawAmount <= fee) {
      return res.status(400).json({ message: "Amount too low after fees" });
    }

    if ((user.total_earned || 0) < withdrawAmount) {
      return res.status(403).json({ message: "Insufficient balance" });
    }

    // Check daily withdrawal limit
    if (user.withdrawal_requests) {
      const today = new Date().toDateString();
      const dailyCount = user.withdrawal_requests.filter(req => {
        const reqDate = new Date(req.created_at).toDateString();
        return reqDate === today && ['PROCESSING', 'PENDING', 'APPROVED'].includes(req.status);
      }).length;
      
      if (dailyCount >= DAILY_WITHDRAW_LIMIT) {
        return res.status(429).json({
          message: `Daily withdrawal limit of ${DAILY_WITHDRAW_LIMIT} reached. Try again tomorrow.`,
        });
      }
    }

    const netAmount = withdrawAmount - fee;

    // Initialize withdrawal_requests array if it doesn't exist
    if (!user.withdrawal_requests) {
      user.withdrawal_requests = [];
    }

    // Add withdrawal request
    const withdrawalRequest = {
      phone_number: phone_number,
      amount: withdrawAmount,
      fee: fee,
      net_amount: netAmount,
      status: 'PROCESSING',
      type: type,
      created_at: new Date()
    };

    user.withdrawal_requests.push(withdrawalRequest);

    // Deduct from total_earned
    user.total_earned = (user.total_earned || 0) - withdrawAmount;

    await user.save();

    // Get the ID of the newly created withdrawal request
    const savedUser = await User.findById(userId);
    const latestWithdrawal = savedUser.withdrawal_requests[savedUser.withdrawal_requests.length - 1];

    res.json({
      message: `🎉 Your withdrawal request is being processed! Share your referral link with 3+ people for faster approval.`,
      status: "PROCESSING",
      gross_amount: withdrawAmount,
      fee,
      net_amount: netAmount,
      id: latestWithdrawal._id,
      type: type
    });
  } catch (error) {
    console.error("❌ Withdraw request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================
   USER — GET WITHDRAWAL HISTORY
===================================== */
exports.getUserWithdrawalHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('withdrawal_requests full_name email phone');
    
    if (!user || !user.withdrawal_requests) {
      return res.json([]);
    }

    // Map withdrawal requests with status messages
    const withdrawals = user.withdrawal_requests.map(withdrawal => ({
      id: withdrawal._id,
      phone_number: withdrawal.phone_number,
      amount: withdrawal.amount,
      fee: withdrawal.fee,
      net_amount: withdrawal.net_amount,
      status: withdrawal.status,
      type: withdrawal.type,
      created_at: withdrawal.created_at,
      user_name: user.full_name || 'User', // ADDED: User name
      user_email: user.email,
      user_phone: user.phone,
      status_message: 
        withdrawal.status === 'PROCESSING' ? 'Share referral link for faster approval' :
        withdrawal.status === 'PENDING' ? 'Awaiting admin approval' :
        withdrawal.status === 'APPROVED' ? 'Payment processed' :
        withdrawal.status === 'REJECTED' ? 'Request declined' :
        'Unknown status'
    })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 20);

    res.json(withdrawals);
  } catch (error) {
    console.error("❌ Get withdrawal history error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================
   ADMIN — GET PENDING WITHDRAWALS
===================================== */
exports.getPendingWithdrawals = async (req, res) => {
  try {
    // Find all users with pending withdrawal requests
    const users = await User.find({
      'withdrawal_requests.status': { $in: ['PROCESSING', 'PENDING'] }
    }).select('full_name email phone withdrawal_requests');

    // Format the response
    const pendingWithdrawals = [];
    
    users.forEach(user => {
      user.withdrawal_requests.forEach(withdrawal => {
        if (['PROCESSING', 'PENDING'].includes(withdrawal.status)) {
          pendingWithdrawals.push({
            id: withdrawal._id,
            user_id: user._id,
            user_name: user.full_name || 'User', // ADDED: User name with fallback
            user_email: user.email || 'No email',
            user_phone: user.phone || 'No phone',
            phone_number: withdrawal.phone_number,
            amount: withdrawal.amount,
            fee: withdrawal.fee,
            net_amount: withdrawal.net_amount,
            status: withdrawal.status,
            type: withdrawal.type,
            created_at: withdrawal.created_at
          });
        }
      });
    });

    // Sort by creation date (newest first)
    pendingWithdrawals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(pendingWithdrawals);
  } catch (error) {
    console.error("❌ Get pending withdrawals error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================
   ADMIN — GET ALL WITHDRAWALS
===================================== */
exports.getAllWithdrawals = async (req, res) => {
  try {
    // Find all users with withdrawal requests
    const users = await User.find({
      'withdrawal_requests.0': { $exists: true } // Users with at least one withdrawal
    }).select('full_name email phone withdrawal_requests');

    // Format the response
    const allWithdrawals = [];
    
    users.forEach(user => {
      user.withdrawal_requests.forEach(withdrawal => {
        allWithdrawals.push({
          id: withdrawal._id,
          user_id: user._id,
          user_name: user.full_name || 'User', // ADDED: User name with fallback
          user_email: user.email || 'No email',
          user_phone: user.phone || 'No phone',
          phone_number: withdrawal.phone_number,
          amount: withdrawal.amount,
          fee: withdrawal.fee,
          net_amount: withdrawal.net_amount,
          status: withdrawal.status,
          type: withdrawal.type,
          created_at: withdrawal.created_at,
          processed_at: withdrawal.processed_at
        });
      });
    });

    // Sort by creation date (newest first)
    allWithdrawals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(allWithdrawals);
  } catch (error) {
    console.error("❌ Get all withdrawals error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================
   ADMIN — APPROVE WITHDRAWAL
===================================== */
exports.approveWithdraw = async (req, res) => {
  try {
    const withdrawalId = req.params.id;

    // Find user with this withdrawal
    const user = await User.findOne({
      'withdrawal_requests._id': withdrawalId
    }).select('full_name email');

    if (!user) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    // Find the specific withdrawal request
    const withdrawal = user.withdrawal_requests.id(withdrawalId);
    
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (!['PROCESSING', 'PENDING'].includes(withdrawal.status)) {
      return res.status(400).json({ message: "Withdrawal already processed" });
    }

    // Update withdrawal status
    withdrawal.status = 'APPROVED';
    withdrawal.processed_at = new Date();
    
    await user.save();

    res.json({ 
      message: "Withdrawal approved",
      withdrawal_id: withdrawalId,
      user_id: user._id,
      user_name: user.full_name, // ADDED: User name
      user_email: user.email,
      amount: withdrawal.amount
    });
  } catch (error) {
    console.error("Approve withdrawal error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================
   ADMIN — REJECT WITHDRAWAL
===================================== */
exports.rejectWithdraw = async (req, res) => {
  try {
    const withdrawalId = req.params.id;

    // Find user with this withdrawal
    const user = await User.findOne({
      'withdrawal_requests._id': withdrawalId
    }).select('full_name email total_earned');

    if (!user) {
      return res.status(404).json({ message: "Withdrawal request not found" });
    }

    // Find the specific withdrawal request
    const withdrawal = user.withdrawal_requests.id(withdrawalId);
    
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal request not found" });
    }

    if (!['PROCESSING', 'PENDING'].includes(withdrawal.status)) {
      return res.status(400).json({ message: "Withdrawal already processed" });
    }

    // Update withdrawal status
    withdrawal.status = 'REJECTED';
    withdrawal.processed_at = new Date();

    // Refund amount to user's total_earned (if it was a balance withdrawal)
    if (withdrawal.type !== 'welcome_bonus') {
      user.total_earned = (user.total_earned || 0) + withdrawal.amount;
    }
    
    await user.save();

    res.json({ 
      message: "Withdrawal rejected and amount refunded",
      withdrawal_id: withdrawalId,
      user_id: user._id,
      user_name: user.full_name, // ADDED: User name
      user_email: user.email,
      amount: withdrawal.amount,
      refunded: withdrawal.type !== 'welcome_bonus'
    });
  } catch (error) {
    console.error("Reject withdrawal error:", error);
    res.status(500).json({ message: "Server error" });
  }
};