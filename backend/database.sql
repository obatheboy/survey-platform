-- ==========================================
-- SURVEY PLATFORM DATABASE SCHEMA
-- ==========================================
-- Run this SQL on your Render PostgreSQL database
-- ==========================================

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_activated BOOLEAN DEFAULT FALSE,
  total_earned DECIMAL(10, 2) DEFAULT 0,
  welcome_bonus DECIMAL(10, 2) DEFAULT 1200,
  welcome_bonus_received BOOLEAN DEFAULT FALSE,
  welcome_bonus_withdrawn BOOLEAN DEFAULT FALSE,
  plan VARCHAR(50) DEFAULT 'REGULAR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. USER_SURVEYS TABLE (Survey completion per plan)
-- ==========================================
CREATE TABLE IF NOT EXISTS user_surveys (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL,
  surveys_completed INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  is_activated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  status VARCHAR(50) DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. WITHDRAW_REQUESTS TABLE ✅ CRITICAL
-- ==========================================
CREATE TABLE IF NOT EXISTS withdraw_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  fee DECIMAL(10, 2) NOT NULL DEFAULT 10,
  net_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'PROCESSING' CHECK (status IN ('PROCESSING', 'APPROVED', 'REJECTED')),
  type VARCHAR(50) DEFAULT 'normal' CHECK (type IN ('normal', 'welcome_bonus', 'bonus')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Get user with full name and phone
CREATE TABLE IF NOT EXISTS withdraw_requests_view AS
SELECT 
  wr.*,
  u.full_name,
  u.email
FROM withdraw_requests wr
JOIN users u ON wr.user_id = u.id;

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
CREATE INDEX IF NOT EXISTS idx_activation_payments_status ON activation_payments(status);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_user_id ON withdraw_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_status ON withdraw_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_created ON withdraw_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- ==========================================
-- ✅ SCHEMA COMPLETE
-- ==========================================
-- All tables created successfully!
-- The withdraw_requests table is now ready for withdrawal requests.
