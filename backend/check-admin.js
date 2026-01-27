const pool = require('./src/config/db');

(async () => {
  try {
    // Check for admin users
    const result = await pool.query(
      'SELECT id, full_name, phone, role FROM users WHERE role = \'admin\''
    );
    
    console.log('\n📊 Admin users in database:');
    if (result.rows.length === 0) {
      console.log('❌ No admin users found!');
      console.log('\nYou need to create an admin account first.');
      console.log('1. Update an existing user to be admin, or');
      console.log('2. Create a new admin user account');
    } else {
      console.log('✅ Found admin users:');
      result.rows.forEach(admin => {
        console.log(`   - ${admin.full_name} (${admin.phone})`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Database error:', err.message);
    process.exit(1);
  }
})();
