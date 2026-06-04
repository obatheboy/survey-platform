const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Changed from pool to User model

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

    // 3️⃣ Fetch user from MongoDB (Changed from PostgreSQL)
    const user = await User.findById(decoded.id)
      .select('full_name phone email is_activated role login_fee_paid plans_paid all_plans_completed');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists"
      });
    }

    // 4️⃣ Check login fee payment (exempt certain paths)
    const exemptPaths = [
      '/api/auth/me',
      '/api/health',
      '/api/login-fee/confirm',
      '/api/login-fee/initiate',
      '/api/plans/confirm'
    ];
    const path = req.path;
    const isLoginFeeExempt = exemptPaths.some(p => path === p || path.startsWith(p + '/')) ||
                            path.startsWith('/api/login-fee/') ||
                            path.startsWith('/api/plans/');

    // DEBUG
    console.log(`[Auth Middleware] Path: ${path}, login_fee_paid: ${user.login_fee_paid}, exempt: ${isLoginFeeExempt}`);

    if (!isLoginFeeExempt && !user.login_fee_paid) {
      return res.status(403).json({
        success: false,
        message: "Login fee payment required",
        requires_login_fee: true,
        redirect_to: "/login-fee-payment"
      });
    }

    // 5️⃣ Attach user to request (format to match old structure)
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
  }
};

/* ===============================
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