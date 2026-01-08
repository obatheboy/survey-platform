const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const TOTAL_SURVEYS = 10;

/* ===============================
   🍪 COOKIE CONFIG (FIXED)
   REQUIRED FOR CROSS-SITE AUTH
================================ */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,          // 🔒 REQUIRED
  sameSite: "none",      // 🔥 REQUIRED
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/* ===============================
   REGISTER
================================ */
exports.register = async (req, res) => {
  try {
    const { fullName, phone, email, password } = req.body;

    if (!fullName || !phone || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const exists = await pool.query(
      "SELECT id FROM users WHERE phone = $1",
      [phone]
    );

    if (exists.rows.length) {
      return res.status(409).json({ message: "Phone already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users (
        full_name,
        phone,
        email,
        password_hash,
        is_activated,
        total_earned
      )
      VALUES ($1, $2, $3, $4, false, 0)
      RETURNING id, full_name, phone, email, is_activated
      `,
      [fullName, phone, email || null, passwordHash]
    );

    res.status(201).json({
      message: "Registration successful",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   LOGIN
================================ */
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const result = await pool.query(
      `
      SELECT id, phone, password_hash, is_activated
      FROM users
      WHERE phone = $1
      `,
      [phone]
    );

    if (!result.rows.length) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 🔥 FIX: CROSS-SITE COOKIE
    res.cookie("token", token, COOKIE_OPTIONS);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        phone: user.phone,
        is_activated: user.is_activated,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   LOGOUT
================================ */
exports.logout = (req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.json({ message: "Logged out" });
};

/* ===============================
   GET ME (SESSION SOURCE OF TRUTH)
================================ */
exports.getMe = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Invalid session" });
    }

    const userRes = await pool.query(
      `
      SELECT
        id,
        full_name,
        phone,
        email,
        is_activated,
        total_earned
      FROM users
      WHERE id = $1
      `,
      [req.user.id]
    );

    if (!userRes.rows.length) {
      return res.status(401).json({ message: "Invalid session" });
    }

    const plansRes = await pool.query(
      `
      SELECT
        plan,
        surveys_completed,
        completed,
        is_activated,
        created_at
      FROM user_surveys
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    const plans = {};
    let activePlan = null;

    for (const row of plansRes.rows) {
      plans[row.plan] = {
        surveys_completed: row.surveys_completed,
        completed: row.completed,
        is_activated: row.is_activated,
        total_surveys: TOTAL_SURVEYS,
      };

      if (!row.completed && !activePlan) {
        activePlan = row.plan;
      }
    }

    const activePlanData = activePlan ? plans[activePlan] : null;

    res.json({
      ...userRes.rows[0],
      active_plan: activePlan,
      surveys_completed: activePlanData?.surveys_completed || 0,
      surveys_locked: activePlanData?.completed === true,
      plans,
    });
  } catch (error) {
    console.error("GET ME ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
