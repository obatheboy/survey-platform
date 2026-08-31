require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Notification = require('../src/models/Notification');
const ActivationPayment = require('../src/models/ActivationPayment');
const UserAchievement = require('../src/models/UserAchievement');

const DAYS_TO_KEEP = 7;

async function cleanupOldUsers() {
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

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_KEEP);

    console.log(`\n🧹 Deleting users older than ${DAYS_TO_KEEP} days (before ${cutoffDate.toISOString()})...\n`);

    const count = await User.countDocuments({
      created_at: { $lt: cutoffDate },
    });

    if (count === 0) {
      console.log('ℹ️  No users found older than 7 days.');
      await mongoose.disconnect();
      return;
    }

    console.log(`Found ${count.toLocaleString()} users to delete...`);

    const oldUsers = await User.find({
      created_at: { $lt: cutoffDate },
    }).select('_id').lean();

    const userIds = oldUsers.map(u => u._id);

    console.log('Deleting...');

    const [userResult, notifResult, paymentResult, achievementResult] = await Promise.all([
      User.deleteMany({ created_at: { $lt: cutoffDate } }),
      Notification.deleteMany({ user_id: { $in: userIds } }),
      ActivationPayment.deleteMany({ user_id: { $in: userIds } }),
      UserAchievement.deleteMany({ user_id: { $in: userIds } }),
    ]);

    console.log(`\n✅ Cleanup complete:`);
    console.log(`   - Users deleted: ${userResult.deletedCount.toLocaleString()}`);
    console.log(`   - Notifications deleted: ${notifResult.deletedCount.toLocaleString()}`);
    console.log(`   - Activation payments deleted: ${paymentResult.deletedCount.toLocaleString()}`);
    console.log(`   - User achievements deleted: ${achievementResult.deletedCount.toLocaleString()}`);

    const remaining = await User.countDocuments();
    console.log(`\n📊 Remaining users in database: ${remaining.toLocaleString()}`);

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected. Done.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupOldUsers();
