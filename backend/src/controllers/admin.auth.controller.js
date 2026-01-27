const pool = require("../config/db");
const jwt = require("jsonwebtoken");

/* ======================================================
   🔐 ADMIN LOGIN CONTROLLER
====================================================== */

exports.adminLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        message: "Phone and password are required",
      });
    }

    // Check in users table with admin role
    const result = await pool.query(
      `
      SELECT id, full_name, email, phone, role, password_hash
      FROM users
      WHERE phone = $1
      AND role = 'admin'
      `,
      [phone]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    const user = result.rows[0];

    // Verify password (assuming bcrypt or similar)
    // For now, we'll do a simple comparison - in production use bcrypt
    const crypto = require("crypto");
    const isValidPassword = user.password_hash === crypto.createHash("sha256").update(password).digest("hex");

    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: "admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return res.status(200).json({
      message: "Admin login successful",
      token,
      admin: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
