const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetAdmin() {
  console.log('Resetting admin password...');
  
  await mongoose.connect('mongodb+srv://zyron:obatheboy@survey-platform-cluster.dkb1wm6.mongodb.net/survey_platform_db?retryWrites=true&w=majority&appName=survey-platform-cluster');
  
  const User = require('./src/models/User');
  
  // Generate NEW hash with bcryptjs
  const newHash = await bcrypt.hash('Admin123!', 10);
  console.log('New hash:', newHash);
  
  // Update admin
  const result = await User.updateOne(
    { email: 'admin@survey.com' },
    { $set: { password_hash: newHash } }
  );
  
  console.log('Update result:', result);
  console.log('✅ Password reset to: Admin123!');
  
  // Verify
  const admin = await User.findOne({ email: 'admin@survey.com' });
  const match = await bcrypt.compare('Admin123!', admin.password_hash);
  console.log('Verification match:', match);
  
  await mongoose.disconnect();
}

resetAdmin();