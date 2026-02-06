const mongoose = require('mongoose');

async function createAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    
    const MONGODB_URI = 'mongodb+srv://zyron:obatheboy@survey-platform-cluster.dkb1wm6.mongodb.net/survey_platform_db?retryWrites=true&w=majority&appName=survey-platform-cluster';
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get the User collection directly (bypass model middleware)
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: 'admin@survey.com' });
    
    if (existingAdmin) {
      console.log('✅ Admin already exists:');
      console.log('   Email:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
      console.log('   ID:', existingAdmin._id);
    } else {
      // Create admin directly in collection
      const adminData = {
        full_name: 'System Administrator',
        email: 'admin@survey.com',
        phone: '+254794101450',
        password_hash: '$2a$10$N9qo8uLOickgx2ZMRZoMye5aT6cZHQz7xHFnLw8q.6J5cY7aQdG0a', // Hash for "Admin123!"
        role: 'admin',
        is_activated: true,
        status: 'ACTIVE',
        total_earned: 0,
        welcome_bonus: 1200,
        welcome_bonus_withdrawn: false,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const result = await usersCollection.insertOne(adminData);
      
      console.log('✅ Admin created successfully!');
      console.log('📋 Login Details:');
      console.log('   Email: admin@survey.com');
      console.log('   Password: Admin123!');
      console.log('   Role: admin');
      console.log('   ID:', result.insertedId);
    }
    
    // List all admins
    const allAdmins = await usersCollection.find({ role: 'admin' }).toArray();
    console.log('\n📋 All Admin Users:', allAdmins.length);
    allAdmins.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.full_name})`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Done! Test login with:');
    console.log('   Email: admin@survey.com');
    console.log('   Password: Admin123!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

createAdmin();