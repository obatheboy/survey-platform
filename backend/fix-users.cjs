const mongoose = require('mongoose');
const path = require('path');

// Load .env from current directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./src/models/User');

const ACTIVATION_PLANS = ["REGULAR", "VIP", "VVIP"];

async function fixActivationStatus() {
  try {
    console.log('\n=== FIXING USER ACTIVATION STATUS ===\n');
    
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.log('Current directory:', __dirname);
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    const users = await User.find({
      $or: [
        { 'activation_requests.0': { $exists: true } },
        { 'plans.REGULAR.is_activated': true },
        { 'plans.VIP.is_activated': true },
        { 'plans.VVIP.is_activated': true }
      ]
    });
    
    console.log(`📊 Found ${users.length} users to check\n`);
    
    let fixedCount = 0;
    let allPlansPaidCount = 0;
    let allPlansManuallyActivatedCount = 0;
    
    for (const user of users) {
      const plans_paid = user.plans_paid || {};
      const plans = user.plans || {};
      
      const allPaid = ACTIVATION_PLANS.every(p => plans_paid[p] === true);
      const allManuallyActivated = ACTIVATION_PLANS.every(p => plans[p]?.is_activated === true);
      
      if (allPaid || allManuallyActivated) {
        if (!user.is_activated || !user.all_plans_completed) {
          user.is_activated = true;
          user.all_plans_completed = allPaid;
          if (!user.activated_at) {
            user.activated_at = new Date();
          }
          
          await user.save();
          fixedCount++;
          
          if (allPaid) allPlansPaidCount++;
          if (allManuallyActivated) allPlansManuallyActivatedCount++;
          
          console.log(`✅ Fixed: ${user.full_name} (${user.phone})`);
        }
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total users checked: ${users.length}`);
    console.log(`Users fixed: ${fixedCount}`);
    console.log(`  - All plans paid: ${allPlansPaidCount}`);
    console.log(`  - All plans manually activated: ${allPlansManuallyActivatedCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message, '\n');
    process.exit(1);
  }
}

fixActivationStatus();
