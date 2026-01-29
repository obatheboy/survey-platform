const pool = require("../config/db");

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
 * GET ALL USERS
 */
exports.getAllUsers = async (req, res) => {
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
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

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
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "SUSPENDED"].includes(status)) {
      return res.status(400).json({
        message: "Only ACTIVE or SUSPENDED allowed",
      });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET status = $1
      WHERE id = $2
      RETURNING id, full_name, status
      `,
      [status, id]
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
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET role = $1
      WHERE id = $2
      RETURNING id, full_name, role
      `,
      [role, id]
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
exports.activateUser = async (req, res) => {
  try {
    const { id } = req.params;

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
exports.adjustUserBalance = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    let { amount, type } = req.body;

    amount = Number(amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (!["CREDIT", "DEBIT"].includes(type)) {
      return res.status(400).json({ message: "Invalid action" });
    }

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

    if (type === "DEBIT" && balance < amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Insufficient balance" });
    }

    balance = type === "CREDIT" ? balance + amount : balance - amount;

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
    await client.query("ROLLBACK");
    console.error("Admin adjust balance error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/**
 * ❌ DELETE USER
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM users
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ❌ BULK DELETE USERS
 */
exports.deleteBulkUsers = async (req, res) => {
  const client = await pool.connect();
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "Invalid user IDs provided" });
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
    await client.query("ROLLBACK");
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
exports.sendBulkNotification = async (req, res) => {
  const { title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: "Title and message are required" });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Use a single, more efficient query to insert notifications for all users.
    const insertQuery = `
      INSERT INTO notifications (user_id, title, message, type)
      SELECT id, $1, $2, 'bulk' FROM users
    `;
    const result = await client.query(insertQuery, [title, message]);

    await client.query('COMMIT');
    res.status(200).json({
      message: `Notification sent to ${result.rowCount} users.`,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Admin send bulk notification error:", error);
    res.status(500).json({ message: "Server error while sending notifications" });
  } finally {
    client.release();
  }
};

/* ======================================================
   � ADMIN DASHBOARD STATS
====================================================== */
exports.getAdminStats = async (req, res) => {
  try {
    const [
      totalUsersRes,
      totalRevenueRes,
      totalWithdrawalsRes,
      pendingActivationsRes,
      pendingWithdrawalsRes,
      surveysCompletedRes,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users`),
      pool.query(`SELECT SUM(amount) as total FROM activation_payments WHERE status = 'APPROVED'`),
      pool.query(`SELECT SUM(amount) as total FROM withdraw_requests WHERE status = 'APPROVED'`),
      pool.query(`SELECT COUNT(*) FROM activation_payments WHERE status = 'SUBMITTED'`),
      pool.query(`SELECT COUNT(*) FROM withdraw_requests WHERE status = 'PROCESSING'`),
      pool.query(`SELECT SUM(surveys_completed) as total FROM user_surveys`),
    ]);

    res.json({
      totalUsers: Number(totalUsersRes.rows[0].count) || 0,
      totalRevenue: Number(totalRevenueRes.rows[0].total) || 0,
      totalWithdrawals: Number(totalWithdrawalsRes.rows[0].total) || 0,
      pendingActivations: Number(pendingActivationsRes.rows[0].count) || 0,
      pendingWithdrawals: Number(pendingWithdrawalsRes.rows[0].count) || 0,
      surveysCompleted: Number(surveysCompletedRes.rows[0].total) || 0,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};