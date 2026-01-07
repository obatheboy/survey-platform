const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const TOTAL_SURVEYS = 10;

/* ===============================
   COOKIE CONFIG (VERCEL + RENDER)
================================ */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,          // REQUIRED for Vercel + Render
  sameSite: "none",      // REQUIRED for cross-domain cookies
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

    // Phone is UNIQUE
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
        plan
      )
      VALUES ($1, $2, $3, $4, 'REGULAR')
      RETURNING
        id,
        full_name,
        phone,
        email,
        plan,
        is_activated
      `,
      [fullName, phone, email || null, passwordHash]
    );

    res.status(201).json({
      message: "Registration successful",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Register error:", error);
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
      SELECT
        id,
        phone,
        password_hash,
        is_activated
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
    console.error("Login error:", error);
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
   GET ME
================================ */
exports.getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        full_name,
        phone,
        email,
        plan,
        is_activated,
        surveys_completed,
        total_earned
      FROM users
      WHERE id = $1
      `,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];
    const surveysCompleted = user.surveys_completed >= TOTAL_SURVEYS;

    res.json({
      id: user.id,
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      plan: user.plan,

      surveys_completed: user.surveys_completed,
      surveys_done: surveysCompleted,

      activation_required: surveysCompleted && !user.is_activated,
      can_withdraw: user.is_activated && user.total_earned > 0,

      total_earned: user.total_earned,
      is_activated: user.is_activated,
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
