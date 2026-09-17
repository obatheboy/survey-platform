const mongoose = require('mongoose');
const User = require('../src/models/User');

mongoose.connect('mongodb+srv://zyron:obatheboy1234@survey-platform-cluster.dkb1wm6.mongodb.net/survey_platform_db?retryWrites=true&w=majority&appName=survey-platform-cluster')
  .then(async () => {
    // Find users with referral codes
    const usersWithCodes = await User.find({ referral_code: { $exists: true, $ne: null } })
      .select('full_name referral_code referred_by')
      .limit(20);
    console.log('=== Users with referral codes ===');
    console.log(JSON.stringify(usersWithCodes, null, 2));

    // Check for any user with referred_by set
    const referredUsers = await User.find({ referred_by: { $ne: null } })
      .select('full_name phone referred_by')
      .limit(20);
    console.log('\n=== Users with referred_by ===');
    console.log(JSON.stringify(referredUsers, null, 2));

    // Find the user with the code from the user's link
    const targetUser = await User.findOne({ referral_code: '2EV96QPB' })
      .select('full_name referral_code');
    console.log('\n=== User with code 2EV96QPB ===');
    console.log(JSON.stringify(targetUser, null, 2));

    mongoose.connection.close();
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
