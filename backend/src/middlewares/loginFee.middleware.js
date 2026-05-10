const User = require("../models/User");

/**
 * Middleware to ensure user has paid the login fee
 * Blocks access to protected routes if login_fee_paid is false
 * Use AFTER the protect middleware
 */
exports.requireLoginFee = async (req, res, next) => {
  try {
    // User should already be set by protect middleware
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Fetch full user to check login_fee_paid
    const user = await User.findById(req.user.id).select('login_fee_paid');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // If login fee not paid, block access
    if (!user.login_fee_paid) {
      return res.status(403).json({
        success: false,
        message: "Login fee payment required",
        requires_login_fee: true,
        redirect_to: "/login-fee-payment"
      });
    }

    // User has paid, proceed
    next();
  } catch (error) {
    console.error("Login fee check error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to verify login fee status"
    });
  }
};
