# 📊 Complete Database Setup Guide

## 🔴 The Issue
Your Render PostgreSQL database is missing the `withdraw_requests` table (and possibly others).

---

## ✅ Complete Database Schema

Run this SQL on your Render database to create ALL required tables:

```sql
-- ==========================================
-- 1. USERS TABLE (should exist)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  is_activated BOOLEAN DEFAULT FALSE,
  total_earned DECIMAL(10, 2) DEFAULT 0,
  welcome_bonus DECIMAL(10, 2) DEFAULT 1200,
  welcome_bonus_received BOOLEAN DEFAULT FALSE,
  welcome_bonus_withdrawn BOOLEAN DEFAULT FALSE,
  plan VARCHAR(50) DEFAULT 'REGULAR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. USER_SURVEYS TABLE (survey completion)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_surveys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL,
  surveys_completed INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  is_activated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, plan)
);

-- ==========================================
-- 3. ACTIVATION_PAYMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS activation_payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL,
  mpesa_code VARCHAR(50) NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'SUBMITTED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. WITHDRAW_REQUESTS TABLE ⭐ CRITICAL
-- ==========================================
CREATE TABLE IF NOT EXISTS withdraw_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  fee DECIMAL(10, 2) NOT NULL DEFAULT 10,
  net_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'PROCESSING',
  type VARCHAR(50) DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_user_surveys_user_id ON user_surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_activation_payments_user_id ON activation_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_user_id ON withdraw_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_status ON withdraw_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_created ON withdraw_requests(created_at);

-- ✅ All tables created!
```

---

## 🎯 Step-by-Step on Render

### 1. Open Render Dashboard
Go to: https://dashboard.render.com

### 2. Find Your PostgreSQL Database
Click on your database name (e.g., "survey-platform-db")

### 3. Open Query Browser
- Click the **"Connect"** button
- Select the **"Browser"** tab (or use any PostgreSQL client)

### 4. Run the SQL
- Paste the complete SQL above
- Click **Execute**
- Wait for success message

### 5. Verify
Run this to confirm all tables exist:
```sql
\dt  -- Lists all tables
```

You should see:
- ✅ users
- ✅ user_surveys
- ✅ activation_payments
- ✅ withdraw_requests
- ✅ notifications

---

## 🧪 Test the Fix

After creating tables, test the withdrawal:

1. Go to your survey app
2. Complete 10 surveys
3. Go to **Withdraw** page
4. Enter amount and phone
5. Click **Submit**
6. ✅ Should work now! (no 500 error)

---

## ⚠️ If You Already Have Users

If your database already has users/surveys, they'll still be there. The `CREATE TABLE IF NOT EXISTS` ensures no data loss.

---

## 🔐 Important Notes

1. **do NOT delete** any existing tables
2. **Only CREATE** new ones that don't exist
3. **Backup** before making changes (Render does this automatically)
4. All tables have **proper relationships** (FOREIGN KEYS)
5. All tables have **indexes** for performance

---

## ✨ After Setup

Once tables are created:
- ✅ Users can register
- ✅ Users can complete surveys
- ✅ Users can request withdrawal
- ✅ Admin can approve withdrawals
- ✅ Everything works! 🎉

---

## 🆘 Troubleshooting

**Q: Still getting "table does not exist" error?**
A: Run this to check what tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

**Q: Foreign key error?**
A: Make sure `users` table exists and has same column types

**Q: Need to reset everything?**
A: Contact Render support to reset database, then run schema again

---

**Status: Ready to proceed!** 🚀
