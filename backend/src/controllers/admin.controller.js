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
 * GET ALL USERS - FIXED: active_plan undefined error (with pagination)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('full_name email phone is_activated total_earned welcome_bonus welcome_bonus_withdrawn plans status created_at')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedUsers = users.map(user => {
      let surveys_completed = 0;
      if (user.plans) {
        Object.values(user.plans).forEach(plan => {
          if (plan && typeof plan.surveys_completed === 'number') {
            surveys_completed += plan.surveys_completed;
          }
        });
      }

      let active_plan = null;
      if (user.plans) {
        const planKey = Object.keys(user.plans).find(plan =>
          user.plans[plan] && !user.plans[plan].is_activated
        );
        if (planKey) {
          active_plan = planKey;
        }
      }

      return {
        id: user._id.toString(),
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        is_activated: user.is_activated || false,
        status: user.status || 'ACTIVE',
        total_earned: user.total_earned || 0,
        welcome_bonus: user.welcome_bonus || 1200,
        welcome_bonus_withdrawn: user.welcome_bonus_withdrawn || false,
        surveys_completed: surveys_completed,
        active_plan: active_plan,
        created_at: user.created_at
      };
    });

    const totalUsers = await User.countDocuments();

    res.json({
      users: formattedUsers,
      page,
      limit,
      total: totalUsers,
      totalPages: Math.ceil(totalUsers / limit)
    });
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

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id)
      .select('full_name email phone is_activated total_earned welcome_bonus welcome_bonus_withdrawn plans activation_requests withdrawal_requests created_at')
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let totalSurveysCompleted = 0;
    if (user.plans) {
      for (const planKey in user.plans) {
        if (user.plans[planKey]) {
          totalSurveysCompleted += user.plans[planKey].surveys_completed || 0;
        }
      }
    }

    let active_plan = null;
    if (user.plans) {
      const planKey = Object.keys(user.plans).find(plan =>
        user.plans[plan] && !user.plans[plan].is_activated
      );
      if (planKey) {
        active_plan = planKey;
      }
    }

    const pendingActivations = user.activation_requests ?
      user.activation_requests.filter(req => req.status === 'SUBMITTED').length : 0;

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
      active_plan: active_plan,
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
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!status || !["ACTIVE", "SUSPENDED"].includes(status.toUpperCase())) {
      return res.status(400).json({
        message: "Only ACTIVE or SUSPENDED allowed",
      });
    }

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

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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

    const invalidIds = userIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        message: "Invalid user IDs detected",
        invalidIds
      });
    }

    const deleteResult = await User.deleteMany({ _id: { $in: userIds } });
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
 * SEND BULK NOTIFICATION (FIXED: batch processing to avoid memory issues)
 */
exports.sendBulkNotification = async (req, res) => {
  const { title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: "Title and message are required" });
  }

  if (title.length > 100) {
    return res.status(400).json({ message: "Title too long (max 100 chars)" });
  }

  if (message.length > 500) {
    return res.status(400).json({ message: "Message too long (max 500 chars)" });
  }

  try {
    const BATCH_SIZE = 1000;
    let sentCount = 0;
    let skip = 0;

    const totalActiveUsers = await User.countDocuments({
      $or: [{ status: { $ne: 'SUSPENDED' } }, { status: { $exists: false } }]
    });

    if (totalActiveUsers === 0) {
      return res.status(404).json({ message: "No active users found" });
    }

    while (skip < totalActiveUsers) {
      const activeUsers = await User.find({
        $or: [{ status: { $ne: 'SUSPENDED' } }, { status: { $exists: false } }]
      }).select('_id').skip(skip).limit(BATCH_SIZE);

      const notifications = activeUsers.map(user => ({
        user_id: user._id,
        title: title.trim(),
        message: message.trim(),
        type: 'bulk',
        created_at: new Date()
      }));

      const result = await Notification.insertMany(notifications);
      sentCount += result.length;
      skip += BATCH_SIZE;
    }

    res.status(200).json({
      message: `Notification sent to ${sentCount} active users.`,
      sentCount
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
   📊 ADMIN DASHBOARD STATS (FIXED: uses aggregation instead of loading all docs)
====================================================== */
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const totalRevenue = await User.aggregate([
      { $match: { activation_requests: { $exists: true, $ne: [] } } },
      { $unwind: { path: "$activation_requests", preserveNullAndEmptyArrays: true } },
      { $match: { "activation_requests.status": "APPROVED" } },
      { $group: { _id: null, sum: { $sum: "$activation_requests.amount" } } }
    ]);

    const todayRevenue = await User.aggregate([
      { $match: { activation_requests: { $exists: true, $ne: [] } } },
      { $unwind: { path: "$activation_requests", preserveNullAndEmptyArrays: true } },
      { $match: {
          "activation_requests.status": "APPROVED",
          "activation_requests.processed_at": { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      },
      { $group: { _id: null, sum: { $sum: "$activation_requests.amount" } } }
    ]);

    const pendingActivations = await User.aggregate([
      { $match: { activation_requests: { $exists: true, $ne: [] } } },
      { $unwind: { path: "$activation_requests", preserveNullAndEmptyArrays: true } },
      { $match: { "activation_requests.status": "SUBMITTED" } },
      { $count: "count" }
    ]);

    const surveysCompleted = await User.aggregate([
      { $group: { _id: null, sum: {
          $sum: {
            $add: [
              { $ifNull: ["$plans.REGULAR.surveys_completed", 0] },
              { $ifNull: ["$plans.VIP.surveys_completed", 0] },
              { $ifNull: ["$plans.VVIP.surveys_completed", 0] }
            ]
          }
        } } }
    ]);

    const totalWithdrawals = await User.aggregate([
      { $unwind: { path: "$withdrawal_requests", preserveNullAndEmptyArrays: true } },
      { $match: { "withdrawal_requests.status": "APPROVED" } },
      { $group: { _id: null, sum: { $sum: "$withdrawal_requests.amount" } } }
    ]);

    const pendingWithdrawals = await User.aggregate([
      { $unwind: { path: "$withdrawal_requests", preserveNullAndEmptyArrays: true } },
      { $match: { "withdrawal_requests.status": "PROCESSING" } },
      { $count: "count" }
    ]);

    const loginFeeApproved = await User.countDocuments({ login_fee_paid: true });
    const loginFeePending = await User.countDocuments({ "login_fee_pending.status": "PENDING" });

    res.json({
      totalUsers,
      totalRevenue: totalRevenue[0]?.sum || 0,
      totalWithdrawals: totalWithdrawals[0]?.sum || 0,
      pendingActivations: pendingActivations[0]?.count || 0,
      pendingWithdrawals: pendingWithdrawals[0]?.count || 0,
      surveysCompleted: surveysCompleted[0]?.sum || 0,
      todayRevenue: todayRevenue[0]?.sum || 0,
      netProfit: (totalRevenue[0]?.sum || 0) - (totalWithdrawals[0]?.sum || 0),
      loginFeeApproved,
      loginFeePending,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ❌ DELETE OLD USERS (OLDER THAN 30 DAYS)
 * DELETE /api/admin/cleanup/old-users?days=30
 */
exports.deleteOldUsers = async (req, res) => {
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

    const result = await User.deleteMany({
      created_at: { $lt: cutoffDate },
      status: { $ne: 'SUSPENDED' }
    });

    return res.json({
      success: true,
      message: `Deleted ${result.deletedCount} users older than ${days} days`,
      deletedCount: result.deletedCount,
      days
    });
  } catch (error) {
    console.error("❌ Admin delete old users error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error deleting old users"
    });
  }
};