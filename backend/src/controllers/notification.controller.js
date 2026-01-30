const pool = require("../config/db");

/* =====================================
   USER — GET MY NOTIFICATIONS
===================================== */
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const { rows } = await pool.query(
      `
      SELECT
        id,
        title,
        message,
        action_route,
        is_read,
        type,
        created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
      `,
      [userId]
    );

    // Optional: Highlight welcome bonus notification
    const notifications = rows.map((notif) => ({
      ...notif,
      is_welcome_bonus: notif.type === "welcome_bonus",
    }));

    return res.json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error("❌ Get notifications error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error fetching notifications" 
    });
  }
};

/* =====================================
   USER — MARK NOTIFICATION AS READ
===================================== */
exports.markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND user_id = $2
      RETURNING id, title, is_read, type
      `,
      [id, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification not found" 
      });
    }

    return res.json({ 
      success: true, 
      message: "Notification marked as read",
      notification: result.rows[0]
    });
  } catch (error) {
    console.error("❌ Mark notification read error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error updating notification" 
    });
  }
};

/* =====================================
   USER — CLEAR ALL NOTIFICATIONS
   DELETE /api/notifications/clear
===================================== */
exports.clearAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    // ✅ FIXED: Get count before deleting
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1`,
      [userId]
    );

    const countBefore = parseInt(countResult.rows[0]?.count || 0);

    if (countBefore === 0) {
      return res.json({
        success: true,
        message: "No notifications to clear",
        deletedCount: 0
      });
    }

    // ✅ FIXED: Simple DELETE query without RETURNING COUNT(*)
    const deleteResult = await pool.query(
      `DELETE FROM notifications WHERE user_id = $1`,
      [userId]
    );

    const deletedCount = deleteResult.rowCount;

    return res.json({
      success: true,
      message: `Cleared ${deletedCount} notifications`,
      deletedCount
    });
  } catch (error) {
    console.error("❌ Clear all notifications error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error clearing notifications" 
    });
  }
};

/* =====================================
   USER — DELETE SINGLE NOTIFICATION
   DELETE /api/notifications/:id
===================================== */
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM notifications
      WHERE id = $1 AND user_id = $2
      RETURNING id
      `,
      [id, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification not found or already deleted" 
      });
    }

    return res.json({ 
      success: true, 
      message: "Notification deleted successfully",
      deletedId: id
    });
  } catch (error) {
    console.error("❌ Delete notification error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error deleting notification" 
    });
  }
};