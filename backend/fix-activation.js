/**
 * Script to fix existing users:
 * - Set is_activated and all_plans_completed to true for users who have paid for all three plans (REGULAR, VIP, VVIP)
 * - Also set is_activated to true for users who have manually activated all three plans
 */

require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./src/models/User');

const ACTIVATION_PLANS = ["REGULAR", "VIP", "VVIP"];

async function fixActivationStatus() {
  try {
    console.log('\n=== FIXING USER ACTIVATION STATUS ===\n');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    // Find all users with at least one activation request
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
          user.all_plans_completed = allPaid; // all_plans_completed reflects payment status
          if (!user.activated_at) {
            user.activated_at = new Date();
          }
          
          await user.save();
          fixedCount++;
          
          if (allPaid) allPlansPaidCount++;
          if (allManuallyActivated) allPlansManuallyActivatedCount++;
          
          console.log(`✅ Fixed: ${user.full_name} (${user.phone}) - is_activated: ${allPaid || allManuallyActivated}`);
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