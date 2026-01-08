const pool = require("../config/db");

const TOTAL_SURVEYS = 10;

/* ===============================
   PLAN ACTIVATION FEES (SOURCE OF TRUTH)
================================ */
const PLAN_FEES = {
  REGULAR: 100,
  VIP: 150,
  VVIP: 200,
};

/* =====================================
   USER — SUBMIT ACTIVATION PAYMENT
===================================== */
exports.submitActivationPayment = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const { mpesa_code, plan } = req.body;
    const paymentReference = String(mpesa_code || "").trim();

    if (!paymentReference) {
      return res.status(400).json({
        message: "Please enter the M-Pesa payment reference",
      });
    }

    if (!PLAN_FEES[plan]) {
      return res.status(400).json({
        message: "Invalid plan",
      });
    }

    await client.query("BEGIN");

    const { rows } = await client.query(
      `
      SELECT surveys_completed, completed, is_activated
      FROM user_surveys
      WHERE user_id = $1 AND plan = $2
      FOR UPDATE
      `,
      [userId, plan]
    );

    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Survey plan not found" });
    }

    const planRow = rows[0];

    if (!planRow.completed || planRow.surveys_completed !== TOTAL_SURVEYS) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Complete all surveys before activation",
      });
    }

    if (planRow.is_activated) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Plan already activated",
      });
    }

    const existing = await client.query(
      `
      SELECT id
      FROM activation_payments
      WHERE user_id = $1
        AND plan = $2
        AND status = 'SUBMITTED'
      `,
      [userId, plan]
    );

    if (existing.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Activation already submitted and pending approval",
      });
    }

    await client.query(
      `
      INSERT INTO activation_payments
        (user_id, plan, mpesa_code, amount, status)
      VALUES ($1, $2, $3, $4, 'SUBMITTED')
      `,
      [userId, plan, paymentReference, PLAN_FEES[plan]]
    );

    await client.query("COMMIT");

    return res.json({
      activation_status: "SUBMITTED",
      activation_required: true,
      withdraw_unlocked: false,
      message: "Payment submitted successfully. Awaiting admin approval.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Activation submit error:", error);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/* =====================================
   ADMIN — APPROVE ACTIVATION
===================================== */
exports.approveActivation = async (req, res) => {
  const client = await pool.connect();

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const { id } = req.params;

    await client.query("BEGIN");

    const activationRes = await client.query(
      `
      SELECT id, user_id, plan, status
      FROM activation_payments
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (!activationRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Activation request not found" });
    }

    const activation = activationRes.rows[0];

    if (activation.status !== "SUBMITTED") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Activation already processed",
      });
    }

    const planCheck = await client.query(
      `
      SELECT surveys_completed, completed, is_activated
      FROM user_surveys
      WHERE user_id = $1 AND plan = $2
      FOR UPDATE
      `,
      [activation.user_id, activation.plan]
    );

    if (
      !planCheck.rows.length ||
      !planCheck.rows[0].completed ||
      planCheck.rows[0].surveys_completed !== TOTAL_SURVEYS
    ) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "User has not completed required surveys",
      });
    }

    if (planCheck.rows[0].is_activated) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Plan already activated",
      });
    }

    await client.query(
      `UPDATE activation_payments SET status = 'APPROVED' WHERE id = $1`,
      [id]
    );

    await client.query(
      `
      UPDATE user_surveys
      SET is_activated = true
      WHERE user_id = $1 AND plan = $2
      `,
      [activation.user_id, activation.plan]
    );

    /* 🔑 CRITICAL FIX — GLOBAL UNLOCK */
    await client.query(
      `
      UPDATE users
      SET is_activated = true
      WHERE id = $1
      `,
      [activation.user_id]
    );

    await client.query("COMMIT");

    return res.json({
      message: "Activation approved",
      plan: activation.plan,
      withdraw_unlocked: true,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Approve activation error:", error);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/* =====================================
   ADMIN — REJECT ACTIVATION
===================================== */
exports.rejectActivation = async (req, res) => {
  const client = await pool.connect();

  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const { id } = req.params;

    await client.query("BEGIN");

    const result = await client.query(
      `
      UPDATE activation_payments
      SET status = 'REJECTED'
      WHERE id = $1
        AND status = 'SUBMITTED'
      RETURNING id
      `,
      [id]
    );

    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        message: "Activation request not found or already processed",
      });
    }

    await client.query("COMMIT");

    return res.json({ message: "Activation rejected" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Reject activation error:", error);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
