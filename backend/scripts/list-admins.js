require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function listAdmins() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI not set in .env');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    const admins = await User.find({ role: 'admin' }).select('phone full_name email created_at is_activated status');
    
    if (admins.length === 0) {
      console.log('❌ No admin accounts found in database');
    } else {
      console.log('\n📋 Admin accounts:');
      admins.forEach((a, i) => {
        console.log(`  ${i + 1}. Phone: ${a.phone} | Name: ${a.full_name} | Email: ${a.email} | Status: ${a.status} | Created: ${a.created_at?.toISOString?.()?.split('T')[0]}`);
      });
    }

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listAdmins();