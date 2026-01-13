const jwt = require("jsonwebtoken");
const pool = require("../config/db");

/* ===============================
   🔐 USER AUTH (COOKIE + BEARER)
================================ */
exports.protect = async (req, res, next) => {
  try {
    // 1️⃣ Get token from cookie or Authorization header
    let token = req.cookies?.token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      // Instead of logging out, send a clear message
      return res.status(401).json({ message: "Not authenticated. Please login." });
    }

    // 2️⃣ Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Session expired or invalid token" });
    }

    // 3️⃣ Fetch user from DB
    const result = await pool.query(
      `
      SELECT id, full_name, phone, email, is_activated
      FROM users
      WHERE id = $1
      `,
      [decoded.id]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error("❌ User auth error:", error.message);
    res.status(500).json({ message: "Server error during authentication" });
  }
};

/* ===============================
   🛡 ADMIN AUTH (STRICT)
================================ */
exports.adminProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Admin not authenticated" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid or expired admin token" });
    }

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    const result = await pool.query(
      `
      SELECT id, username
      FROM admins
      WHERE id = $1
      `,
      [decoded.id]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Admin no longer exists" });
    }

    req.admin = result.rows[0];
    next();
  } catch (error) {
    console.error("❌ Admin auth error:", error.message);
    res.status(500).json({ message: "Server error during admin authentication" });
  }
};
