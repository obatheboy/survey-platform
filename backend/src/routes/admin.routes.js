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
 * 👑 ADMIN SESSION (VERIFY LOGIN)
 * =========================================
 */
router.get("/me", (req, res) => {
  res.json({
    id: req.user.id,
    full_name: req.user.full_name,
    role: req.user.role,
  });
});

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
router.post("/users/bulk-delete", adminController.deleteBulkUsers);

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
// Get all notifications across all users
router.get("/notifications", adminController.getAllNotifications);

// Delete specific notification (for all users)
router.delete("/notifications/:id", adminController.deleteNotificationForAllUsers);

// Delete notifications by type
router.delete("/notifications/type/:type", adminController.deleteNotificationsByType);

// Cleanup old notifications
router.delete("/notifications/cleanup", adminController.deleteOldNotifications);

/**
 * =========================================
 * 📊 ADMIN DASHBOARD STATS
 * =========================================
 */
router.get("/stats", adminController.getAdminStats);

module.exports = router;