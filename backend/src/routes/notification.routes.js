const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markNotificationRead,
} = require("../controllers/notification.controller");

// Correct import without .js
const authMiddleware = require("../middleware/auth.middleware");

/* ===============================
   USER NOTIFICATIONS
================================ */
router.get("/", authMiddleware, getMyNotifications);
router.patch("/:id/read", authMiddleware, markNotificationRead);

module.exports = router;
