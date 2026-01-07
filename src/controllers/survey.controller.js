const pool = require("../config/db");

const TOTAL_SURVEYS = 10;

/* ===============================
   PLAN ORDER & REWARDS
================================ */
const PLAN_ORDER = ["REGULAR", "VIP", "VVIP"];

const PLAN_REWARDS = {
  REGULAR: 150,
  VIP: 200,
  VVIP: 300,
};

/* ===============================
   HELPERS
================================ */
const getNextPlan = (plan) => {
  const index = PLAN_ORDER.indexOf(plan);
  return PLAN_ORDER[index + 1] || null;
};

/* ===============================
   SUBMIT SURVEY
================================ */
exports.submitSurvey = async (req, res) => {
  const client = await pool.connect();

  try {
    const userId = req.user.id;

    await client.query("BEGIN");

    /* 🔒 LOCK USER */
    const userResult = await client.query(
      `
      SELECT
        id,
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

    if (!userResult.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];
    const activePlan = user.plan || "REGULAR";

    /* ⛔ STOP IF ALL SURVEYS DONE */
    if (user.surveys_completed >= TOTAL_SURVEYS) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        message: "All surveys completed",
        activation_required: !user.is_activated,
      });
    }

    /* 💰 APPLY REWARD */
    const reward = PLAN_REWARDS[activePlan] || 0;
    const newCompleted = user.surveys_completed + 1;
    const newTotalEarned = Number(user.total_earned) + reward;

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
      message: "Survey completed",
      surveys_completed: newCompleted,
      earned_this_survey: reward,
      total_earned: newTotalEarned,
      activation_required: newCompleted >= TOTAL_SURVEYS,
      plan: activePlan,
      next_plan: getNextPlan(activePlan),
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Survey submit error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
