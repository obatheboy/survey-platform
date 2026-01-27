const pool = require('./src/config/db');
const bcrypt = require('bcrypt');

/**
 * ADMIN ACCOUNT SETUP SCRIPT
 * 
 * This script helps you create or verify admin accounts
 * Usage: node setup-admin.js
 */

(async () => {
  try {
    console.log('\n=== ADMIN ACCOUNT SETUP ===\n');

    // 1️⃣ Check existing admin users
    const checkAdmins = await pool.query(
      'SELECT id, full_name, phone, role FROM users WHERE role = \'admin\' LIMIT 5'
    );

    console.log(`📊 Found ${checkAdmins.rows.length} admin account(s):\n`);
    checkAdmins.rows.forEach(admin => {
      console.log(`   ✓ ${admin.full_name} - Phone: ${admin.phone}`);
    });

    if (checkAdmins.rows.length === 0) {
      console.log('\n⚠️  NO ADMIN ACCOUNTS FOUND!\n');
      console.log('To create an admin account, you have two options:\n');
      console.log('OPTION 1: Convert an existing user to admin');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('UPDATE users SET role = \'admin\' WHERE phone = \'07XXXXXXXX\';');
      console.log('\nOPTION 2: Create a new admin user');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Run this script: node create-admin.js\n');
    } else {
      console.log('\n✅ Admin accounts exist. Verify login with your credentials.\n');
    }

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message, '\n');
    process.exit(1);
  }
})();
