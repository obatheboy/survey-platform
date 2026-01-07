const pool = require("../config/db");

/* ===============================
   PLAN FEES (DISPLAY ONLY)
================================ */
const PLAN_CONFIG = {
  REGULAR: 100,
  VIP: 150,
  VVIP: 200,
};

/* =====================================
   USER — SUBMIT ACTIVATION PAYMENT
   (WITHDRAWAL UNLOCK ONLY)
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
      SELECT id, plan, is_activated
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
        message: "Activation already submitted and pending review",
      });
    }

    const activationFee =
      PLAN_CONFIG[user.plan] || PLAN_CONFIG.REGULAR;

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
      message: "Payment submitted successfully. Awaiting approval.",
      activation_status: "SUBMITTED",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Activation submit error:", error);
    res.status(500).json({ message: "Server error" });
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
      SELECT id, user_id, status
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
      return res.status(400).json({ message: "Already processed" });
    }

    /* ✅ APPROVE */
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

    res.json({ message: "Activation approved" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Approve activation error:", error);
    res.status(500).json({ message: "Server error" });
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

    await client.query(
      `
      UPDATE activation_payments
      SET status = 'REJECTED'
      WHERE id = $1 AND status = 'SUBMITTED'
      `,
      [id]
    );

    await client.query("COMMIT");

    res.json({ message: "Activation rejected" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Reject activation error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
