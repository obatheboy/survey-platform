require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

const ADMIN_PHONE = "0794101450";
const ADMIN_PASSWORD = "Oba@1234";
const ADMIN_NAME = "System Administrator";
const ADMIN_EMAIL = "admin@surveyplatform.com";

async function recreateAdmin() {
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

    // Check if admin already exists
    const existing = await User.findOne({ phone: ADMIN_PHONE, role: 'admin' });
    if (existing) {
      console.log('ℹ️  Admin already exists with phone:', ADMIN_PHONE);
      console.log('   Name:', existing.full_name);
      console.log('   Email:', existing.email);
      await mongoose.disconnect();
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const admin = new User({
      full_name: ADMIN_NAME,
      phone: ADMIN_PHONE,
      email: ADMIN_EMAIL,
      password_hash: passwordHash,
      role: 'admin',
      is_activated: true,
      status: 'ACTIVE',
      created_at: new Date(),
    });

    await admin.save();

    console.log('\n✅ Admin account created successfully!');
    console.log('   Phone:', ADMIN_PHONE);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('   Name:', ADMIN_NAME);
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   ID:', admin._id);

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected. Done.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

recreateAdmin();