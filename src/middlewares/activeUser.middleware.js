module.exports = (req, res, next) => {
  // User must exist (already attached by protect middleware)
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  /**
   * RULES:
   * - status = moderation only (ACTIVE / SUSPENDED)
   * - is_activated = withdrawal & post-survey access
   * - NEVER block activation routes here
   */

  // 🚫 Suspended users blocked globally
  if (req.user.status === "SUSPENDED") {
    return res.status(403).json({
      message: "Account suspended. Contact support.",
    });
  }

  next();
};
