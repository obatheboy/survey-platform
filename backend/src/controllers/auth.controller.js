exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const result = await pool.query(
      `
      SELECT id, phone, password_hash, is_activated
      FROM users
      WHERE phone = $1
      `,
      [phone]
    );

    if (!result.rows.length) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ SET COOKIE (RENDER SAFE)
    res.cookie("token", token, COOKIE_OPTIONS);

    // ---------------------------
    // 🌟 WELCOME BONUS NOTIFICATION
    // ---------------------------
    // Check if user already has a welcome bonus notification
    const notifCheck = await pool.query(
      `
      SELECT id FROM notifications
      WHERE user_id = $1 AND type = 'welcome_bonus'
      `,
      [user.id]
    );

    if (!notifCheck.rows.length) {
      // Insert notification
      await pool.query(
        `
        INSERT INTO notifications (user_id, title, message, action_route, is_read, type, created_at)
        VALUES ($1, $2, $3, $4, false, 'welcome_bonus', NOW())
        `,
        [
          user.id,
          "🎉 Welcome Bonus Unlocked!",
          "You’ve received KES 1,200 as a welcome bonus. Withdraw it now to M-Pesa!",
          "/dashboard"
        ]
      );
    }
    // ---------------------------

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        phone: user.phone,
        is_activated: user.is_activated,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
