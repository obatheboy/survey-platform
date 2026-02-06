const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // ✅ CHANGED: Use User model instead of pool

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

    // ✅ CHANGED: MongoDB find instead of pool.query
    const user = await User.findOne({
      phone: phone.trim(),
      role: 'admin'
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    // Verify password using bcrypt (same as regular user login)
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    const token = jwt.sign(
      {
        id: user._id, // ✅ CHANGED: user._id instead of user.id
        role: "admin",
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return res.status(200).json({
      message: "Admin login successful",
      token,
      admin: {
        id: user._id, // ✅ CHANGED: user._id instead of user.id
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   🔐 CREATE ADMIN ACCOUNT (One-time setup)
====================================================== */
exports.createAdmin = async (req, res) => {
  try {
    const { phone, password, full_name, email } = req.body;

    if (!phone || !password || !full_name) {
      return res.status(400).json({
        message: "Phone, password, and full name are required",
      });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [
        { phone: phone.trim(), role: 'admin' },
        { email: email?.trim(), role: 'admin' }
      ]
    });

    if (existingAdmin) {
      return res.status(400).json({
        message: "Admin account already exists with this phone or email",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = new User({
      full_name: full_name.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      password_hash: passwordHash,
      role: 'admin',
      is_activated: true,
      status: 'ACTIVE'
    });

    await admin.save();

    return res.status(201).json({
      message: "Admin account created successfully",
      admin: {
        id: admin._id,
        full_name: admin.full_name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Phone number already registered",
      });
    }
    
    return res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   🔐 ADMIN LOGOUT
====================================================== */
exports.adminLogout = (req, res) => {
  // Note: Since we're using token-based auth, logout is handled client-side
  // by removing the token. This endpoint is for consistency.
  return res.status(200).json({
    message: "Admin logged out successfully",
  });
};

/* ======================================================
   🔐 GET ADMIN PROFILE
====================================================== */
exports.getAdminProfile = async (req, res) => {
  try {
    // This assumes adminAuth middleware sets req.admin
    if (!req.admin || !req.admin.id) {
      return res.status(401).json({ message: "Admin authentication required" });
    }

    const admin = await User.findById(req.admin.id).select('-password_hash');

    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.status(200).json({
      admin: {
        id: admin._id,
        full_name: admin.full_name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        status: admin.status,
        created_at: admin.created_at
      },
    });
  } catch (error) {
    console.error("Get admin profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};