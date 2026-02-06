const mongoose = require('mongoose');

async function check() {
  try {
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect('mongodb+srv://zyron:obatheboy@survey-platform-cluster.dkb1wm6.mongodb.net/survey_platform_db?retryWrites=true&w=majority&appName=survey-platform-cluster');
    
    console.log('Connected!');
    
    const User = require('./src/models/User');
    const admin = await User.findOne({email:'admin@survey.com'});
    
    if (!admin) {
      console.log('❌ NO ADMIN FOUND');
    } else {
      console.log('✅ ADMIN FOUND:');
      console.log('  Phone:', admin.phone);
      console.log('  Role:', admin.role);
      console.log('  Has password_hash:', !!admin.password_hash);
      console.log('  Password hash first 30 chars:', admin.password_hash?.substring(0, 30));
    }
    
    await mongoose.disconnect();
    console.log('Check complete.');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

check();