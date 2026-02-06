const Notification = require("../models/Notification");

/* =====================================
   USER — GET MY NOTIFICATIONS
===================================== */
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(50)
      .lean(); // Convert to plain JavaScript objects

    // Optional: Highlight welcome bonus notification
    const formattedNotifications = notifications.map((notif) => ({
      id: notif._id,
      title: notif.title,
      message: notif.message,
      action_route: notif.action_route,
      is_read: notif.is_read,
      type: notif.type,
      created_at: notif.created_at,
      is_welcome_bonus: notif.type === "welcome_bonus",
    }));

    return res.json({
      success: true,
      count: formattedNotifications.length,
      notifications: formattedNotifications
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

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user_id: userId },
      { $set: { is_read: true } },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification not found" 
      });
    }

    return res.json({ 
      success: true, 
      message: "Notification marked as read",
      notification: {
        id: notification._id,
        title: notification.title,
        is_read: notification.is_read,
        type: notification.type
      }
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

    // Get count before deleting
    const countBefore = await Notification.countDocuments({ user_id: userId });

    if (countBefore === 0) {
      return res.json({
        success: true,
        message: "No notifications to clear",
        deletedCount: 0
      });
    }

    // Delete all notifications for this user
    const deleteResult = await Notification.deleteMany({ user_id: userId });

    return res.json({
      success: true,
      message: `Cleared ${deleteResult.deletedCount} notifications`,
      deletedCount: deleteResult.deletedCount
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

    const result = await Notification.findOneAndDelete({ 
      _id: id, 
      user_id: userId 
    });

    if (!result) {
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

/* =====================================
   HELPER: CREATE NOTIFICATION
   (For use in other controllers)
===================================== */
exports.createNotification = async (userId, notificationData) => {
  try {
    const notification = new Notification({
      user_id: userId,
      title: notificationData.title,
      message: notificationData.message,
      action_route: notificationData.action_route || '/dashboard',
      type: notificationData.type || 'system',
      ...notificationData
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error("❌ Create notification error:", error);
    return null;
  }
};

/* =====================================
   HELPER: CREATE WELCOME BONUS NOTIFICATION
===================================== */
exports.createWelcomeBonusNotification = async (userId) => {
  return await exports.createNotification(userId, {
    title: "🎉 Welcome Bonus Unlocked!",
    message: "You've received KES 1,200 as a welcome bonus. Activate your account to withdraw.",
    action_route: "/dashboard",
    type: "welcome_bonus"
  });
};