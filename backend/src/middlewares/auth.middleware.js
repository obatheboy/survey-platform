const jwt = require("jsonwebtoken");
<<<<<<< Updated upstream
const User = require("../models/User"); // Changed from pool to User model

/* ===============================
   🔐 USER AUTH (COOKIE + BEARER)
================================ */
exports.protect = async (req, res, next) => {
  try {
    // 1️⃣ Get token from cookie or Authorization header
    let token = req.cookies?.token;

=======
const pool = require("../config/db");

/* ===============================
   🔐 USER AUTH (COOKIE + BEARER)
   - NO role column
================================ */
exports.protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    // ✅ Allow Bearer token fallback (Vercel safe)
>>>>>>> Stashed changes
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
<<<<<<< Updated upstream
      return res.status(401).json({ 
        success: false,
        message: "Not authenticated. Please login." 
      });
    }

    // 2️⃣ Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ 
        success: false,
        message: "Session expired or invalid token" 
      });
    }

    // 3️⃣ Fetch user from MongoDB (Changed from PostgreSQL)
    const user = await User.findById(decoded.id)
      .select('full_name phone email is_activated role login_fee_paid plans_paid regular_paid vip_paid vvip_paid all_plans_completed welcome_bonus_paid plans');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists"
      });
    }

    // 4️⃣ Auto-approve login fee for legacy users (fee removed - all users have access)
    if (!user.login_fee_paid) {
      try {
        user.login_fee_paid = true;
        user.login_fee_paid_at = user.login_fee_paid_at || new Date();
        await user.save();
      } catch (saveErr) {
        console.error("Auto-approve login fee error:", saveErr.message);
      }
    }

    // Attach user to request (format to match old structure)
    req.user = {
      id: user._id,
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      is_activated: user.is_activated,
      login_fee_paid: user.login_fee_paid,
      role: user.role
    };

    next();
  } catch (error) {
    console.error("❌ User auth error:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error during authentication" 
    });
=======
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
>>>>>>> Stashed changes
  }
};

/* ===============================
<<<<<<< Updated upstream
   🛡 ADMIN AUTH (STRICT) - MONGODB VERSION
================================ */
exports.adminProtect = async (req, res, next) => {
  try {
    console.log("🔐 Admin auth attempt - Headers:", req.headers);
    console.log("🔐 Admin auth attempt - Cookies:", req.cookies);
    
    // 1️⃣ Get token with better debugging
    let token = null;
    
    // Check Authorization header first
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
      console.log("✅ Token from Authorization header");
    } 
    // Check adminToken cookie
    else if (req.cookies?.adminToken) {
      token = req.cookies.adminToken;
      console.log("✅ Token from adminToken cookie");
    }
    // Check regular token cookie (as fallback)
    else if (req.cookies?.token) {
      token = req.cookies.token;
      console.log("✅ Token from regular token cookie");
    }

    if (!token) {
      console.log("❌ No token found in request");
      return res.status(401).json({ 
        success: false, 
        message: "Admin authentication required. Please login as admin." 
      });
    }

    console.log("🔐 Token found (first 20 chars):", token.substring(0, 20) + "...");

    // 2️⃣ Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token decoded:", { 
        id: decoded.id, 
        role: decoded.role || 'no-role-in-token',
        email: decoded.email || 'no-email-in-token' 
      });
    } catch (err) {
      console.log("❌ Token verification failed:", err.message);
      return res.status(401).json({ 
        success: false, 
        message: "Invalid or expired authentication token" 
      });
    }

    // 3️⃣ Check database for admin user using MongoDB (Changed from PostgreSQL)
    const adminUser = await User.findOne({
      _id: decoded.id,
      role: 'admin'
    }).select('full_name email role');

    if (!adminUser) {
      console.log("❌ User is not an admin in database. User ID:", decoded.id);
      console.log("❌ Token claims role:", decoded.role);
      
      // Optional: Check what the user's actual role is
      const userCheck = await User.findById(decoded.id).select('role');
      
      if (userCheck) {
        console.log("❌ User's actual role in DB:", userCheck.role);
      }
      
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Admin privileges required." 
      });
    }

    // 4️⃣ Attach admin user to request (format to match old structure)
    req.user = {
      id: adminUser._id,
      full_name: adminUser.full_name,
      email: adminUser.email,
      role: adminUser.role
    };
    req.admin = req.user; // Some routes might expect req.admin
    
    console.log("✅ Admin authenticated successfully:", { 
      id: adminUser._id, 
      name: adminUser.full_name,
      email: adminUser.email,
      role: adminUser.role 
    });
    
    next();
  } catch (error) {
    console.error("❌ Admin auth middleware error:", error.message);
    console.error("❌ Full error stack:", error.stack);
    res.status(500).json({ 
      success: false, 
      message: "Server error during admin authentication" 
    });
  }
};
=======
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
>>>>>>> Stashed changes
