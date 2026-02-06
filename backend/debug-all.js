const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function debugAll() {
  console.log('=== FULL DEBUG ===\n');
  
  // 1. Connect
  await mongoose.connect('mongodb+srv://zyron:obatheboy@survey-platform-cluster.dkb1wm6.mongodb.net/survey_platform_db?retryWrites=true&w=majority&appName=survey-platform-cluster');
  console.log('✅ Connected to MongoDB\n');
  
  const User = require('./src/models/User');
  
  // 2. Check admin
  console.log('1. CHECKING ADMIN IN DATABASE:');
  const admin = await User.findOne({ email: 'admin@survey.com' });
  
  if (!admin) {
    console.log('❌ Admin not found!');
    return;
  }
  
  console.log('✅ Admin exists:');
  console.log('   Email:', admin.email);
  console.log('   Phone:', admin.phone);
  console.log('   Role:', admin.role);
  console.log('   Password hash:', admin.password_hash?.substring(0, 30) + '...\n');
  
  // 3. Test password match
  console.log('2. TESTING PASSWORD MATCH:');
  const match = await bcrypt.compare('Admin123!', admin.password_hash);
  console.log('   "Admin123!" matches:', match);
  
  if (!match) {
    console.log('   ❌ PASSWORD DOES NOT MATCH!');
    console.log('   Let me generate a new hash...\n');
    
    const newHash = await bcrypt.hash('Admin123!', 10);
    console.log('   New hash:', newHash);
    
    // Update database
    admin.password_hash = newHash;
    await admin.save();
    console.log('   ✅ Updated password in database\n');
    
    // Verify again
    const newMatch = await bcrypt.compare('Admin123!', admin.password_hash);
    console.log('   New verification:', newMatch);
  }
  
  // 4. Check controller code
  console.log('\n3. CHECKING AUTH CODE:');
  console.log('   Controller should use: bcrypt.compare(password, user.password_hash)');
  console.log('   Phone should be: +254794101450');
  console.log('   Password should be: Admin123!\n');
  
  // 5. Simulate login
  console.log('4. SIMULATING LOGIN:');
  console.log('   Request body:');
  console.log('   {');
  console.log('     "phone": "+254794101450",');
  console.log('     "password": "Admin123!"');
  console.log('   }');
  
  await mongoose.disconnect();
  console.log('\n✅ Debug complete');
}

debugAll();