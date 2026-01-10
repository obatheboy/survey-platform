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
    id: req.admin.id,
    full_name: req.admin.full_name,
    role: "admin",
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
router.patch("/users/:id/activate", adminController.activateUser); // ✅ NEW ROUTE
router.delete("/users/:id", adminController.deleteUser);

/**
 * =========================================
 * 📊 ADMIN DASHBOARD STATS
 * =========================================
 */
router.get("/stats", adminController.getAdminStats);

module.exports = router;
