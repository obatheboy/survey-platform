const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");

// ===============================
// AUTH ROUTES (COOKIE BASED)
// ===============================

// Register user
router.post("/register", authController.register);

// Login user (sets HttpOnly cookie)
router.post("/login", authController.login);

// ✅ Get logged-in user (COOKIE + JWT)
router.get("/me", protect, authController.getMe);

// ✅ Logout MUST NOT be protected
// (cookie may be expired or invalid, but still needs clearing)
router.post("/logout", authController.logout);

module.exports = router;
