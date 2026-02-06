const express = require("express");
const router = express.Router();

const { adminProtect } = require("../middlewares/auth.middleware");
const adminController = require("../controllers/admin.controller");
const activationAdminController = require("../controllers/admin.activation.controller");
const withdrawController = require("../controllers/withdraw.controller");

/**
 * =========================================
 * 🔐 ADMIN ROUTES (PROTECTED)
 * =========================================
 */
router.use(adminProtect);

/**
 * =========================================
 * 👑 ADMIN SESSION (VERIFY LOGIN)
 * =========================================
 */
// REMOVED: Duplicate /me route - Keep only in admin.auth.routes.js

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
router.patch("/users/:id/activate", adminController.activateUser);
router.delete("/users/:id", adminController.deleteUser);
router.delete("/users/bulk", adminController.deleteBulkUsers); // FIXED: DELETE not POST

/**
 * =========================================
 * 💳 ACTIVATION PAYMENTS MANAGEMENT
 * =========================================
 */
router.get("/activations", activationAdminController.getActivationPayments);
router.get("/activations/pending", activationAdminController.getPendingActivations);
router.post("/activations/:id/approve", activationAdminController.approveActivation);
router.post("/activations/:id/reject", activationAdminController.rejectActivation);
router.get("/activations/stats", activationAdminController.getActivationStats);

/**
 * =========================================
 * 💰 WITHDRAWAL REQUESTS MANAGEMENT
 * =========================================
 */
router.get("/withdrawals", withdrawController.getAllWithdrawals);
router.get("/withdrawals/pending", withdrawController.getPendingWithdrawals);
router.post("/withdrawals/:id/approve", withdrawController.approveWithdraw);
router.post("/withdrawals/:id/reject", withdrawController.rejectWithdraw);

/**
 * =========================================
 * 📢 NOTIFICATIONS MANAGEMENT
 * =========================================
 */
router.post("/notifications/bulk", adminController.sendBulkNotification);

/**
 * =========================================
 * 🔔 NOTIFICATIONS MANAGEMENT (NEW)
 * =========================================
 */
router.get("/notifications", adminController.getAllNotifications);
router.delete("/notifications/:id", adminController.deleteNotificationForAllUsers);
router.delete("/notifications/type/:type", adminController.deleteNotificationsByType);
router.delete("/notifications/cleanup", adminController.deleteOldNotifications);

/**
 * =========================================
 * 📊 ADMIN DASHBOARD STATS
 * =========================================
 */
router.get("/stats", adminController.getAdminStats);

module.exports = router;