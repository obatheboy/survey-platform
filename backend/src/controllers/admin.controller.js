/* eslint-disable no-undef */
const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");

/* ======================================================
   👑 ADMIN SESSION
   - Used by /api/admin/me
====================================================== */
exports.getAdminMe = async (req, res) => {
  try {
    res.json({
      id: req.admin.id,
      full_name: req.admin.full_name,
      role: "admin",
    });
  } catch (error) {
    console.error("Admin me error:", error);
    res.status(500).json({ message: "Failed to load admin session" });
  }
};

/* ======================================================
   👤 USERS MANAGEMENT (ADMIN)
====================================================== */

/**
 * GET ALL USERS - FIXED: active_plan undefined error
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('full_name email phone is_activated total_earned welcome_bonus welcome_bonus_withdrawn plans status created_at')
      .sort({ created_at: -1 })
      .lean();

    // Format the response - FIXED VERSION
    const formattedUsers = users.map(user => {
      // Calculate surveys completed
      let surveys_completed = 0;
      if (user.plans) {
        Object.values(user.plans).forEach(plan => {
          if (plan && typeof plan.surveys_completed === 'number') {
            surveys_completed += plan.surveys_completed;
          }
        });
      }

      // Get active plan - FIXED: Handle undefined properly
      let active_plan = null;
      if (user.plans) {
        const planKey = Object.keys(user.plans).find(plan => 
          user.plans[plan] && !user.plans[plan].is_activated
        );
        if (planKey) {
          active_plan = planKey; // Already uppercase like "REGULAR", "VIP", "VVIP"
        }
      }

      return {
        id: user._id.toString(),
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        is_activated: user.is_activated || false,
        status: user.status || 'ACTIVE', // Default status
        total_earned: user.total_earned || 0,
        welcome_bonus: user.welcome_bonus || 1200,
        welcome_bonus_withdrawn: user.welcome_bonus_withdrawn || false,
        surveys_completed: surveys_completed,
        active_plan: active_plan, // Now never undefined
        created_at: user.created_at
      };
    });

    res.json(formattedUsers);
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET SINGLE USER - FIXED: active_plan undefined error
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id)
      .select('full_name email phone is_activated total_earned welcome_bonus welcome_bonus_withdrawn plans activation_requests withdrawal_requests created_at')
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate total surveys completed
    let totalSurveysCompleted = 0;
    if (user.plans) {
      for (const planKey in user.plans) {
        if (user.plans[planKey]) {
          totalSurveysCompleted += user.plans[planKey].surveys_completed || 0;
        }
      }
    }

    // Get active plan - FIXED: Handle undefined
    let active_plan = null;
    if (user.plans) {
      const planKey = Object.keys(user.plans).find(plan => 
        user.plans[plan] && !user.plans[plan].is_activated
      );
      if (planKey) {
        active_plan = planKey;
      }
    }

    // Get pending activations count
    const pendingActivations = user.activation_requests ? 
      user.activation_requests.filter(req => req.status === 'SUBMITTED').length : 0;

    // Get pending withdrawals count
    const pendingWithdrawals = user.withdrawal_requests ? 
      user.withdrawal_requests.filter(req => ['PROCESSING', 'PENDING'].includes(req.status)).length : 0;

    res.json({
      id: user._id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      is_activated: user.is_activated,
      total_earned: user.total_earned || 0,
      welcome_bonus: user.welcome_bonus || 1200,
      welcome_bonus_withdrawn: user.welcome_bonus_withdrawn || false,
      surveys_completed: totalSurveysCompleted,
      active_plan: active_plan, // FIXED: Now never undefined
      pending_activations: pendingActivations,
      pending_withdrawals: pendingWithdrawals,
      plans: user.plans || {},
      created_at: user.created_at
    });
  } catch (error) {
    console.error("Admin get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE USER STATUS
 * Note: In MongoDB, we don't have a 'status' field in User model.
 * We'll add it or use is_activated field
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!status || !["ACTIVE", "SUSPENDED"].includes(status.toUpperCase())) {
      return res.status(400).json({
        message: "Only ACTIVE or SUSPENDED allowed",
      });
    }

    // For MongoDB, we'll store status in a new field
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { status: status.toUpperCase() } },
      { new: true, runValidators: true }
    ).select('full_name email status');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User status updated",
      user: {
        id: user._id,
        full_name: user.full_name,
        status: user.status
      },
    });
  } catch (error) {
    console.error("Admin update status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE USER ROLE
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!role || !["user", "admin"].includes(role.toLowerCase())) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const normalizedRole = role.toLowerCase();
    
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { role: normalizedRole } },
      { new: true, runValidators: true }
    ).select('full_name email role');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User role updated",
      user: {
        id: user._id,
        full_name: user.full_name,
        role: user.role
      },
    });
  } catch (error) {
    console.error("Admin update role error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 🔓 ACTIVATE USER ACCOUNT
 */
exports.activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: { is_activated: true } },
      { new: true, runValidators: true }
    ).select('full_name email phone is_activated');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User activated successfully",
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        is_activated: user.is_activated
      },
    });
  } catch (error) {
    console.error("Admin activate user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 💰 MANUAL BALANCE ADJUSTMENT
 */
exports.adjustUserBalance = async (req, res) => {
  try {
    const { id } = req.params;
    let { amount, type } = req.body;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    amount = Number(amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (!type || !["CREDIT", "DEBIT"].includes(type.toUpperCase())) {
      return res.status(400).json({ message: "Invalid action. Use CREDIT or DEBIT" });
    }

    const normalizedType = type.toUpperCase();
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentBalance = user.total_earned || 0;

    if (normalizedType === "DEBIT" && currentBalance < amount) {
      return res.status(400).json({ 
        message: "Insufficient balance", 
        currentBalance: currentBalance,
        requestedDebit: amount 
      });
    }

    const newBalance = normalizedType === "CREDIT" ? 
      currentBalance + amount : currentBalance - amount;

    user.total_earned = newBalance;
    await user.save();

    res.json({
      message: "Balance updated",
      user: {
        id: user._id,
        full_name: user.full_name,
        total_earned: user.total_earned
      },
    });
  } catch (error) {
    console.error("Admin adjust balance error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ❌ DELETE USER
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Also delete user's notifications
    await Notification.deleteMany({ user_id: id });

    res.json({ 
      message: "User deleted successfully",
      deletedId: user._id 
    });
  } catch (error) {
    console.error("Admin delete user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ❌ BULK DELETE USERS
 */
exports.deleteBulkUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "Invalid user IDs provided" });
    }

    // Validate all IDs are valid ObjectIds
    const invalidIds = userIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ 
        message: "Invalid user IDs detected", 
        invalidIds 
      });
    }

    // Delete users
    const deleteResult = await User.deleteMany({ _id: { $in: userIds } });

    // Delete their notifications
    await Notification.deleteMany({ user_id: { $in: userIds } });

    res.json({
      message: `${deleteResult.deletedCount} users deleted successfully`,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Admin bulk delete users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   📢 NOTIFICATIONS MANAGEMENT (ADMIN)
====================================================== */

/**
 * SEND BULK NOTIFICATION
 */
exports.sendBulkNotification = async (req, res) => {
  const { title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: "Title and message are required" });
  }

  // Validate length
  if (title.length > 100) {
    return res.status(400).json({ message: "Title too long (max 100 chars)" });
  }

  if (message.length > 500) {
    return res.status(400).json({ message: "Message too long (max 500 chars)" });
  }

  try {
    // Get all active users (users without suspended status)
    const activeUsers = await User.find({ 
      $or: [{ status: { $ne: 'SUSPENDED' } }, { status: { $exists: false } }] 
    }).select('_id');

    if (activeUsers.length === 0) {
      return res.status(404).json({ message: "No active users found" });
    }

    // Prepare notifications for batch insert
    const notifications = activeUsers.map(user => ({
      user_id: user._id,
      title: title.trim(),
      message: message.trim(),
      type: 'bulk',
      created_at: new Date()
    }));

    // Insert all notifications
    const result = await Notification.insertMany(notifications);

    res.status(200).json({
      message: `Notification sent to ${result.length} active users.`,
      sentCount: result.length
    });
  } catch (error) {
    console.error("Admin send bulk notification error:", error);
    res.status(500).json({ message: "Server error while sending notifications" });
  }
};

/* ======================================================
   🔔 NOTIFICATIONS MANAGEMENT (ADMIN - NEW)
====================================================== */

/**
 * GET ALL NOTIFICATIONS ACROSS ALL USERS
 * GET /api/admin/notifications
 */
exports.getAllNotifications = async (req, res) => {
  try {
    const { type, limit = 100, offset = 0 } = req.query;
    
    // Build query
    const query = {};
    if (type) {
      query.type = type;
    }
    
    const notifications = await Notification.find(query)
      .populate('user_id', 'full_name email')
      .sort({ created_at: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .lean();

    // Format response
    const formattedNotifications = notifications.map(notif => ({
      id: notif._id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      is_read: notif.is_read,
      created_at: notif.created_at,
      user_id: notif.user_id?._id,
      user_name: notif.user_id?.full_name || 'Unknown User',
      user_email: notif.user_id?.email || 'No email'
    }));
    
    // Get stats
    const totalCount = await Notification.countDocuments();
    const unreadCount = await Notification.countDocuments({ is_read: false });
    
    const typeStats = await Notification.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const stats = {
      total: totalCount,
      unread: unreadCount,
      byType: typeStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    };

    return res.json({
      success: true,
      count: formattedNotifications.length,
      notifications: formattedNotifications,
      stats
    });
  } catch (error) {
    console.error("❌ Admin get all notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching notifications"
    });
  }
};

/**
 * DELETE NOTIFICATION FOR ALL USERS
 * DELETE /api/admin/notifications/:id
 */
exports.deleteNotificationForAllUsers = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID"
      });
    }

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    return res.json({
      success: true,
      message: `Notification "${notification.title}" deleted successfully`,
      deletedNotification: {
        id: notification._id,
        title: notification.title,
        userId: notification.user_id
      }
    });
  } catch (error) {
    console.error("❌ Admin delete notification error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error deleting notification"
    });
  }
};

/**
 * DELETE NOTIFICATIONS BY TYPE
 * DELETE /api/admin/notifications/type/:type
 */
exports.deleteNotificationsByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!type || typeof type !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Invalid notification type"
      });
    }

    const result = await Notification.deleteMany({ type: type });

    return res.json({
      success: true,
      message: `Deleted ${result.deletedCount} notifications of type "${type}"`,
      deletedCount: result.deletedCount,
      type
    });
  } catch (error) {
    console.error("❌ Admin delete notifications by type error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error deleting notifications by type"
    });
  }
};

/**
 * DELETE OLD NOTIFICATIONS
 * DELETE /api/admin/notifications/cleanup?days=30
 */
exports.deleteOldNotifications = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    if (days < 1) {
      return res.status(400).json({
        success: false,
        message: "Days must be at least 1"
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await Notification.deleteMany({ 
      created_at: { $lt: cutoffDate } 
    });

    return res.json({
      success: true,
      message: `Deleted ${result.deletedCount} notifications older than ${days} days`,
      deletedCount: result.deletedCount,
      days
    });
  } catch (error) {
    console.error("❌ Admin delete old notifications error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error deleting old notifications"
    });
  }
};

/* ======================================================
   📊 ADMIN DASHBOARD STATS
====================================================== */
exports.getAdminStats = async (req, res) => {
  try {
    // Get all users count
    const totalUsers = await User.countDocuments();
    
    // Calculate total revenue from activation requests
    const allUsers = await User.find().select('activation_requests');
    let totalRevenue = 0;
    allUsers.forEach(user => {
      if (user.activation_requests) {
        user.activation_requests.forEach(activation => {
          if (activation.status === 'APPROVED') {
            totalRevenue += activation.amount || 0;
          }
        });
      }
    });
    
    // Calculate total withdrawals
    let totalWithdrawals = 0;
    let pendingWithdrawals = 0;
    allUsers.forEach(user => {
      if (user.withdrawal_requests) {
        user.withdrawal_requests.forEach(withdrawal => {
          if (withdrawal.status === 'APPROVED') {
            totalWithdrawals += withdrawal.amount || 0;
          } else if (withdrawal.status === 'PROCESSING') {
            pendingWithdrawals++;
          }
        });
      }
    });
    
    // Calculate pending activations
    let pendingActivations = 0;
    allUsers.forEach(user => {
      if (user.activation_requests) {
        pendingActivations += user.activation_requests.filter(
          req => req.status === 'SUBMITTED'
        ).length;
      }
    });
    
    // Calculate surveys completed
    let surveysCompleted = 0;
    allUsers.forEach(user => {
      if (user.plans) {
        for (const planKey in user.plans) {
          if (user.plans[planKey]) {
            surveysCompleted += user.plans[planKey].surveys_completed || 0;
          }
        }
      }
    });
    
    // Calculate today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let todayRevenue = 0;
    allUsers.forEach(user => {
      if (user.activation_requests) {
        user.activation_requests.forEach(activation => {
          if (activation.status === 'APPROVED' && activation.processed_at) {
            const activationDate = new Date(activation.processed_at);
            if (activationDate >= today) {
              todayRevenue += activation.amount || 0;
            }
          }
        });
      }
    });

    res.json({
      totalUsers,
      totalRevenue,
      totalWithdrawals,
      pendingActivations,
      pendingWithdrawals,
      surveysCompleted,
      todayRevenue,
      netProfit: totalRevenue - totalWithdrawals,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};