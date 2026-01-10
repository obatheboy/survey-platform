const jwt = require("jsonwebtoken");
const pool = require("../config/db");

/* ===============================
   🔐 USER AUTH (COOKIE + BEARER)
   - NO role column
================================ */
exports.protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    // ✅ Allow Bearer token fallback (Vercel safe)
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

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
      SELECT id, full_name, phone, email
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
    console.error("❌ User auth error:", error.message);
    return res.status(401).json({ message: "Invalid or expired session" });
  }
};

/* ===============================
   🛡 ADMIN AUTH (HEADER ONLY)
   - Admins table
================================ */
exports.adminProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Admin not authenticated" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Admin session expired" });
    }

    const result = await pool.query(
      `
      SELECT id, username
      FROM admins
      WHERE id = $1
      `,
      [decoded.id]
    );

    if (!result.rows.length) {
      return res.status(401).json({ message: "Admin no longer exists" });
    }

    req.admin = result.rows[0];
    next();
  } catch (error) {
    console.error("❌ Admin auth error:", error.message);
    return res.status(401).json({ message: "Invalid or expired admin token" });
  }
};
