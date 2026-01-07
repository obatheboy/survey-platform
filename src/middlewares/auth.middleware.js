const jwt = require("jsonwebtoken");
const pool = require("../config/db");

/**
 * ===============================
 * 🔐 AUTHENTICATION ONLY
 * - Reads JWT from HttpOnly cookie
 * - Verifies identity
 * - Fetches fresh user from DB
 * - 🚨 ONLY blocks SUSPENDED users
 * ===============================
 */
exports.protect = async (req, res, next) => {
  try {
    // ✅ TOKEN FROM COOKIE
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // ✅ VERIFY TOKEN (IDENTITY ONLY)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Session expired, please login" });
    }

    // ✅ FETCH USER (SOURCE OF TRUTH)
    const result = await pool.query(
      `SELECT
         id,
         username,
         role,
         status,
         completed_surveys,
         locked_balance,
         available_balance
       FROM users
       WHERE id = $1`,
      [decoded.id]
    );

    if (!result.rows.length) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    const user = result.rows[0];

    /**
     * 🚫 GLOBAL BLOCK RULE
     * - ONLY suspended users are blocked
     * - Admins always bypass
     */
    if (user.status === "SUSPENDED" && user.role !== "admin") {
      return res.status(403).json({
        message: "Your account has been suspended by admin",
      });
    }

    // ✅ ATTACH USER TO REQUEST
    req.user = user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Invalid or expired session" });
  }
};

/**
 * ===============================
 * 🛡 ADMIN ONLY ACCESS
 * ===============================
 */
exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};
