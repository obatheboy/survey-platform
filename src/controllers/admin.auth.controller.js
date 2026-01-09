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

    const result = await pool.query(
      `
      SELECT id, username
      FROM admins
      WHERE phone = $1
      AND password_hash = crypt($2, password_hash)
      `,
      [phone, password]
    );

    if (!result.rows.length) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    const admin = result.rows[0];

    const token = jwt.sign(
      {
        id: admin.id,
        role: "admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    res.json({
      message: "Admin login successful",
      token,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};