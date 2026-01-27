-- ==========================================
-- CRITICAL: CREATE MISSING TABLES
-- ==========================================
-- Run this on your Render PostgreSQL database
-- ==========================================

-- Create withdraw_requests table if it doesn't exist
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_user_id ON withdraw_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_status ON withdraw_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_created ON withdraw_requests(created_at);

-- ✅ Done! The withdraw_requests table is now created.
