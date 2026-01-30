const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markNotificationRead,
  clearAllNotifications, // ✅ Make sure this is imported
} = require("../controllers/notification.controller");

const { protect } = require("../middlewares/auth.middleware");

/* ===============================
   USER NOTIFICATIONS
================================ */
router.get("/", protect, getMyNotifications);
router.patch("/:id/read", protect, markNotificationRead);
router.delete("/clear", protect, clearAllNotifications); // ✅ Add this

module.exports = router;