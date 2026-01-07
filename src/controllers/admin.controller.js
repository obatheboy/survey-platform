const pool = require("../config/db");

/* ======================================================
   👤 USERS MANAGEMENT (ADMIN)
====================================================== */

/**
 * GET ALL USERS
 */
exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, username, email, phone, role, status,
              locked_balance, available_balance, created_at
       FROM users
       ORDER BY created_at DESC`
    );

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
      `SELECT id, full_name, username, email, phone, role, status,
              locked_balance, available_balance, completed_surveys, created_at
       FROM users
       WHERE id = $1`,
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
 * ⚠️ Admin may SUSPEND or REACTIVATE only
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["ACTIVE", "SUSPENDED"];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: "Only ACTIVE or SUSPENDED allowed",
      });
    }

    if (Number(id) === req.user.id) {
      return res
        .status(403)
        .json({ message: "You cannot change your own status" });
    }

    const result = await pool.query(
      `UPDATE users
       SET status = $1
       WHERE id = $2
       RETURNING id, username, status`,
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

    if (Number(id) === req.user.id) {
      return res
        .status(403)
        .json({ message: "You cannot change your own role" });
    }

    const result = await pool.query(
      `UPDATE users
       SET role = $1
       WHERE id = $2
       RETURNING id, username, role`,
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
 * 💰 MANUAL BALANCE ADJUSTMENT (ADMIN TOOL)
 */
exports.adjustUserBalance = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    let { amount, type } = req.body;

    amount = Number(amount);

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (!["CREDIT", "DEBIT"].includes(type)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    await client.query("BEGIN");

    const userRes = await client.query(
      `SELECT available_balance FROM users WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (!userRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }

    let available = userRes.rows[0].available_balance;

    if (type === "DEBIT" && available < amount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Insufficient balance" });
    }

    available = type === "CREDIT"
      ? available + amount
      : available - amount;

    const update = await client.query(
      `UPDATE users
       SET available_balance = $1
       WHERE id = $2
       RETURNING id, username, available_balance`,
      [available, id]
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

    if (Number(id) === req.user.id) {
      return res.status(403).json({
        message: "You cannot delete yourself",
      });
    }

    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 RETURNING id`,
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

/* ======================================================
   📊 ADMIN DASHBOARD STATS
====================================================== */

exports.getAdminStats = async (req, res) => {
  try {
    const users = await pool.query(`SELECT COUNT(*) FROM users`);
    const activeUsers = await pool.query(
      `SELECT COUNT(*) FROM users WHERE status = 'ACTIVE'`
    );
    const pendingActivations = await pool.query(
      `SELECT COUNT(*) FROM activation_payments WHERE status = 'SUBMITTED'`
    );

    res.json({
      totalUsers: Number(users.rows[0].count),
      activeUsers: Number(activeUsers.rows[0].count),
      pendingActivations: Number(pendingActivations.rows[0].count),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
