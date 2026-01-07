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

// Get logged-in user (from cookie)
router.get("/me", protect, authController.getMe);

// Logout user (clears cookie)
router.post("/logout", protect, authController.logout);

module.exports = router;
