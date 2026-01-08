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
   SELECT PLAN (DB = SOURCE OF TRUTH)
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
      UPDATE users
      SET
        plan = $1,
        surveys_completed = 0,
        is_activated = false
      WHERE id = $2
      `,
      [plan, userId]
    );

    return res.json({ success: true, plan });
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

    /* 🚫 NO PLAN → CANNOT SUBMIT */
    if (!user.plan || !PLAN_TOTAL_EARNINGS[user.plan]) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "No active survey plan",
      });
    }

    /* 🔒 SURVEYS ALREADY COMPLETED → HARD LOCK */
    if (user.surveys_completed >= TOTAL_SURVEYS) {
      await client.query("ROLLBACK");
      return res.json({
        completed: true,
        surveys_completed: TOTAL_SURVEYS,
        total_earned: Number(user.total_earned),
        surveys_locked: true,
        activation_required: !user.is_activated,
      });
    }

    /* ➕ INCREMENT SURVEYS */
    const newCompleted = user.surveys_completed + 1;

    let newTotalEarned = Number(user.total_earned || 0);
    let surveysLocked = false;
    let activationRequired = false;

    /* 🎉 CREDIT EARNINGS ONLY ON 10/10 */
    if (newCompleted === TOTAL_SURVEYS) {
      newTotalEarned += PLAN_TOTAL_EARNINGS[user.plan];
      surveysLocked = true;
      activationRequired = true;
    }

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

    /* ✅ SINGLE, CANONICAL RESPONSE */
    return res.json({
      completed: newCompleted === TOTAL_SURVEYS,
      surveys_completed: newCompleted,
      total_earned: newTotalEarned,
      surveys_locked: surveysLocked,
      activation_required: activationRequired,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Survey submit error:", error);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
