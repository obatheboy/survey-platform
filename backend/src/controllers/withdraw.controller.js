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
   ✅ ADDED: Detailed debug logging
===================================== */
exports.requestWithdraw = async (req, res) => {
  try {
    const userId = req.user.id;
    let { phone_number, amount, type, mpesa_code } = req.body;

    // 🟢🟢🟢 DEBUG: Log the request
    console.log("\n🔵🔵🔵 WITHDRAWAL REQUEST DEBUG 🔵🔵🔵");
    console.log("Timestamp:", new Date().toISOString());
    console.log("User ID:", userId);
    console.log("Request body:", { phone_number, amount, type, mpesa_code });

    if (!phone_number || !amount) {
      console.log("❌ Missing phone_number or amount");
      return res.status(400).json({
        message: "Phone number and amount are required",
      });
    }

    // ✅ M-Pesa code is required for welcome bonus
    if (type === "welcome_bonus" && !mpesa_code) {
      console.log("❌ Welcome bonus missing M-Pesa code");
      return res.status(400).json({
        message: "M-Pesa transaction code is required for welcome bonus withdrawal"
      });
    }

    const withdrawAmount = Number(amount);
    phone_number = String(phone_number).trim();
    mpesa_code = mpesa_code ? String(mpesa_code).trim().toUpperCase() : null;

    if (!Number.isFinite(withdrawAmount)) {
      console.log("❌ Invalid amount:", amount);
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (withdrawAmount < MIN_WITHDRAW || withdrawAmount > MAX_WITHDRAW) {
      console.log(`❌ Amount outside range: ${withdrawAmount}`);
      return res.status(400).json({
        message: `Withdrawal must be between KES ${MIN_WITHDRAW} and ${MAX_WITHDRAW}`,
      });
    }

    console.log("🔍 Fetching user from database...");
    const user = await User.findById(userId);
    if (!user) {
      console.log("❌ User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // 🟢 DEBUG: Log complete user data
    console.log("\n📊 USER DATA FROM DATABASE:");
    console.log("User name:", user.full_name);
    console.log("User email:", user.email);
    console.log("User is_activated:", user.is_activated);
    console.log("User total_earned:", user.total_earned);
    console.log("User welcome_bonus:", user.welcome_bonus);
    console.log("User welcome_bonus_withdrawn:", user.welcome_bonus_withdrawn);
    
    console.log("\n📊 PLANS DATA:");
    if (user.plans) {
      Object.keys(user.plans).forEach(planKey => {
        const plan = user.plans[planKey];
        console.log(`${planKey}:`, {
          surveys_completed: plan?.surveys_completed,
          is_activated: plan?.is_activated,
          completed: plan?.completed,
          activated_at: plan?.activated_at
        });
      });
    } else {
      console.log("No plans found in user document");
    }

    // Calculate surveys completed for the specific plan (if not welcome bonus)
    let planSurveysCompleted = 0;
    let isPlanActivated = false;
    
    if (type !== "welcome_bonus") {
      console.log(`\n🔍 Checking ${type} plan specifically:`);
      
      // Check if the plan exists in user's plans
      if (!user.plans || !user.plans[type]) {
        console.log(`❌ Plan ${type} not found in user.plans`);
        return res.status(400).json({ 
          message: `Invalid plan type. Please select a valid plan (REGULAR, VIP, or VVIP).` 
        });
      }
      
      // Check if this specific plan is activated
      isPlanActivated = user.plans[type].is_activated === true;
      planSurveysCompleted = user.plans[type].surveys_completed || 0;
      
      console.log(`${type} plan details:`, {
        is_activated: user.plans[type].is_activated,
        surveys_completed: user.plans[type].surveys_completed,
        completed: user.plans[type].completed,
        isPlanActivated: isPlanActivated,
        planSurveysCompleted: planSurveysCompleted,
        requiredSurveys: TOTAL_SURVEYS
      });
    }

    // -------------------------------
    // 🌟 SPECIAL LOGIC FOR WELCOME BONUS
    // -------------------------------
    if (type === "welcome_bonus") {
      console.log(`🎁 Welcome bonus withdrawal requested by ${user.full_name || user.email}`);
      
      // ✅ ALLOW RESUBMISSION: Check if previous was rejected
      const previousRejected = user.withdrawal_requests?.find(
        req => req.type === 'welcome_bonus' && req.status === 'REJECTED'
      );
      
      if (user.welcome_bonus_withdrawn && !previousRejected) {
        console.log("❌ Welcome bonus already withdrawn");
        return res.status(400).json({ message: "Welcome bonus already withdrawn" });
      }

      // Check if user has ANY active plan for welcome bonus withdrawal
      const hasActivePlan = user.plans && Object.values(user.plans).some(plan => plan && plan.is_activated === true);
      console.log("Has active plan for welcome bonus:", hasActivePlan);

      if (!hasActivePlan) {
        console.log("❌ No active plan found for welcome bonus");
        return res.status(403).json({
          message: "⚠️ Please activate a plan first to withdraw your welcome bonus",
        });
      }

      if (withdrawAmount > (user.welcome_bonus || 0)) {
        console.log(`❌ Amount exceeds welcome bonus: ${withdrawAmount} > ${user.welcome_bonus}`);
        return res.status(400).json({
          message: "Withdrawal amount exceeds available welcome bonus",
        });
      }

      // Initialize arrays if they don't exist
      if (!user.withdrawal_requests) user.withdrawal_requests = [];
      if (!user.activation_requests) user.activation_requests = [];

      // ✅ Create withdrawal request
      const withdrawalRequest = {
        phone_number: phone_number,
        amount: withdrawAmount,
        fee: 0,
        net_amount: withdrawAmount,
        status: 'SUBMITTED',
        type: 'welcome_bonus',
        mpesa_code: mpesa_code,
        created_at: new Date()
      };

      // ✅ ALSO create activation request for admin dashboard
      const activationRequest = {
        plan: 'WELCOME_BONUS',
        amount: 1200,
        mpesa_code: mpesa_code,
        status: 'SUBMITTED',
        type: 'welcome_bonus_withdrawal',
        submitted_at: new Date(),
        created_at: new Date()
      };

      user.withdrawal_requests.push(withdrawalRequest);
      user.activation_requests.push(activationRequest);
      
      // Mark welcome bonus as withdrawn (pending admin approval)
      user.welcome_bonus_withdrawn = true;

      await user.save();
      console.log("✅ Welcome bonus withdrawal saved successfully");

      // Get the IDs of newly created requests
      const savedUser = await User.findById(userId);
      const latestWithdrawal = savedUser.withdrawal_requests[savedUser.withdrawal_requests.length - 1];
      const latestActivation = savedUser.activation_requests[savedUser.activation_requests.length - 1];

      return res.json({
        message: "🎉 Your welcome bonus withdrawal request has been submitted! It will appear in your activation payments for admin approval.",
        status: "SUBMITTED",
        gross_amount: withdrawAmount,
        fee: 0,
        net_amount: withdrawAmount,
        withdrawal_id: latestWithdrawal._id,
        activation_id: latestActivation._id,
        type: 'welcome_bonus'
      });
    }

    // -------------------------------
    // 🌟 NORMAL BALANCE WITHDRAWAL
    // -------------------------------
    
    // Check if the specific plan is activated
    if (!isPlanActivated) {
      console.log(`❌ ${type} plan is not activated. isPlanActivated = ${isPlanActivated}`);
      return res.status(403).json({ 
        message: `⚠️ Your ${type} plan is not activated yet. Please complete plan activation first.` 
      });
    }

    // Check if user has completed the required surveys for this specific plan
    if (planSurveysCompleted < TOTAL_SURVEYS) {
      console.log(`❌ Insufficient surveys: ${planSurveysCompleted}/${TOTAL_SURVEYS}`);
      return res.status(403).json({
        message: `Please complete all ${TOTAL_SURVEYS} surveys for your ${type} plan before withdrawal. You have completed ${planSurveysCompleted || 0} surveys.`,
      });
    }

    // ✅ ALLOW RESUBMISSION: Check only for active withdrawals, allow if previous was rejected
    if (user.withdrawal_requests) {
      const activeWithdrawal = user.withdrawal_requests.find(
        req => req.type === type && ['PROCESSING', 'PENDING', 'SUBMITTED'].includes(req.status)
      );
      
      if (activeWithdrawal) {
        console.log(`❌ Active withdrawal exists for ${type}`);
        return res.status(409).json({
          message: `You already have a ${type} withdrawal pending. Please share your referral link to speed up processing!`,
        });
      }
    }

    const fee = WITHDRAW_FEES[type] ?? WITHDRAW_FEES.REGULAR;

    if (withdrawAmount <= fee) {
      console.log(`❌ Amount too low after fees: ${withdrawAmount} <= ${fee}`);
      return res.status(400).json({ message: "Amount too low after fees" });
    }

    if ((user.total_earned || 0) < withdrawAmount) {
      console.log(`❌ Insufficient balance: ${user.total_earned} < ${withdrawAmount}`);
      return res.status(403).json({ message: "Insufficient balance" });
    }

    // Check daily withdrawal limit
    if (user.withdrawal_requests) {
      const today = new Date().toDateString();
      const dailyCount = user.withdrawal_requests.filter(req => {
        const reqDate = new Date(req.created_at).toDateString();
        return reqDate === today && ['PROCESSING', 'PENDING', 'SUBMITTED', 'APPROVED'].includes(req.status);
      }).length;
      
      if (dailyCount >= DAILY_WITHDRAW_LIMIT) {
        console.log(`❌ Daily limit reached: ${dailyCount}/${DAILY_WITHDRAW_LIMIT}`);
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
      status: 'SUBMITTED',
      type: type,
      created_at: new Date()
    };

    user.withdrawal_requests.push(withdrawalRequest);

    // Deduct from total_earned
    user.total_earned = (user.total_earned || 0) - withdrawAmount;

    await user.save();
    console.log(`✅ Withdrawal request saved successfully for ${type}`);

    // Get the ID of the newly created withdrawal request
    const savedUser = await User.findById(userId);
    const latestWithdrawal = savedUser.withdrawal_requests[savedUser.withdrawal_requests.length - 1];

    console.log("🔵🔵🔵 WITHDRAWAL REQUEST COMPLETED SUCCESSFULLY 🔵🔵🔵\n");
    
    res.json({
      message: `🎉 Your withdrawal request has been submitted! Share your referral link with 3+ people for faster approval.`,
      status: "SUBMITTED",
      gross_amount: withdrawAmount,
      fee,
      net_amount: netAmount,
      id: latestWithdrawal._id,
      type: type
    });
  } catch (error) {
    console.error("❌❌❌ Withdraw request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Rest of your file remains exactly the same from here...
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
      mpesa_code: withdrawal.mpesa_code,
      created_at: withdrawal.created_at,
      user_name: user.full_name || 'User',
      user_email: user.email,
      user_phone: user.phone,
      status_message: 
        withdrawal.status === 'SUBMITTED' ? 'Pending admin approval' :
        withdrawal.status === 'PROCESSING' ? 'Share referral link for faster approval' :
        withdrawal.status === 'PENDING' ? 'Awaiting admin approval' :
        withdrawal.status === 'APPROVED' ? 'Payment processed' :
        withdrawal.status === 'REJECTED' ? 'Request declined - You can resubmit' :
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
      'withdrawal_requests.status': { $in: ['SUBMITTED', 'PROCESSING', 'PENDING'] }
    }).select('full_name email phone withdrawal_requests');

    // Format the response
    const pendingWithdrawals = [];
    
    users.forEach(user => {
      user.withdrawal_requests.forEach(withdrawal => {
        if (['SUBMITTED', 'PROCESSING', 'PENDING'].includes(withdrawal.status)) {
          pendingWithdrawals.push({
            id: withdrawal._id,
            user_id: user._id,
            user_name: user.full_name || 'User',
            user_email: user.email || 'No email',
            user_phone: user.phone || 'No phone',
            phone_number: withdrawal.phone_number,
            amount: withdrawal.amount,
            fee: withdrawal.fee,
            net_amount: withdrawal.net_amount,
            status: withdrawal.status,
            type: withdrawal.type,
            mpesa_code: withdrawal.mpesa_code,
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
      'withdrawal_requests.0': { $exists: true }
    }).select('full_name email phone withdrawal_requests');

    // Format the response
    const allWithdrawals = [];
    
    users.forEach(user => {
      user.withdrawal_requests.forEach(withdrawal => {
        allWithdrawals.push({
          id: withdrawal._id,
          user_id: user._id,
          user_name: user.full_name || 'User',
          user_email: user.email || 'No email',
          user_phone: user.phone || 'No phone',
          phone_number: withdrawal.phone_number,
          amount: withdrawal.amount,
          fee: withdrawal.fee,
          net_amount: withdrawal.net_amount,
          status: withdrawal.status,
          type: withdrawal.type,
          mpesa_code: withdrawal.mpesa_code,
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
    }).select('full_name email withdrawal_requests activation_requests');

    if (!user) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    // Find the specific withdrawal request
    const withdrawal = user.withdrawal_requests.id(withdrawalId);
    
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (!['SUBMITTED', 'PROCESSING', 'PENDING'].includes(withdrawal.status)) {
      return res.status(400).json({ message: "Withdrawal already processed" });
    }

    // ✅ If it's a welcome bonus, also update the corresponding activation request
    if (withdrawal.type === 'welcome_bonus' && user.activation_requests) {
      const activationRequest = user.activation_requests.find(
        req => req.mpesa_code === withdrawal.mpesa_code && req.type === 'welcome_bonus_withdrawal'
      );
      
      if (activationRequest) {
        activationRequest.status = 'APPROVED';
        activationRequest.processed_at = new Date();
      }
    }

    // Update withdrawal status
    withdrawal.status = 'APPROVED';
    withdrawal.processed_at = new Date();
    
    await user.save();

    res.json({ 
      message: "Withdrawal approved",
      withdrawal_id: withdrawalId,
      user_id: user._id,
      user_name: user.full_name,
      user_email: user.email,
      amount: withdrawal.amount,
      type: withdrawal.type
    });
  } catch (error) {
    console.error("Approve withdrawal error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================
   ADMIN — REJECT WITHDRAWAL
   ✅ FIXED: Allows resubmission by not permanently blocking
===================================== */
exports.rejectWithdraw = async (req, res) => {
  try {
    const withdrawalId = req.params.id;

    // Find user with this withdrawal
    const user = await User.findOne({
      'withdrawal_requests._id': withdrawalId
    }).select('full_name email total_earned withdrawal_requests activation_requests');

    if (!user) {
      return res.status(404).json({ message: "Withdrawal request not found" });
    }

    // Find the specific withdrawal request
    const withdrawal = user.withdrawal_requests.id(withdrawalId);
    
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal request not found" });
    }

    if (!['SUBMITTED', 'PROCESSING', 'PENDING'].includes(withdrawal.status)) {
      return res.status(400).json({ message: "Withdrawal already processed" });
    }

    // ✅ If it's a welcome bonus, also update the corresponding activation request
    if (withdrawal.type === 'welcome_bonus' && user.activation_requests) {
      const activationRequest = user.activation_requests.find(
        req => req.mpesa_code === withdrawal.mpesa_code && req.type === 'welcome_bonus_withdrawal'
      );
      
      if (activationRequest) {
        activationRequest.status = 'REJECTED';
        activationRequest.processed_at = new Date();
      }
    }

    // Update withdrawal status
    withdrawal.status = 'REJECTED';
    withdrawal.processed_at = new Date();

    // ✅ Allow resubmission for welcome bonus by resetting the flag
    if (withdrawal.type === 'welcome_bonus') {
      user.welcome_bonus_withdrawn = false; // User can resubmit
    } else {
      // Refund amount to user's total_earned (if it was a balance withdrawal)
      user.total_earned = (user.total_earned || 0) + withdrawal.amount;
    }
    
    await user.save();

    res.json({ 
      message: "Withdrawal rejected. User can resubmit with correct information.",
      withdrawal_id: withdrawalId,
      user_id: user._id,
      user_name: user.full_name,
      user_email: user.email,
      amount: withdrawal.amount,
      refunded: withdrawal.type !== 'welcome_bonus',
      can_resubmit: true
    });
  } catch (error) {
    console.error("Reject withdrawal error:", error);
    res.status(500).json({ message: "Server error" });
  }
};