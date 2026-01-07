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

    /* 🔒 LOCK USER ROW */
    const userResult = await client.query(
      `
      SELECT
        id,
        plan,
        status,
        completed_surveys,
        locked_balance,
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

    /* 🚫 BLOCK SUSPENDED USERS */
    if (user.status === "SUSPENDED") {
      await client.query("ROLLBACK");
      return res.status(403).json({
        message: "Account suspended",
        survey_access: "LOCKED",
      });
    }

    /* ⛔ STOP IF ALL SURVEYS DONE */
    if (user.completed_surveys >= TOTAL_SURVEYS) {
      await client.query("ROLLBACK");
      return res.status(403).json({
        message: "All surveys already completed",
        activation_required: !user.is_activated,
      });
    }

    /* 💰 APPLY SURVEY REWARD */
    const reward = PLAN_REWARDS[activePlan] || 0;
    const newCompleted = user.completed_surveys + 1;
    const newLockedBalance = Number(user.locked_balance) + reward;

    await client.query(
      `
      UPDATE users
      SET
        completed_surveys = $1,
        locked_balance = $2
      WHERE id = $3
      `,
      [newCompleted, newLockedBalance, userId]
    );

    await client.query("COMMIT");

    /* ✅ SUCCESS */
    return res.json({
      message: "Survey completed",
      completed_surveys: newCompleted,
      earned_this_survey: reward,
      locked_balance: newLockedBalance,
      plan: activePlan,
      activation_required: newCompleted >= TOTAL_SURVEYS,
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
