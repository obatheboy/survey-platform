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
      `,
      [userId]
    );

    // Optional: Highlight welcome bonus notification
    const notifications = rows.map((notif) => ({
      ...notif,
      is_welcome_bonus: notif.type === "welcome_bonus",
    }));

    return res.json(notifications);
  } catch (error) {
    console.error("❌ Get notifications error:", error);
    return res.status(500).json({ message: "Server error" });
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
      RETURNING id
      `,
      [id, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("❌ Mark notification read error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
