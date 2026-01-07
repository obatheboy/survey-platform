const pool = require("../config/db");

/* ===============================
   CONFIG (EASY TO TUNE)
================================ */
const MIN_WITHDRAW = 200;
const MAX_WITHDRAW = 500000;
const DAILY_WITHDRAW_LIMIT = 1;

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
   POST /api/withdraw/request
===================================== */
exports.requestWithdraw = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    let { phone_number, amount } = req.body;

    if (!phone_number || !amount) {
      return res
        .status(400)
        .json({ message: "Phone number and amount are required" });
    }

    phone_number = String(phone_number).trim();
    const withdrawAmount = Number(amount);

    if (!Number.isFinite(withdrawAmount)) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (withdrawAmount < MIN_WITHDRAW || withdrawAmount > MAX_WITHDRAW) {
      return res.status(400).json({
        message: `Withdrawal must be between KES ${MIN_WITHDRAW} and ${MAX_WITHDRAW}`,
      });
    }

    await client.query("BEGIN");

    /* 🔒 LOCK USER */
    const userRes = await client.query(
      `
      SELECT 
        status,
        available_balance,
        plan,
        regular_completed,
        vip_completed,
        vvip_completed
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

    /* 🚫 MUST BE ACTIVE */
    if (user.status !== "ACTIVE") {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Account not activated" });
    }
/* 🚫 MUST COMPLETE ALL PLANS */
if (
  !user.regular_completed ||
  !user.vip_completed ||
  !user.vvip_completed
) {
  await client.query("ROLLBACK");

  const remaining = [
    !user.regular_completed && "Regular",
    !user.vip_completed && "VIP",
    !user.vvip_completed && "VVIP",
  ].filter(Boolean);

  return res.status(403).json({
    message: "Withdrawals locked. Complete all survey plans.",
    remaining_plans: remaining,
  });
}

    /* 💸 PLAN FEE */
    const fee =
      WITHDRAW_FEES[user.plan] ?? WITHDRAW_FEES.REGULAR;

    if (withdrawAmount <= fee) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Amount too low after fees" });
    }

    const netAmount = withdrawAmount - fee;

    if (Number(user.available_balance) < withdrawAmount) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Insufficient balance" });
    }

    /* 🚫 ONE ACTIVE WITHDRAWAL */
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
      return res
        .status(409)
        .json({ message: "Withdrawal already in progress" });
    }

    /* 🚫 DAILY LIMIT */
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
      return res
        .status(429)
        .json({ message: "Daily withdrawal limit reached" });
    }

    /* ✅ CREATE REQUEST */
    await client.query(
      `
      INSERT INTO withdraw_requests
      (user_id, phone_number, amount, fee, net_amount, status)
      VALUES ($1, $2, $3, $4, $5, 'PROCESSING')
      `,
      [userId, phone_number, withdrawAmount, fee, netAmount]
    );

    /* 🔒 DEDUCT GROSS */
    await client.query(
      `
      UPDATE users
      SET available_balance = available_balance - $1
      WHERE id = $2
      `,
      [withdrawAmount, userId]
    );

    await client.query("COMMIT");

    res.json({
      message: "Withdrawal request submitted",
      status: "PROCESSING",
      gross_amount: withdrawAmount,
      fee,
      net_amount: netAmount,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Withdraw request error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/* =====================================
   ADMIN — GET PENDING WITHDRAWALS
===================================== */
exports.getPendingWithdrawals = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        w.id,
        w.amount,
        w.fee,
        w.net_amount,
        w.status,
        w.phone_number,
        w.created_at,
        u.username,
        u.full_name,
        u.email,
        u.plan
      FROM withdraw_requests w
      JOIN users u ON u.id = w.user_id
      WHERE w.status = 'PROCESSING'
      ORDER BY w.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch pending withdrawals error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================
   ADMIN — GET ALL WITHDRAWALS
===================================== */
exports.getAllWithdrawals = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        w.id,
        w.amount,
        w.fee,
        w.net_amount,
        w.status,
        w.phone_number,
        w.created_at,
        u.username,
        u.full_name,
        u.email,
        u.plan
      FROM withdraw_requests w
      JOIN users u ON u.id = w.user_id
      ORDER BY w.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Fetch withdrawals error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================
   ADMIN — APPROVE WITHDRAWAL
===================================== */
exports.approveWithdraw = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const wr = await client.query(
      `
      SELECT status
      FROM withdraw_requests
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (!wr.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (wr.rows[0].status !== "PROCESSING") {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Already processed" });
    }

    await client.query(
      `
      UPDATE withdraw_requests
      SET status = 'APPROVED'
      WHERE id = $1
      `,
      [id]
    );

    await client.query("COMMIT");

    res.json({ message: "Withdrawal approved", status: "APPROVED" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Approve withdraw error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/* =====================================
   ADMIN — REJECT WITHDRAWAL (REFUND)
===================================== */
exports.rejectWithdraw = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const wr = await client.query(
      `
      SELECT user_id, amount, status
      FROM withdraw_requests
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (!wr.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (wr.rows[0].status !== "PROCESSING") {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ message: "Already processed" });
    }

    /* 💸 REFUND */
    await client.query(
      `
      UPDATE users
      SET available_balance = available_balance + $1
      WHERE id = $2
      `,
      [wr.rows[0].amount, wr.rows[0].user_id]
    );

    await client.query(
      `
      UPDATE withdraw_requests
      SET status = 'REJECTED'
      WHERE id = $1
      `,
      [id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Withdrawal rejected and refunded",
      status: "REJECTED",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Reject withdraw error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
