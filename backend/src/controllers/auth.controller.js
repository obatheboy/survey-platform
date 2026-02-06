/* eslint-disable no-undef */
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Notification = require("../models/Notification"); // ✅ ADDED: Import Notification model

const TOTAL_SURVEYS = 10;

/* ===============================
   🍪 COOKIE CONFIG (RENDER + VERCEL SAFE)
================================ */
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/* ===============================
   REGISTER
================================ */
exports.register = async (req, res) => {
  try {
    const fullName = req.body.fullName || req.body.name || req.body.full_name;
    const { phone, email, password } = req.body;

    if (!fullName || !phone || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    // ✅ CHANGED: MongoDB findOne instead of pool.query
    const exists = await User.findOne({ phone });
    if (exists) {
      return res.status(409).json({ message: "Phone already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // ✅ CHANGED: MongoDB create instead of pool.query
    const user = new User({
      full_name: fullName,
      phone,
      email: email || null,
      password_hash: passwordHash,
      is_activated: false,
      total_earned: 1200,
      welcome_bonus_received: true,
      welcome_bonus: 1200, // Add this field
      // Initialize empty plans structure
      plans: {
        REGULAR: {
          surveys_completed: 0,
          completed: false,
          is_activated: false,
          total_surveys: 10
        },
        VIP: {
          surveys_completed: 0,
          completed: false,
          is_activated: false,
          total_surveys: 10
        },
        VVIP: {
          surveys_completed: 0,
          completed: false,
          is_activated: false,
          total_surveys: 10
        }
      }
    });

    await user.save();

    // ---------------------------
    // 🌟 WELCOME BONUS LOGIC - UPDATED
    // ---------------------------
    try {
      // ✅ UPDATED: Use Notification model
      const notification = new Notification({
        user_id: user._id,
        title: "🎉 Welcome Bonus Unlocked!",
        message: "You've received KES 1,200 as a welcome bonus. Activate your account to withdraw.",
        action_route: "/dashboard",
        type: "welcome_bonus"
      });
      
      await notification.save();
      console.log("✅ Welcome bonus notification created for user:", user._id);
    } catch (bonusError) {
      console.error("WELCOME BONUS NOTIFICATION ERROR:", bonusError);
      // Don't block registration if notification fails
    }

    // ✅ CHANGED: Use user._id instead of user.id
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, COOKIE_OPTIONS);

    res.status(201).json({
      message: "Registration successful",
      token: token,
      user: {
        id: user._id, // ✅ CHANGED to _id
        full_name: user.full_name,
        phone: user.phone,
        email: user.email,
        is_activated: user.is_activated
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    // ✅ ADDED: Handle MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ message: "Phone already registered" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   LOGIN
================================ */
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // ✅ CHANGED: MongoDB findOne instead of pool.query
    const user = await User.findOne({ phone });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    // ✅ CHANGED: Use user._id instead of user.id
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, COOKIE_OPTIONS);

    res.json({
      message: "Login successful",
      token: token,
      user: {
        id: user._id, // ✅ CHANGED to _id
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
   LOGOUT (No changes needed)
================================ */
exports.logout = (req, res) => {
  res.clearCookie("token", { ...COOKIE_OPTIONS, maxAge: 0 });
  res.json({ message: "Logged out" });
};

/* ===============================
   GET ME (Updated for plans structure)
================================ */
exports.getMe = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: "Invalid session" });

    // ✅ CHANGED: MongoDB findById instead of pool.query
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: "Invalid session" });

    // Calculate active plan and totals from plans structure
    let activePlan = null;
    let totalSurveysCompleted = 0;
    let surveysCompleted = 0;
    let surveysLocked = false;

    // Check if user has plans structure
    if (user.plans) {
      // Loop through all plans (REGULAR, VIP, VVIP)
      for (const [planKey, planData] of Object.entries(user.plans)) {
        if (planData && typeof planData === 'object') {
          // Accumulate total surveys completed across all plans
          totalSurveysCompleted += planData.surveys_completed || 0;
          
          // Determine active plan (first non-activated plan)
          if (!activePlan && planData.is_activated === false) {
            activePlan = planKey;
            surveysCompleted = planData.surveys_completed || 0;
            surveysLocked = planData.completed === true;
          }
        }
      }
    }

    res.json({
      id: user._id,
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      is_activated: user.is_activated,
      total_earned: user.total_earned,
      welcome_bonus: user.welcome_bonus || 1200, // Include welcome_bonus field
      welcome_bonus_received: user.welcome_bonus_received,
      welcome_bonus_withdrawn: user.welcome_bonus_withdrawn || false,
      active_plan: activePlan,
      surveys_completed: surveysCompleted,
      total_surveys_completed: totalSurveysCompleted,
      surveys_locked: surveysLocked,
      plans: user.plans || {},
    });
  } catch (error) {
    console.error("GET ME ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};