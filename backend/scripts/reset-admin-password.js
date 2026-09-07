require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

const ADMIN_PHONE = "0794101450";
const ADMIN_PASSWORD = "Oba@1234";

async function resetAdminPassword() {
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

    const admin = await User.findOne({ phone: ADMIN_PHONE, role: 'admin' });
    if (!admin) {
      console.log('❌ No admin found with phone:', ADMIN_PHONE);
      await mongoose.disconnect();
      return;
    }

    console.log('Found admin:', admin.full_name, '| email:', admin.email);

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    admin.password_hash = passwordHash;
    admin.status = 'ACTIVE';
    await admin.save();

    console.log('\n✅ Admin password reset successfully!');
    console.log('   Phone:', ADMIN_PHONE);
    console.log('   Password:', ADMIN_PASSWORD);
    console.log('   Name:', admin.full_name);
    console.log('   Email:', admin.email);
    console.log('   ID:', admin._id);

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected. Done.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();