const jwt = require("jsonwebtoken");
const pool = require("../config/db");

/**
 * ===============================
 * 🔐 AUTHENTICATION MIDDLEWARE
 * ===============================
 */
exports.protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Session expired, please login" });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        full_name,
        phone,
        email,
        role
      FROM users
      WHERE id = $1
      `,
      [decoded.id]
    );

    if (!result.rows.length) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = result.rows[0];

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json({ message: "Invalid or expired session" });
  }
};

/**
 * ===============================
 * 🛡 ADMIN ONLY (REAL)
 * ===============================
 */
exports.adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access denied" });
  }

  next();
};
