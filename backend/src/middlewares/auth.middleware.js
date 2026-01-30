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

    // 3️⃣ Fetch user from DB
    const result = await pool.query(
      `
      SELECT id, full_name, phone, email, is_activated, role
      FROM users
      WHERE id = $1
      `,
      [decoded.id]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ 
        success: false,
        message: "User no longer exists" 
      });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error("❌ User auth error:", error.message);
    res.status(500).json({ 
      success: false,
      message: "Server error during authentication" 
    });
  }
};

/* ===============================
   🛡 ADMIN AUTH (STRICT) - FIXED VERSION
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

    // 3️⃣ FIRST check database for admin role, THEN verify
    const result = await pool.query(
      `
      SELECT id, full_name, email, role
      FROM users
      WHERE id = $1 AND role = 'admin'
      `,
      [decoded.id]
    );

    if (result.rowCount === 0) {
      console.log("❌ User is not an admin in database. User ID:", decoded.id);
      console.log("❌ Token claims role:", decoded.role);
      
      // Optional: Check what the user's actual role is
      const userCheck = await pool.query(
        "SELECT role FROM users WHERE id = $1",
        [decoded.id]
      );
      
      if (userCheck.rowCount > 0) {
        console.log("❌ User's actual role in DB:", userCheck.rows[0].role);
      }
      
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Admin privileges required." 
      });
    }

    // 4️⃣ Attach admin user to request
    const adminUser = result.rows[0];
    req.user = adminUser;
    req.admin = adminUser; // Some routes might expect req.admin
    
    console.log("✅ Admin authenticated successfully:", { 
      id: adminUser.id, 
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