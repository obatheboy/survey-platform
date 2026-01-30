const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markNotificationRead,
  clearAllNotifications,
  deleteNotification, // ✅ Add this import
} = require("../controllers/notification.controller");

const { protect } = require("../middlewares/auth.middleware");

/* ===============================
   USER NOTIFICATIONS
================================ */
router.get("/", protect, getMyNotifications);
router.patch("/:id/read", protect, markNotificationRead);
router.delete("/clear", protect, clearAllNotifications);
router.delete("/:id", protect, deleteNotification); // ✅ Add this new route

module.exports = router;