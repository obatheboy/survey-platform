const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markNotificationRead,
} = require("../controllers/notification.controller");

const { protect } = require("../middlewares/auth.middleware"); // fixed path

/* ===============================
   USER NOTIFICATIONS
================================ */
router.get("/", protect, getMyNotifications);
router.patch("/:id/read", protect, markNotificationRead);

module.exports = router;
