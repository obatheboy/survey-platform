const pool = require("../config/db");

const TOTAL_SURVEYS = 10;

/* ===============================
   PLAN TOTAL EARNINGS (SOURCE OF TRUTH)
================================ */
const PLAN_TOTAL_EARNINGS = {
  REGULAR: 1500,
  VIP: 2000,
  VVIP: 3000,
};

/* ===============================
   SELECT PLAN (PER-PLAN ISOLATION)
================================ */
exports.selectPlan = async (req, res) => {
  const userId = req.user.id;
  const { plan } = req.body;

  if (!PLAN_TOTAL_EARNINGS[plan]) {
    return res.status(400).json({ message: "Invalid plan" });
  }

  try {
    /**
     * Create plan row if it doesn't exist
     * DO NOT touch other plans
     */
    await pool.query(
      `
      INSERT INTO user_surveys (user_id, plan)
      VALUES ($1, $2)
      ON CONFLICT (user_id, plan) DO NOTHING
      `,
      [userId, plan]
    );

    return res.json({
      success: true,
      plan,
    });
  } catch (err) {
    console.error("❌ Select plan error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   SUBMIT SURVEY (LAW ENFORCED)
================================ */
exports.submitSurvey = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;
    const { plan } = req.body;

    if (!PLAN_TOTAL_EARNINGS[plan]) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    await client.query("BEGIN");

    /* 🔒 LOCK PLAN ROW */
    const { rows } = await client.query(
      `
      SELECT
        surveys_completed,
        completed,
        is_activated
      FROM user_surveys
      WHERE user_id = $1 AND plan = $2
      FOR UPDATE
      `,
      [userId, plan]
    );

    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Plan not selected",
      });
    }

    const survey = rows[0];

    /* 🔒 PLAN ALREADY COMPLETED */
    if (survey.completed) {
      await client.query("ROLLBACK");
      return res.json({
        completed: true,
        surveys_completed: TOTAL_SURVEYS,
        surveys_locked: true,
        activation_required: !survey.is_activated,
      });
    }

    const newCompleted = survey.surveys_completed + 1;

    /* 🎉 COMPLETE PLAN */
    if (newCompleted === TOTAL_SURVEYS) {
      await client.query(
        `
        UPDATE user_surveys
        SET
          surveys_completed = $1,
          completed = true
        WHERE user_id = $2 AND plan = $3
        `,
        [TOTAL_SURVEYS, userId, plan]
      );

      /* 💰 CREDIT WALLET ONCE */
      await client.query(
        `
        UPDATE users
        SET total_earned = COALESCE(total_earned, 0) + $1
        WHERE id = $2
        `,
        [PLAN_TOTAL_EARNINGS[plan], userId]
      );

      await client.query("COMMIT");

      return res.json({
        completed: true,
        surveys_completed: TOTAL_SURVEYS,
        surveys_locked: true,
        activation_required: true,
        total_earned_added: PLAN_TOTAL_EARNINGS[plan],
      });
    }

    /* ➕ NORMAL STEP */
    await client.query(
      `
      UPDATE user_surveys
      SET surveys_completed = $1
      WHERE user_id = $2 AND plan = $3
      `,
      [newCompleted, userId, plan]
    );

    await client.query("COMMIT");

    return res.json({
      completed: false,
      surveys_completed: newCompleted,
      surveys_locked: false,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Survey submit error:", error);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
