const pool = require("../config/db");

const TOTAL_SURVEYS = 10;

/* ===============================
   PLAN REWARDS (SOURCE OF TRUTH)
================================ */
const PLAN_REWARDS = {
  REGULAR: 150,
  VIP: 200,
  VVIP: 300,
};

/* ===============================
   SUBMIT SURVEY
   - Single source of truth
   - Safe across devices
================================ */
exports.submitSurvey = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;

    await client.query("BEGIN");

    /* 🔒 LOCK USER ROW */
    const { rows } = await client.query(
      `
      SELECT
        plan,
        surveys_completed,
        total_earned,
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
    const activePlan = user.plan || "REGULAR";

    /* ⛔ BLOCK IF PLAN SURVEYS COMPLETED */
    if (user.surveys_completed >= TOTAL_SURVEYS) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        message: "Survey limit reached for this plan",
        activation_required: !user.is_activated,
        surveys_completed: user.surveys_completed,
        plan: activePlan,
      });
    }

    /* 💰 CALCULATE REWARD */
    const reward = PLAN_REWARDS[activePlan];
    if (!reward) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Invalid plan configuration",
      });
    }

    const newCompleted = user.surveys_completed + 1;
    const newTotalEarned = Number(user.total_earned || 0) + reward;

    /* ✅ UPDATE USER */
    await client.query(
      `
      UPDATE users
      SET
        surveys_completed = $1,
        total_earned = $2
      WHERE id = $3
      `,
      [newCompleted, newTotalEarned, userId]
    );

    await client.query("COMMIT");

    /* ✅ SUCCESS RESPONSE */
    return res.json({
      message: "Survey completed successfully",
      plan: activePlan,
      surveys_completed: newCompleted,
      earned_this_survey: reward,
      total_earned: newTotalEarned,
      activation_required: newCompleted >= TOTAL_SURVEYS,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Survey submit error:", error);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
