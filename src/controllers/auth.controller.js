const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const TOTAL_SURVEYS = 10;

/* ===============================
   COOKIE CONFIG (VERCEL + RENDER)
================================ */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // ✅ HTTPS only in prod
  sameSite: "none", // ✅ REQUIRED for cross-domain cookies
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/* ===============================
   REGISTER
================================ */
exports.register = async (req, res) => {
  try {
    const { fullName, username, email, phone, password } = req.body;

    if (!fullName || !username || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res
        .status(409)
        .json({ message: "Username or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      `
      INSERT INTO users (
        full_name,
        username,
        email,
        phone,
        password,
        role,
        status,
        locked_balance,
        available_balance,
        completed_surveys,
        plan,
        current_plan,
        plan_completed
      )
      VALUES (
        $1,$2,$3,$4,$5,
        'user',
        'INACTIVE',
        0,
        0,
        0,
        'REGULAR',
        'REGULAR',
        false
      )
      RETURNING id, full_name, username, email, role, status
      `,
      [fullName, username, email, phone, hashedPassword]
    );

    res.status(201).json({
      message: "Registration successful",
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   LOGIN
   🔐 AUTH ONLY — NO BUSINESS LOGIC
================================ */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      `
      SELECT id, username, password, role, status
      FROM users
      WHERE username = $1
      `,
      [username]
    );

    if (!result.rows.length) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.cookie("token", token, COOKIE_OPTIONS);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
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
   🎯 FRONTEND FLOW CONTROLLER
================================ */
exports.getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        full_name,
        username,
        email,
        role,
        status,
        plan,
        completed_surveys,
        locked_balance,
        available_balance
      FROM users
      WHERE id = $1
      `,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = result.rows[0];

    const surveysCompleted = user.completed_surveys >= TOTAL_SURVEYS;

    /* ===============================
       FLOW DECISION FLAGS
    ================================ */
    const activationRequired = surveysCompleted;
    const surveysOpen = !surveysCompleted;
    const allPlansCompleted = user.plan === "VVIP" && surveysCompleted;

    const canWithdraw =
      user.status === "ACTIVE" &&
      allPlansCompleted &&
      user.available_balance > 0;

    /* ===============================
       RESPONSE (SINGLE SOURCE OF TRUTH)
    ================================ */
    res.json({
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,

      // 🔑 PLAN
      plan: user.plan,

      // 🔄 SURVEYS
      completed_surveys: user.completed_surveys,
      surveys_open: surveysOpen,
      surveys_completed: surveysCompleted,

      // 🔓 ACTIVATION
      activation_required: activationRequired,
      all_plans_completed: allPlansCompleted,

      // 💰 BALANCES
      locked_balance: user.locked_balance,
      available_balance: user.available_balance,

      // 🏦 WITHDRAW
      can_withdraw: canWithdraw,
    });
  } catch (err) {
    console.error("GetMe error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
