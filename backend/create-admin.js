const pool = require('./src/config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

/**
 * CREATE ADMIN USER SCRIPT
 * Run: node create-admin.js <phone> <password> <fullName>
 * Example: node create-admin.js 0712345678 mypassword123 "Admin User"
 */

const phone = process.argv[2];
const password = process.argv[3];
const fullName = process.argv[4];

if (!phone || !password || !fullName) {
  console.log('\n❌ Missing arguments!\n');
  console.log('Usage: node create-admin.js <phone> <password> <fullName>\n');
  console.log('Example: node create-admin.js 0712345678 mypassword123 "Admin User"\n');
  process.exit(1);
}

// Generate UUID v4
function generateUUID() {
  return crypto.randomUUID();
}

(async () => {
  try {
    console.log('\n🔐 Creating admin account...\n');

    // 1️⃣ Hash the password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 2️⃣ Generate a proper UUID
    const adminId = generateUUID();
    
    // 3️⃣ Create the admin user
    const result = await pool.query(
      `INSERT INTO users (id, full_name, email, phone, password_hash, role, is_activated, status)
       VALUES ($1, $2, $3, $4, $5, 'admin', true, 'ACTIVE')
       RETURNING id, full_name, phone, role`,
      [adminId, fullName, `admin-${Date.now()}@survey.local`, phone, hashedPassword]
    );

    if (result.rows.length > 0) {
      const admin = result.rows[0];
      console.log('✅ Admin account created successfully!\n');
      console.log('📋 Account Details:');
      console.log(`   Name: ${admin.full_name}`);
      console.log(`   Phone: ${admin.phone}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   ID: ${admin.id}\n`);
      console.log('🔑 Login with:');
      console.log(`   Phone: ${phone}`);
      console.log(`   Password: ${password}\n`);
    }

    process.exit(0);
  } catch (err) {
    if (err.message.includes('duplicate key')) {
      console.error('\n❌ Admin account with this phone already exists!\n');
    } else {
      console.error('\n❌ Error creating admin:', err.message, '\n');
    }
    process.exit(1);
  }
})();
