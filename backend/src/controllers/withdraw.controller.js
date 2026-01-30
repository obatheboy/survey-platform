/* eslint-disable no-undef */
const pool = require("../config/db");

/* ===============================
   CONFIG
================================ */
const MIN_WITHDRAW = 200;
const MAX_WITHDRAW = 500000;
const DAILY_WITHDRAW_LIMIT = 93; // INCREASED from 1 to 93
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
const requestWithdraw = async (req, res) => {
  const client = await pool.connect();

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

    await client.query("BEGIN");

    // Fetch user with all relevant fields
    const userRes = await client.query(
      `
      SELECT id, is_activated, total_earned, welcome_bonus, welcome_bonus_withdrawn, plan
      FROM users
      WHERE id = $1
      FOR UPDATE
      `,
      [userId]
    );

    if (!userRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    const user = userRes.rows[0];

    // Fetch surveys completed for this user (from user_surveys table)
    const surveysRes = await client.query(
      `
      SELECT COALESCE(SUM(surveys_completed), 0) as total_surveys
      FROM user_surveys
      WHERE user_id = $1
      `,
      [userId]
    );

    const totalSurveysCompleted = surveysRes.rows[0]?.total_surveys || 0;

    // Add surveys to user object
    user.surveys_completed = totalSurveysCompleted;

    // -------------------------------
    // 🌟 SPECIAL LOGIC FOR WELCOME BONUS
    // -------------------------------
    if (type === "welcome_bonus") {
      if (user.welcome_bonus_withdrawn) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Welcome bonus already withdrawn" });
      }

      if (!user.is_activated) {
        await client.query("ROLLBACK");
        return res.status(403).json({
          message:
            "⚠️ Account not activated. Activate your account with KSh 100 to withdraw your welcome bonus",
        });
      }

      if (withdrawAmount > Number(user.welcome_bonus)) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          message: "Withdrawal amount exceeds available welcome bonus",
        });
      }

      // Insert withdraw request
      await client.query(
        `
        INSERT INTO withdraw_requests
          (user_id, phone_number, amount, fee, net_amount, status, type)
        VALUES ($1, $2, $3, 0, $3, 'PROCESSING', 'welcome_bonus')
        `,
        [userId, phone_number, withdrawAmount]
      );

      // Mark welcome bonus as withdrawn
      await client.query(
        `
        UPDATE users
        SET welcome_bonus_withdrawn = true
        WHERE id = $1
        `,
        [userId]
      );

      await client.query("COMMIT");

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
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Account not activated" });
    }

    // Check if user has completed the required surveys
    if (user.surveys_completed < TOTAL_SURVEYS) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        message: `Please complete all ${TOTAL_SURVEYS} surveys before withdrawal. You have completed ${user.surveys_completed || 0} surveys.`,
      });
    }

    // ✅ FIX 1: Check for existing PENDING/PROCESSING withdrawal for THIS SPECIFIC PLAN
    const active = await client.query(
      `
      SELECT id, type, status
      FROM withdraw_requests
      WHERE user_id = $1 
        AND status IN ('PROCESSING', 'PENDING')
        AND type = $2
      `,
      [userId, type] // Check by plan type (REGULAR, VIP, VVIP)
    );

    if (active.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: `You already have a ${type} withdrawal pending. Please share your referral link to speed up processing!`,
      });
    }

    const fee = WITHDRAW_FEES[user.plan] ?? WITHDRAW_FEES.REGULAR;

    if (withdrawAmount <= fee) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Amount too low after fees" });
    }

    if (Number(user.total_earned) < withdrawAmount) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Insufficient balance" });
    }

    // ✅ FIX 2: Increased daily limit from 1 to 3
    const daily = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM withdraw_requests
      WHERE user_id = $1
        AND created_at::date = CURRENT_DATE
        AND status IN ('PROCESSING', 'PENDING', 'APPROVED')
      `,
      [userId]
    );

    if (daily.rows[0].count >= DAILY_WITHDRAW_LIMIT) {
      await client.query("ROLLBACK");
      return res.status(429).json({
        message: `Daily withdrawal limit of ${DAILY_WITHDRAW_LIMIT} reached. Try again tomorrow.`,
      });
    }

    const netAmount = withdrawAmount - fee;

    // ✅ FIX 3: Store the plan type (REGULAR, VIP, VVIP) in type column
    await client.query(
      `
      INSERT INTO withdraw_requests
        (user_id, phone_number, amount, fee, net_amount, status, type)
      VALUES ($1, $2, $3, $4, $5, 'PROCESSING', $6)
      `,
      [userId, phone_number, withdrawAmount, fee, netAmount, type]
    );

    // Deduct from total_earned
    await client.query(
      `
      UPDATE users
      SET total_earned = total_earned - $1
      WHERE id = $2
      `,
      [withdrawAmount, userId]
    );

    await client.query("COMMIT");

    // ✅ FIX 4: Return the withdrawal ID for frontend tracking
    const withdrawalRes = await client.query(
      `
      SELECT id FROM withdraw_requests 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
      `,
      [userId]
    );

    res.json({
      message: `🎉 Your withdrawal request is being processed! Share your referral link with 3+ people for faster approval.`,
      status: "PROCESSING",
      gross_amount: withdrawAmount,
      fee,
      net_amount: netAmount,
      id: withdrawalRes.rows[0]?.id,
      type: type
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Withdraw request error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/* =====================================
   USER — GET WITHDRAWAL HISTORY
===================================== */
const getUserWithdrawalHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { rows } = await pool.query(
      `
      SELECT 
        id, 
        phone_number, 
        amount, 
        fee, 
        net_amount, 
        status, 
        type, 
        created_at,
        CASE 
          WHEN status = 'PROCESSING' THEN 'Share referral link for faster approval'
          WHEN status = 'PENDING' THEN 'Awaiting admin approval'
          WHEN status = 'APPROVED' THEN 'Payment processed'
          WHEN status = 'REJECTED' THEN 'Request declined'
          ELSE 'Unknown status'
        END as status_message
      FROM withdraw_requests
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
      `,
      [userId]
    );
    
    res.json(rows);
  } catch (error) {
    console.error("❌ Get withdrawal history error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================
   ADMIN — GET PENDING WITHDRAWALS
===================================== */
const getPendingWithdrawals = async (req, res) => {
  const { rows } = await pool.query(
    `
    SELECT wr.*, u.email, u.full_name
    FROM withdraw_requests wr
    JOIN users u ON u.id = wr.user_id
    WHERE wr.status IN ('PROCESSING', 'PENDING')
    ORDER BY wr.created_at DESC
    `
  );
  res.json(rows);
};

/* =====================================
   ADMIN — GET ALL WITHDRAWALS
===================================== */
const getAllWithdrawals = async (req, res) => {
  const { rows } = await pool.query(
    `
    SELECT wr.*, u.email, u.full_name
    FROM withdraw_requests wr
    JOIN users u ON u.id = wr.user_id
    ORDER BY wr.created_at DESC
    `
  );
  res.json(rows);
};

/* =====================================
   ADMIN — APPROVE WITHDRAWAL
===================================== */
const approveWithdraw = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    const result = await client.query(
      `
      UPDATE withdraw_requests
      SET status = 'APPROVED'
      WHERE id = $1 AND status IN ('PROCESSING', 'PENDING')
      RETURNING id
      `,
      [req.params.id]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Withdrawal not found or already processed." });
    }

    await client.query("COMMIT");
    res.json({ message: "Withdrawal approved" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Approve withdrawal error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/* =====================================
   ADMIN — REJECT WITHDRAWAL
===================================== */
const rejectWithdraw = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    // Lock the row and get withdrawal details to prevent race conditions
    const withdrawalRes = await client.query(
      `
      SELECT user_id, amount, status
      FROM withdraw_requests 
      WHERE id = $1
      FOR UPDATE
      `,
      [req.params.id]
    );
    
    if (withdrawalRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Withdrawal request not found." });
    }

    const { user_id, amount, status } = withdrawalRes.rows[0];

    if (!["PROCESSING", "PENDING"].includes(status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Withdrawal already processed." });
    }

    await client.query(
      `
      UPDATE withdraw_requests
      SET status = 'REJECTED'
      WHERE id = $1
      `,
      [req.params.id]
    );

    // Refund amount to user's total_earned
    await client.query(
      `UPDATE users SET total_earned = total_earned + $1 WHERE id = $2`,
      [amount, user_id]
    );

    await client.query("COMMIT");
    res.json({ message: "Withdrawal rejected and amount refunded" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Reject withdrawal error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/* =====================================
   📤 EXPORT ALL FUNCTIONS
===================================== */
module.exports = {
  requestWithdraw,
  getUserWithdrawalHistory,
  getPendingWithdrawals,
  getAllWithdrawals,
  approveWithdraw,
  rejectWithdraw
};