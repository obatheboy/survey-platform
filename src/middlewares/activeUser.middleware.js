module.exports = (req, res, next) => {
  // User must exist (already attached by protect middleware)
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  /**
   * IMPORTANT:
   * - auth.middleware does NOT attach `status`
   * - undefined status MUST NOT block activation flow
   * - Only explicitly INACTIVE / PENDING users should be blocked
   */

  if (req.user.status && req.user.status !== "ACTIVE") {
    return res.status(403).json({
      message: "Account not activated. Please activate your account first.",
    });
  }

  next();
};
