const pool = require("../config/db");

const PLAN_ORDER = ["REGULAR", "VIP", "VVIP"];

const PLAN_CONFIG = {
  REGULAR: { activationFee: 100 },
  VIP: { activationFee: 150 },
  VVIP: { activationFee: 200 },
};

const getNextPlan = (plan) => {
  const index = PLAN_ORDER.indexOf(plan);
  return PLAN_ORDER[index + 1] || null;
};

/* =====================================
   USER — SUBMIT ACTIVATION PAYMENT
===================================== */
exports.submitActivationPayment = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const paymentReference = String(req.body.mpesa_code || "").trim();

    if (!paymentReference) {
      return res.status(400).json({ message: "Enter M-Pesa reference" });
    }

    await client.query("BEGIN");

    const userRes = await client.query(
      `
      SELECT plan, surveys_completed, is_activated
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
    const currentPlan = user.plan || "REGULAR";

    /* 🚫 Must finish surveys first */
    if (user.surveys_completed < 10) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        message: "Complete all surveys before activation",
      });
    }

    /* 🚫 Block duplicate */
    const dup = await client.query(
      `
      SELECT id
      FROM activation_payments
      WHERE user_id = $1 AND plan = $2 AND status = 'SUBMITTED'
      `,
      [userId, currentPlan]
    );

    if (dup.rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Activation already submitted",
      });
    }

    const fee =
      PLAN_CONFIG[currentPlan]?.activationFee ||
      PLAN_CONFIG.REGULAR.activationFee;

    await client.query(
      `
      INSERT INTO activation_payments
        (user_id, plan, mpesa_code, amount, status)
      VALUES ($1, $2, $3, $4, 'SUBMITTED')
      `,
      [userId, currentPlan, paymentReference, fee]
    );

    await client.query("COMMIT");

    res.json({
      message: "Activation submitted successfully",
      plan: currentPlan,
      status: "SUBMITTED",
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Activation submit error:", err);
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
      return res.status(403).json({ message: "Admin only" });
    }

    const { id } = req.params;

    await client.query("BEGIN");

    const act = await client.query(
      `
      SELECT id, user_id, plan, status
      FROM activation_payments
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (!act.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Not found" });
    }

    if (act.rows[0].status !== "SUBMITTED") {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Already processed" });
    }

    const nextPlan = getNextPlan(act.rows[0].plan);

    await client.query(
      `
      UPDATE activation_payments
      SET status = 'APPROVED'
      WHERE id = $1
      `,
      [id]
    );

    await client.query(
      `
      UPDATE users
      SET
        plan = $1,
        surveys_completed = 0,
        is_activated = true
      WHERE id = $2
      `,
      [nextPlan, act.rows[0].user_id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Activation approved",
      next_plan: nextPlan,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Approve error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
