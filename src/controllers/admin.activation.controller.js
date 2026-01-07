const pool = require("../config/db");

/* =====================================================
   💳 ACTIVATION PAYMENTS — ADMIN CONTROLLER (FIXED)
===================================================== */

/**
 * GET ALL ACTIVATION PAYMENTS
 */
exports.getActivationPayments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ap.id,
        ap.user_id,
        ap.mpesa_code,
        ap.amount,
        ap.status,
        ap.created_at,
        u.full_name,
        u.username,
        u.email,
        u.status AS user_status
      FROM activation_payments ap
      JOIN users u ON u.id = ap.user_id
      ORDER BY ap.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Get activation payments error:", error);
    res.status(500).json({ message: "Failed to load activation payments" });
  }
};

/**
 * GET ONLY PENDING ACTIVATIONS
 */
exports.getPendingActivations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ap.id,
        ap.user_id,
        ap.mpesa_code,
        ap.amount,
        ap.status,
        ap.created_at,
        u.full_name,
        u.username,
        u.email
      FROM activation_payments ap
      JOIN users u ON u.id = ap.user_id
      WHERE ap.status = 'SUBMITTED'
      ORDER BY ap.created_at ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Get pending activations error:", error);
    res.status(500).json({ message: "Failed to load pending activations" });
  }
};

/**
 * ✅ APPROVE ACTIVATION (FINAL FIX)
 * - Approves payment
 * - Activates user
 * - Credits balance correctly
 */
exports.approveActivation = async (req, res) => {
  const client = await pool.connect();

  try {
    const paymentId = req.params.id;

    await client.query("BEGIN");

    // 1️⃣ Lock payment
    const paymentRes = await client.query(
      `SELECT * FROM activation_payments WHERE id = $1 FOR UPDATE`,
      [paymentId]
    );

    if (paymentRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Payment not found" });
    }

    const payment = paymentRes.rows[0];

    if (payment.status !== "SUBMITTED") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Payment already processed" });
    }

    // 2️⃣ Approve payment
    await client.query(
      `UPDATE activation_payments SET status = 'APPROVED' WHERE id = $1`,
      [paymentId]
    );

    // 3️⃣ CREDIT USER BALANCE (🔥 THIS WAS MISSING)
    await client.query(
      `
      UPDATE users
      SET
        status = 'ACTIVE',
        balance = COALESCE(balance, 0) + COALESCE(locked_balance, 0),
        locked_balance = 0,
        activation_required = false
      WHERE id = $1
      `,
      [payment.user_id]
    );

    await client.query("COMMIT");

    res.json({
      message: "✅ Activation approved. User can now withdraw.",
      user_id: payment.user_id,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Approve activation error:", error);
    res.status(500).json({ message: "Failed to approve activation" });
  } finally {
    client.release();
  }
};

/**
 * ❌ REJECT ACTIVATION
 */
exports.rejectActivation = async (req, res) => {
  try {
    const paymentId = req.params.id;

    const result = await pool.query(
      `
      UPDATE activation_payments
      SET status = 'REJECTED'
      WHERE id = $1 AND status = 'SUBMITTED'
      RETURNING id, user_id
      `,
      [paymentId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Payment not found or already processed",
      });
    }

    res.json({
      message: "❌ Activation payment rejected",
      user_id: result.rows[0].user_id,
    });
  } catch (error) {
    console.error("❌ Reject activation error:", error);
    res.status(500).json({ message: "Failed to reject activation" });
  }
};
