const express = require("express");
const router = express.Router();

const { adminProtect } = require("../middlewares/auth.middleware");
const adminController = require("../controllers/admin.controller");

/**
 * =========================================
 * 🔐 ADMIN ROUTES (PROTECTED)
 * =========================================
 */
router.use(adminProtect);

/**
 * =========================================
 * 👤 USERS MANAGEMENT
 * =========================================
 */
router.get("/users", adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.patch("/users/:id/status", adminController.updateUserStatus);
router.patch("/users/:id/role", adminController.updateUserRole);
router.patch("/users/:id/balance", adminController.adjustUserBalance);
router.delete("/users/:id", adminController.deleteUser);

/**
 * =========================================
 * 📊 ADMIN DASHBOARD STATS
 * =========================================
 */
router.get("/stats", adminController.getAdminStats);

module.exports = router;
