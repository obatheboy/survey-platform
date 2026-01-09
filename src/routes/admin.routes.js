const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const adminController = require("../controllers/admin.controller");

/**
 * =========================================
 * 🔐 ADMIN ROUTES
 * (AUTH ONLY — ADMIN CHECK COMING LATER)
 * =========================================
 */
router.use(protect);

/**
 * =========================================
 * 👤 USERS MANAGEMENT
 * =========================================
 */

// Get ALL users
router.get("/users", adminController.getAllUsers);

// Get SINGLE user
router.get("/users/:id", adminController.getUserById);

// Update user status
// Allowed: ACTIVE / INACTIVE / SUSPENDED
router.patch("/users/:id/status", adminController.updateUserStatus);

// Change user role (user ↔ admin)
router.patch("/users/:id/role", adminController.updateUserRole);

// Adjust balances manually
router.patch("/users/:id/balance", adminController.adjustUserBalance);

// Delete user
router.delete("/users/:id", adminController.deleteUser);

/**
 * =========================================
 * 📊 ADMIN DASHBOARD STATS
 * =========================================
 */
router.get("/stats", adminController.getAdminStats);

module.exports = router;
