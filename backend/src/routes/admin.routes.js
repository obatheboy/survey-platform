const express = require("express");
const router = express.Router();

const { adminProtect } = require("../middlewares/auth.middleware");
const adminController = require("../controllers/admin.controller");
// ADD THIS LINE:
const activationController = require("../controllers/activation.controller");

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
 * 💳 ACTIVATIONS MANAGEMENT (ADD THIS SECTION)
 * =========================================
 */
// Get all activations (pending, approved, rejected)
router.get("/activations", activationController.getAllActivations);

// Get only pending activations
router.get("/activations/pending", activationController.getPendingActivations);

// Approve an activation
router.patch("/activations/approve", activationController.approveActivation);

// Reject an activation  
router.patch("/activations/reject", activationController.rejectActivation);

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