/* eslint-disable no-undef */
const pool = require("../config/db");

/* ======================================================
   👑 ADMIN SESSION
   - Used by /api/admin/me
====================================================== */
const getAdminMe = async (req, res) => {
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
 * GET ALL USERS
 */
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        full_name,
        email,
        phone,
        role,
        status,
        is_activated,
        plan,
        surveys_completed,
        balance,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET SINGLE USER
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        full_name,
        email,
        phone,
        role,
        status,
        is_activated,
        plan,
        surveys_completed,
        balance,
        created_at
      FROM users
      WHERE id = $1
      `,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Admin get user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE USER STATUS
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate inputs
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!status || !["ACTIVE", "SUSPENDED"].includes(status.toUpperCase())) {
      return res.status(400).json({
        message: "Only ACTIVE or SUSPENDED allowed",
      });
    }

    const normalizedStatus = status.toUpperCase();
    
    const result = await pool.query(
      `
      UPDATE users
      SET status = $1
      WHERE id = $2
      RETURNING id, full_name, status
      `,
      [normalizedStatus, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User status updated",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Admin update status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE USER ROLE
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate inputs
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    if (!role || !["user", "admin"].includes(role.toLowerCase())) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const normalizedRole = role.toLowerCase();
    
    const result = await pool.query(
      `
      UPDATE users
      SET role = $1
      WHERE id = $2
      RETURNING id, full_name, role
      `,
      [normalizedRole, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User role updated",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Admin update role error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 🔓 ACTIVATE USER ACCOUNT
 */
const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET is_activated = TRUE
      WHERE id = $1
      RETURNING id, full_name, email, phone, is_activated
      `,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User activated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Admin activate user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 💰 MANUAL BALANCE ADJUSTMENT
 */
const adjustUserBalance = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    let { amount, type } = req.body;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
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
    
    await client.query("BEGIN");

    const userRes = await client.query(
      `
      SELECT balance
      FROM users
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (!userRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    let balance = Number(userRes.rows[0].balance);

    if (normalizedType === "DEBIT" && balance < amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ 
        message: "Insufficient balance", 
        currentBalance: balance,
        requestedDebit: amount 
      });
    }

    balance = normalizedType === "CREDIT" ? balance + amount : balance - amount;

    const update = await client.query(
      `
      UPDATE users
      SET balance = $1
      WHERE id = $2
      RETURNING id, full_name, balance
      `,
      [balance, id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Balance updated",
      user: update.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(rollbackError => {
      console.error("Rollback failed:", rollbackError);
    });
    console.error("Admin adjust balance error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/**
 * ❌ DELETE USER
 */
const deleteUser = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    await client.query("BEGIN");

    // Check if user exists
    const checkRes = await client.query(
      "SELECT id FROM users WHERE id = $1",
      [id]
    );

    if (!checkRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    // Delete user
    const result = await client.query(
      `
      DELETE FROM users
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    await client.query("COMMIT");

    res.json({ 
      message: "User deleted successfully",
      deletedId: result.rows[0]?.id 
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(rollbackError => {
      console.error("Rollback failed:", rollbackError);
    });
    console.error("Admin delete user error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/**
 * ❌ BULK DELETE USERS
 */
const deleteBulkUsers = async (req, res) => {
  const client = await pool.connect();
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "Invalid user IDs provided" });
    }

    // Validate all IDs are numbers
    const invalidIds = userIds.filter(id => isNaN(parseInt(id)));
    if (invalidIds.length > 0) {
      return res.status(400).json({ 
        message: "Invalid user IDs detected", 
        invalidIds 
      });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `
      DELETE FROM users
      WHERE id = ANY($1)
      RETURNING id
      `,
      [userIds]
    );

    await client.query("COMMIT");

    res.json({
      message: `${result.rowCount} users deleted successfully`,
      deletedCount: result.rowCount,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(rollbackError => {
      console.error("Rollback failed:", rollbackError);
    });
    console.error("Admin bulk delete users error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/* ======================================================
   📢 NOTIFICATIONS MANAGEMENT (ADMIN)
====================================================== */

/**
 * SEND BULK NOTIFICATION
 */
const sendBulkNotification = async (req, res) => {
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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Use a single, more efficient query to insert notifications for all users.
    const insertQuery = `
      INSERT INTO notifications (user_id, title, message, type, created_at)
      SELECT id, $1, $2, 'bulk', NOW() FROM users
      WHERE status = 'ACTIVE'
    `;
    const result = await client.query(insertQuery, [title.trim(), message.trim()]);

    await client.query('COMMIT');
    res.status(200).json({
      message: `Notification sent to ${result.rowCount} active users.`,
      sentCount: result.rowCount
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(rollbackError => {
      console.error("Rollback failed:", rollbackError);
    });
    console.error("Admin send bulk notification error:", error);
    res.status(500).json({ message: "Server error while sending notifications" });
  } finally {
    client.release();
  }
};

/* ======================================================
   📊 ADMIN DASHBOARD STATS
====================================================== */
const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsersRes,
      totalRevenueRes,
      totalWithdrawalsRes,
      pendingActivationsRes,
      pendingWithdrawalsRes,
      surveysCompletedRes,
      todayRevenueRes,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users`),
      pool.query(`SELECT SUM(amount) as total FROM activation_payments WHERE status = 'APPROVED'`),
      pool.query(`SELECT SUM(amount) as total FROM withdraw_requests WHERE status = 'APPROVED'`),
      pool.query(`SELECT COUNT(*) FROM activation_payments WHERE status = 'SUBMITTED'`),
      pool.query(`SELECT COUNT(*) FROM withdraw_requests WHERE status = 'PROCESSING'`),
      pool.query(`SELECT SUM(surveys_completed) as total FROM user_surveys`),
      pool.query(`SELECT SUM(amount) as total FROM activation_payments WHERE status = 'APPROVED' AND DATE(created_at) = CURRENT_DATE`),
    ]);

    res.json({
      totalUsers: Number(totalUsersRes.rows[0]?.count) || 0,
      totalRevenue: Number(totalRevenueRes.rows[0]?.total) || 0,
      totalWithdrawals: Number(totalWithdrawalsRes.rows[0]?.total) || 0,
      pendingActivations: Number(pendingActivationsRes.rows[0]?.count) || 0,
      pendingWithdrawals: Number(pendingWithdrawalsRes.rows[0]?.count) || 0,
      surveysCompleted: Number(surveysCompletedRes.rows[0]?.total) || 0,
      todayRevenue: Number(todayRevenueRes.rows[0]?.total) || 0,
      netProfit: (Number(totalRevenueRes.rows[0]?.total) || 0) - (Number(totalWithdrawalsRes.rows[0]?.total) || 0),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================================
   📤 EXPORT ALL FUNCTIONS
====================================================== */
module.exports = {
  getAdminMe,
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  activateUser,
  adjustUserBalance,
  deleteUser,
  deleteBulkUsers,
  sendBulkNotification,
  getAdminStats
};