const pool = require("../config/db");

const TOTAL_SURVEYS = 10;

/* =====================================================
   💳 ACTIVATION PAYMENTS — ADMIN CONTROLLER (PLAN SAFE)
===================================================== */

/**
 * 🔍 GET ALL ACTIVATION PAYMENTS
 */
exports.getActivationPayments = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ap.id,
        ap.user_id,
        ap.plan,
        ap.mpesa_code,
        ap.amount,
        ap.status,
        ap.created_at,
        u.full_name,
        u.phone,
        u.email
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
 * ⏳ GET ONLY PENDING ACTIVATIONS
 */
exports.getPendingActivations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ap.id,
        ap.user_id,
        ap.plan,
        ap.mpesa_code,
        ap.amount,
        ap.created_at,
        u.full_name,
        u.phone,
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
 * ✅ APPROVE ACTIVATION (PLAN-BASED — FINAL)
 */
exports.approveActivation = async (req, res) => {
  const client = await pool.connect();

  try {
    const paymentId = req.params.id;

    await client.query("BEGIN");

    /* 🔒 LOCK PAYMENT */
    const paymentRes = await client.query(
      `
      SELECT id, user_id, plan, status
      FROM activation_payments
      WHERE id = $1
      FOR UPDATE
      `,
      [paymentId]
    );

    if (!paymentRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Payment not found" });
    }

    const payment = paymentRes.rows[0];

    if (payment.status !== "SUBMITTED") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Payment already processed" });
    }

    /* 🔒 LOCK PLAN ROW */
    const planRes = await client.query(
      `
      SELECT surveys_completed, completed, is_activated
      FROM user_surveys
      WHERE user_id = $1 AND plan = $2
      FOR UPDATE
      `,
      [payment.user_id, payment.plan]
    );

    if (
      !planRes.rows.length ||
      !planRes.rows[0].completed ||
      planRes.rows[0].surveys_completed !== TOTAL_SURVEYS
    ) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "User has not completed required surveys",
      });
    }

    if (planRes.rows[0].is_activated) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Plan already activated",
      });
    }

    /* ✅ APPROVE PAYMENT */
    await client.query(
      `
      UPDATE activation_payments
      SET status = 'APPROVED'
      WHERE id = $1
      `,
      [paymentId]
    );

    /* 🔓 ACTIVATE PLAN */
    await client.query(
      `
      UPDATE user_surveys
      SET is_activated = true
      WHERE user_id = $1 AND plan = $2
      `,
      [payment.user_id, payment.plan]
    );

    /* 🔑 CRITICAL — GLOBAL USER ACTIVATION */
    await client.query(
      `
      UPDATE users
      SET is_activated = true
      WHERE id = $1
      `,
      [payment.user_id]
    );

    await client.query("COMMIT");

    res.json({
      message: "✅ Activation approved",
      user_id: payment.user_id,
      plan: payment.plan,
      withdraw_unlocked: true,
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
      RETURNING id, user_id, plan
      `,
      [paymentId]
    );

    if (!result.rows.length) {
      return res.status(400).json({
        message: "Payment not found or already processed",
      });
    }

    res.json({
      message: "❌ Activation rejected",
      user_id: result.rows[0].user_id,
      plan: result.rows[0].plan,
    });
  } catch (error) {
    console.error("❌ Reject activation error:", error);
    res.status(500).json({ message: "Failed to reject activation" });
  }
};
