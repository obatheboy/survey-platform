const pool = require("../config/db");

/* ===============================
   PLAN ACTIVATION FEES (SOURCE OF TRUTH)
================================ */
const PLAN_FEES = {
  REGULAR: 100,
  VIP: 150,
  VVIP: 200,
};

const TOTAL_SURVEYS = 10;

/* =====================================
   USER — SUBMIT ACTIVATION PAYMENT
   (STRICT LAW ENFORCED)
===================================== */
exports.submitActivationPayment = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const { mpesa_code } = req.body;
    const paymentReference = String(mpesa_code || "").trim();

    if (!paymentReference) {
      return res.status(400).json({
        message: "Please enter the M-Pesa payment reference",
      });
    }

    await client.query("BEGIN");

    /* 🔒 LOCK USER */
    const { rows } = await client.query(
      `
      SELECT
        id,
        plan,
        surveys_completed,
        is_activated
      FROM users
      WHERE id = $1
      FOR UPDATE
      `,
      [userId]
    );

    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    const user = rows[0];

    /* 🚫 MUST HAVE COMPLETED SURVEYS */
    if (user.surveys_completed !== TOTAL_SURVEYS) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Complete all surveys before activation",
      });
    }

    /* 🚫 NO PLAN */
    if (!user.plan || !PLAN_FEES[user.plan]) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "No active plan found for activation",
      });
    }

    /* 🚫 ALREADY ACTIVATED */
    if (user.is_activated) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Account already activated",
      });
    }

    /* 🚫 DUPLICATE SUBMISSION */
    const existing = await client.query(
      `
      SELECT id
      FROM activation_payments
      WHERE user_id = $1
        AND status = 'SUBMITTED'
      `,
      [userId]
    );

    if (existing.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Activation already submitted and pending approval",
      });
    }

    const activationFee = PLAN_FEES[user.plan];

    /* ✅ SAVE PAYMENT */
    await client.query(
      `
      INSERT INTO activation_payments
        (user_id, plan, mpesa_code, amount, status)
      VALUES ($1, $2, $3, $4, 'SUBMITTED')
      `,
      [userId, user.plan, paymentReference, activationFee]
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

    const activation = await client.query(
      `
      SELECT
        id,
        user_id,
        status
      FROM activation_payments
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (!activation.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Activation request not found" });
    }

    if (activation.rows[0].status !== "SUBMITTED") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Activation already processed" });
    }

    /* 🔒 ENSURE USER REALLY COMPLETED SURVEYS */
    const userCheck = await client.query(
      `
      SELECT surveys_completed
      FROM users
      WHERE id = $1
      FOR UPDATE
      `,
      [activation.rows[0].user_id]
    );

    if (
      !userCheck.rows.length ||
      userCheck.rows[0].surveys_completed !== TOTAL_SURVEYS
    ) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "User has not completed required surveys",
      });
    }

    /* ✅ APPROVE PAYMENT */
    await client.query(
      `
      UPDATE activation_payments
      SET status = 'APPROVED'
      WHERE id = $1
      `,
      [id]
    );

    /* 🔓 UNLOCK WITHDRAWALS */
    await client.query(
      `
      UPDATE users
      SET is_activated = true
      WHERE id = $1
      `,
      [activation.rows[0].user_id]
    );

    await client.query("COMMIT");

    return res.json({
      message: "Activation approved",
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
