// routes/user.routes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const pool = require("../config/database");

// ===============================
// USER NOTIFICATION ROUTES
// ===============================

// GET /api/user/notifications
router.get("/notifications", protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, title, message, type, is_read, created_at 
       FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/user/notifications/:id/read
router.put("/notifications/:id/read", protect, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = true 
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    res.json({ message: "Marked as read" });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/user/notifications/clear
router.delete("/notifications/clear", protect, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM notifications WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ message: "All notifications cleared" });
  } catch (error) {
    console.error("Clear notifications error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;