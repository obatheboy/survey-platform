const pool = require("../config/db");

const TOTAL_SURVEYS = 10;

/* ===============================
   PLAN ORDER & FEES
================================ */
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
    const { mpesa_code } = req.body;
    const paymentReference = String(mpesa_code || "").trim();

    if (!paymentReference) {
      return res.status(400).json({
        message: "Please enter the payment reference or message",
      });
    }

    await client.query("BEGIN");

    /* 🔒 LOCK USER */
    const userResult = await client.query(
      `
      SELECT id,
             plan,
             completed_surveys,
             locked_balance,
             status
      FROM users
      WHERE id = $1
      FOR UPDATE
      `,
      [userId]
    );

    if (!userResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

   
    /* 🚫 DUPLICATE PER PLAN */
    const existing = await client.query(
      `
      SELECT id
      FROM activation_payments
      WHERE user_id = $1
        AND plan = $2
        AND status = 'SUBMITTED'
      `,
      [userId, user.plan]
    );


    /* 💰 ACTIVATION FEE */
    const activationFee = PLAN_CONFIG[user.plan].activationFee;

    /* ✅ SAVE PAYMENT */
    await client.query(
      `
      INSERT INTO activation_payments
      (user_id, plan, mpesa_code, amount, status)
      VALUES ($1, $2, $3, $4, 'SUBMITTED')
      `,
      [userId, user.plan, paymentReference, activationFee]
    );

    const nextPlan = getNextPlan(user.plan);

    /* ===============================
       PLAN TRANSITION LOGIC
    ================================ */

    // 🔁 REGULAR / VIP → move immediately
    if (nextPlan) {
      await client.query(
        `
        UPDATE users
        SET plan = $1,
            completed_surveys = 0
        WHERE id = $2
        `,
        [nextPlan, userId]
      );
    }

    // 🎯 FINAL PLAN (VVIP)
    if (!nextPlan) {
      await client.query(
        `
        UPDATE users
        SET status = 'PENDING'
        WHERE id = $1
        `,
        [userId]
      );
    }

    await client.query("COMMIT");

    return res.json({
      message: nextPlan
        ? "Payment submitted. Next plan unlocked."
        : "Payment submitted. Awaiting account activation.",
      activation_status: "SUBMITTED",
      completed_plan: user.plan,
      next_plan: nextPlan,
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
      SELECT id, user_id, plan, status
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
      return res.status(400).json({
        message: "Activation request already processed",
      });
    }

    await client.query(
      `
      UPDATE activation_payments
      SET status = 'APPROVED'
      WHERE id = $1
      `,
      [id]
    );

    /* 🎯 FINAL APPROVAL UNLOCKS WITHDRAW */
    if (activation.rows[0].plan === "VVIP") {
  await client.query(
    `
    UPDATE users
    SET status = 'ACTIVE',
        plan_completed = true,
        available_balance = locked_balance,
        locked_balance = 0
    WHERE id = $1
    `,
    [activation.rows[0].user_id]
  );
}


    await client.query("COMMIT");

    res.json({
      message: "Activation approved",
      status: "APPROVED",
    });
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

    const activation = await client.query(
      `
      SELECT id, status
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
      return res.status(400).json({
        message: "Activation request already processed",
      });
    }

    await client.query(
      `
      UPDATE activation_payments
      SET status = 'REJECTED'
      WHERE id = $1
      `,
      [id]
    );

    await client.query("COMMIT");

    res.json({ message: "Activation rejected successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Reject activation error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
