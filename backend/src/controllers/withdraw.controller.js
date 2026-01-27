const pool = require("../config/db");

/* ===============================
   CONFIG
================================ */
const MIN_WITHDRAW = 200;
const MAX_WITHDRAW = 500000;
const DAILY_WITHDRAW_LIMIT = 1;
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
      SELECT is_activated, surveys_completed, plan, total_earned, welcome_bonus, welcome_bonus_withdrawn
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
    // Either in the specific plan OR across all plans combined
    if (user.surveys_completed < TOTAL_SURVEYS) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        message: `Please complete all ${TOTAL_SURVEYS} surveys before withdrawal. You have completed ${user.surveys_completed || 0} surveys.`,
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

    const active = await client.query(
      `
      SELECT id
      FROM withdraw_requests
      WHERE user_id = $1 AND status = 'PROCESSING'
      `,
      [userId]
    );

    if (active.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Withdrawal already in progress",
      });
    }

    const daily = await client.query(
      `
      SELECT COUNT(*)::int AS count
      FROM withdraw_requests
      WHERE user_id = $1
        AND created_at::date = CURRENT_DATE
      `,
      [userId]
    );

    if (daily.rows[0].count >= DAILY_WITHDRAW_LIMIT) {
      await client.query("ROLLBACK");
      return res.status(429).json({
        message: "Daily withdrawal limit reached",
      });
    }

    const netAmount = withdrawAmount - fee;

    await client.query(
      `
      INSERT INTO withdraw_requests
        (user_id, phone_number, amount, fee, net_amount, status, type)
      VALUES ($1, $2, $3, $4, $5, 'PROCESSING', 'normal')
      `,
      [userId, phone_number, withdrawAmount, fee, netAmount]
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

    res.json({
      message: `🎉 Congratulations! Your withdrawal request is being processed. 
For faster approval, complete your surveys and share your referral link with at least 3 people.`,
      status: "PROCESSING",
      gross_amount: withdrawAmount,
      fee,
      net_amount: netAmount,
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
   ADMIN — GET PENDING WITHDRAWALS
===================================== */
exports.getPendingWithdrawals = async (req, res) => {
  const { rows } = await pool.query(
    `
    SELECT wr.*, u.email
    FROM withdraw_requests wr
    JOIN users u ON u.id = wr.user_id
    ORDER BY wr.created_at DESC
    `
  );
  res.json(rows);
};

/* =====================================
   ADMIN — GET ALL WITHDRAWALS
===================================== */
exports.getAllWithdrawals = async (req, res) => {
  const { rows } = await pool.query(
    `
    SELECT wr.*, u.email
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
exports.approveWithdraw = async (req, res) => {
  await pool.query(
    `
    UPDATE withdraw_requests
    SET status = 'APPROVED'
    WHERE id = $1 AND status = 'PROCESSING'
    `,
    [req.params.id]
  );

  res.json({ message: "Withdrawal approved" });
};

/* =====================================
   ADMIN — REJECT WITHDRAWAL
===================================== */
exports.rejectWithdraw = async (req, res) => {
  await pool.query(
    `
    UPDATE withdraw_requests
    SET status = 'REJECTED'
    WHERE id = $1 AND status = 'PROCESSING'
    `,
    [req.params.id]
  );

  res.json({ message: "Withdrawal rejected" });
};
