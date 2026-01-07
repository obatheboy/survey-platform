module.exports = (req, res, next) => {
  // user is already attached by protect middleware
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.status !== "ACTIVE") {
    return res.status(403).json({
      message: "Account not activated. Please activate your account first.",
    });
  }

  next();
};
