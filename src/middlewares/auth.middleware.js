const jwt = require("jsonwebtoken");
const pool = require("../config/db");

/* ===============================
   🔐 USER AUTH (COOKIE BASED)
================================ */
exports.protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      `
      SELECT id, full_name, phone, email, role
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
   🛡 ADMIN AUTH (HEADER TOKEN)
================================ */
exports.adminProtect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Admin not authenticated" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access denied" });
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
