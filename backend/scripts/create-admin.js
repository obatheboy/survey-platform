require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

const ADMIN_PHONE = "+254794101450";
const ADMIN_PASSWORD = "Oba@1234";
const ADMIN_NAME = "System Administrator";
const ADMIN_EMAIL = "admin@surveyplatform.com";

async function createAdmin() {
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

    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️  Admin already exists:');
      console.log('   Phone:', existingAdmin.phone);
      console.log('   Name:', existingAdmin.full_name);
      console.log('   Email:', existingAdmin.email);
      console.log('   Status:', existingAdmin.status);
      await mongoose.disconnect();
      return;
    }

    // Check if phone already exists as regular user
    const existingUser = await User.findOne({ phone: ADMIN_PHONE });
    if (existingUser) {
      console.log('⚠️  Phone already registered as regular user. Promoting to admin...');
      existingUser.role = 'admin';
      existingUser.is_activated = true;
      existingUser.status = 'ACTIVE';
      existingUser.password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await existingUser.save();
      console.log('\n✅ Existing user promoted to admin!');
      console.log('   Phone:', ADMIN_PHONE);
      console.log('   Password:', ADMIN_PASSWORD);
      console.log('   Name:', existingUser.full_name);
      console.log('   Email:', existingUser.email);
      console.log('   ID:', existingUser._id);
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

createAdmin();