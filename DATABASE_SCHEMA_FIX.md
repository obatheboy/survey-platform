# 🔧 Database Schema Fix - Missing withdraw_requests Table

## ❌ The Problem
Error: `relation "withdraw_requests" does not exist`

This means the `withdraw_requests` table is missing from your Render PostgreSQL database.

---

## ✅ The Solution

### **Option 1: Using Render Dashboard (Easiest)**

1. Go to your Render PostgreSQL database dashboard
2. Click **"Connect"** → **"Browser"** tab
3. Paste this SQL and run it:

```sql
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

CREATE INDEX IF NOT EXISTS idx_withdraw_requests_user_id ON withdraw_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_status ON withdraw_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_created ON withdraw_requests(created_at);
```

4. Click **Execute**
5. ✅ Done! Table is created

---

### **Option 2: Using psql Command Line**

```bash
psql postgresql://[user]:[password]@[host]:[port]/[database] < CREATE_WITHDRAW_TABLE.sql
```

---

### **Option 3: Using pgAdmin**

1. Connect to your database in pgAdmin
2. Go to Query Tool
3. Run the SQL from Option 1
4. ✅ Done!

---

## 📋 What This Creates

The `withdraw_requests` table stores:
- `id` - Unique withdrawal request ID
- `user_id` - Which user made the request
- `phone_number` - M-Pesa phone number
- `amount` - Withdrawal amount
- `fee` - Transaction fee
- `net_amount` - Amount after fee
- `status` - PROCESSING / APPROVED / REJECTED
- `type` - normal / welcome_bonus / bonus
- `created_at` - When requested
- `updated_at` - Last update

---

## 🚀 After Creating the Table

1. User can submit withdrawal request ✅
2. Request stored in database ✅
3. Admin can view and approve ✅
4. User sees status updates ✅

---

## ✨ Quick Verification

After running the SQL, run this to verify:

```sql
SELECT * FROM withdraw_requests LIMIT 1;
```

If no error, the table exists and is ready! ✅
