const express = require("express");
const router = express.Router();

const { adminProtect } = require("../middlewares/auth.middleware");
const adminController = require("../controllers/admin.controller");
<<<<<<< Updated upstream
// ADD THIS LINE:
const activationController = require("../controllers/activation.controller");
=======
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
    id: req.user.id,
    full_name: req.user.full_name,
    role: req.user.role,
=======
    id: req.admin.id,
    username: req.admin.username,
    role: "admin",
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
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

// Approve an activation - FIXED: Use POST with body params
router.post("/activations/approve", activationController.approveActivation);

// Reject an activation - FIXED: Use POST with body params  
router.post("/activations/reject", activationController.rejectActivation);

// Debug/test endpoint
router.get("/activations/test", activationController.testActivationFormat);

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
=======
router.delete("/users/:id", adminController.deleteUser);
>>>>>>> Stashed changes

/**
 * =========================================
 * 📊 ADMIN DASHBOARD STATS
 * =========================================
 */
router.get("/stats", adminController.getAdminStats);

<<<<<<< Updated upstream
/**
 * =========================================
 * 💰 AFFILIATE WITHDRAWALS & REFERRALS
 * =========================================
 */
router.get("/affiliate/withdrawals", adminController.getPendingAffiliateWithdrawals);
router.get("/affiliate/referrals", adminController.getAffiliateReferrals);

/**
 * =========================================
 * 🧹 CLEANUP OLD DATA
 * =========================================
 */
router.delete("/cleanup/old-users", adminController.deleteOldUsers);

module.exports = router;
=======
module.exports = router;
>>>>>>> Stashed changes
