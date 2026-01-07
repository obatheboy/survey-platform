const jwt = require("jsonwebtoken");
const pool = require("../config/db");

/**
 * ===============================
 * 🔐 AUTHENTICATION MIDDLEWARE
 * - Reads JWT from HttpOnly cookie
 * - Verifies identity
 * - Fetches fresh user from DB
 * ===============================
 */
exports.protect = async (req, res, next) => {
  try {
    // ✅ TOKEN FROM COOKIE
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // ✅ VERIFY TOKEN
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Session expired, please login" });
    }

    // ✅ FETCH USER (SOURCE OF TRUTH)
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
      [decoded.id]
    );

    if (!result.rows.length) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    // ✅ ATTACH USER
    req.user = result.rows[0];

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Invalid or expired session" });
  }
};

/**
 * ===============================
 * 🛡 ADMIN ONLY (FUTURE SAFE)
 * ===============================
 */
exports.adminOnly = (req, res, next) => {
  // Placeholder until roles are implemented
  return res.status(403).json({ message: "Admin access not enabled" });
};
