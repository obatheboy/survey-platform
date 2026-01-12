const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markNotificationRead,
} = require("../controllers/notification.controller");

// Fixed import: added .js extension
const authMiddleware = require("../middleware/auth.middleware.js");

/* ===============================
   USER NOTIFICATIONS
================================ */
router.get("/", authMiddleware, getMyNotifications);
router.patch("/:id/read", authMiddleware, markNotificationRead);

module.exports = router;
