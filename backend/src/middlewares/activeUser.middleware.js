const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    // User must exist (already attached by protect middleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    /**
     * RULES:
     * - status = moderation only (ACTIVE / SUSPENDED)
     * - is_activated = withdrawal & post-survey access
     * - NEVER block activation routes here
     */

    // 🚫 Fetch fresh user data to check status
    // In MongoDB, we need to check if user exists and get their status
    const user = await User.findById(req.user.id).select('status is_activated');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Check if user has status field (MongoDB might store it differently)
    const userStatus = user.status || 'ACTIVE'; // Default to ACTIVE if no status field
    
    // 🚫 Suspended users blocked globally
    if (userStatus === "SUSPENDED") {
      return res.status(403).json({
        success: false,
        message: "Account suspended. Contact support.",
      });
    }

    // Optional: Update req.user with fresh data
    req.user.status = userStatus;
    req.user.is_activated = user.is_activated;

    next();
  } catch (error) {
    console.error("Active user middleware error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error checking user status" 
    });
  }
};