/**
 * FULL RESET script - clears ALL stale payment/activation data.
 * Run this ONCE to reset DB to clean state before using new bank account flow.
 */

require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function fullReset() {
  try {
    console.log('\n=== FULL ACTIVATION RESET ===\n');
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Reset ALL payment and activation flags for ALL users
    // Only keep welcome_bonus_paid if it was legitimately earned
    const result = await User.updateMany(
      {},
      {
        $set: {
          'plans_paid': {},
          'regular_paid': false,
          'vip_paid': false,
          'vvip_paid': false,
          'account_activated': false,
          'all_plans_completed': false,
          'is_activated': false,
          'activated_at': null,
          'activated_by': null,
          'welcome_bonus_paid': false,
          'welcome_bonus_received': false,
          'payment_method': null,
          'last_payment_reference': null,
          'last_payment_plan': null,
        },
        $unset: {
          'activation_requests': ''
        }
      }
    );

    // Also reset plans.is_activated and activated_at in subdocument
    const users = await User.find({}, { plans: 1, full_name: 1, phone: 1 });
    let planFixed = 0;
    for (const user of users) {
      let changed = false;
      ['REGULAR', 'VIP', 'VVIP', 'WELCOME_BONUS'].forEach(planKey => {
        if (user.plans?.[planKey]) {
          if (user.plans[planKey].is_activated === true) {
            user.plans[planKey].is_activated = false;
            changed = true;
          }
          if (user.plans[planKey].activated_at) {
            user.plans[planKey].activated_at = null;
            changed = true;
          }
          if (user.plans[planKey].completed === true && planKey !== 'WELCOME_BONUS') {
            user.plans[planKey].completed = false;
            user.plans[planKey].surveys_completed = 0;
            changed = true;
          }
        }
      });
      if (changed) {
        await user.save();
        planFixed++;
        console.log(`  Reset plans for: ${user.full_name} (${user.phone})`);
      }
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Users reset: ${result.modifiedCount}`);
    console.log(`Users with plans reset: ${planFixed}`);
    console.log('\n✅ DB is now clean. Old Till/test payments have been wiped.\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message, '\n');
    process.exit(1);
  }
}

fullReset();