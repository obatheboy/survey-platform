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
   SELECT PLAN (FIXED)
================================ */
exports.selectPlan = async (req, res) => {
  const userId = req.user.id;
  const { plan } = req.body;

  if (!PLAN_TOTAL_EARNINGS[plan]) {
    return res.status(400).json({ message: "Invalid plan" });
  }

  try {
    await pool.query(
      `
      INSERT INTO user_surveys (
        user_id,
        plan,
        surveys_completed,
        completed,
        is_activated
      )
      VALUES ($1, $2, 0, false, false)
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
   SUBMIT SURVEY (NO CHANGE)
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

    const { rows } = await client.query(
      `
      SELECT surveys_completed, completed
      FROM user_surveys
      WHERE user_id = $1 AND plan = $2
      FOR UPDATE
      `,
      [userId, plan]
    );

    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Plan not selected" });
    }

    const survey = rows[0];

    if (survey.completed) {
      await client.query("ROLLBACK");
      return res.json({
        plan,
        completed: true,
        surveys_completed: TOTAL_SURVEYS,
        activation_required: true,
      });
    }

    const newCompleted = survey.surveys_completed + 1;

    // 🎯 COMPLETION POINT
    if (newCompleted === TOTAL_SURVEYS) {
      await client.query(
        `
        UPDATE user_surveys
        SET surveys_completed = $1, completed = true
        WHERE user_id = $2 AND plan = $3
        `,
        [TOTAL_SURVEYS, userId, plan]
      );

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
        plan,
        completed: true,
        surveys_completed: TOTAL_SURVEYS,
        activation_required: true,
      });
    }

    // ➕ NORMAL PROGRESS
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
      plan,
      completed: false,
      surveys_completed: newCompleted,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Survey submit error:", error);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
