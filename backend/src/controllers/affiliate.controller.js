/* =========================================
   AFFILIATE SYSTEM CONTROLLER
   ========================================= */

const User = require("../models/User");

const REFERRAL_COMMISSION = 50; // KES 50 per successful referral

/* =========================================
   GENERATE UNIQUE REFERRAL CODE
   ========================================= */
function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/* =========================================
   GET AFFILIATE STATS
   ========================================= */
exports.getAffiliateStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get all referrals with their activation status
    const referrals = await User.find({ referred_by: userId })
      .select('full_name phone is_activated created_at plans')
      .lean();

    // Calculate metrics
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter(r => r.is_activated === true).length;
    const inactiveReferrals = totalReferrals - activeReferrals;
    
    // Calculate total earned from referrals
    const totalEarned = user.referral_commission_earned || 0;

    // Generate referral link
    const referralCode = user.referral_code || generateReferralCode();
    // Use the vercel deployment URL or fallback to environment variable
    const frontendUrl = process.env.FRONTEND_URL || 'https://survey-platform-three.vercel.app';
    const referralLink = `${frontendUrl}/auth?ref=${referralCode}`;

    // If user doesn't have a referral code, generate one
    if (!user.referral_code) {
      user.referral_code = referralCode;
      await user.save();
    }

    res.json({
      success: true,
      referral_code: referralCode,
      referral_link: referralLink,
      total_referrals: totalReferrals,
      active_referrals: activeReferrals,
      inactive_referrals: inactiveReferrals,
      amount_earned: totalEarned,
      commission_per_referral: REFERRAL_COMMISSION,
      referrals: referrals.map(r => ({
        id: r._id,
        name: r.full_name,
        phone: r.phone,
        is_activated: r.is_activated,
        joined_at: r.created_at
      }))
    });
  } catch (error) {
    console.error("Get affiliate stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================
   AWARD REFERRAL COMMISSION
   Called when a referred user gets activated
   ========================================= */
exports.awardReferralCommission = async (referredUserId) => {
  try {
    const referredUser = await User.findById(referredUserId);
    if (!referredUser || !referredUser.referred_by) {
      return { success: false, message: "No referrer found" };
    }

    const referrer = await User.findById(referredUser.referred_by);
    if (!referrer) {
      return { success: false, message: "Referrer not found" };
    }

    // Check if commission already awarded for this user
    const alreadyAwarded = referrer.referral_commissions?.some(
      c => c.referred_user_id?.toString() === referredUserId.toString()
    );

    if (alreadyAwarded) {
      return { success: false, message: "Commission already awarded" };
    }

    // Award commission
    referrer.referral_commission_earned = (referrer.referral_commission_earned || 0) + REFERRAL_COMMISSION;
    referrer.total_earned = (referrer.total_earned || 0) + REFERRAL_COMMISSION;

    // Add to commissions history
    if (!referrer.referral_commissions) {
      referrer.referral_commissions = [];
    }

    referrer.referral_commissions.push({
      referred_user_id: referredUser._id,
      referred_user_name: referredUser.full_name,
      amount: REFERRAL_COMMISSION,
      status: 'CREDITED',
      created_at: new Date()
    });

    await referrer.save();

    console.log(`✅ Referral commission of KES ${REFERRAL_COMMISSION} awarded to ${referrer.full_name} for referring ${referredUser.full_name}`);

    return { success: true, amount: REFERRAL_COMMISSION };
  } catch (error) {
    console.error("Award referral commission error:", error);
    return { success: false, error: error.message };
  }
};

/* =========================================
   VERIFY REFERRAL CODE
   Used during registration to validate
   ========================================= */
exports.verifyReferralCode = async (req, res) => {
  try {
    const { referral_code } = req.body;

    if (!referral_code) {
      return res.status(400).json({ valid: false, message: "Referral code required" });
    }

    const referrer = await User.findOne({ referral_code: referral_code.toUpperCase() });

    if (!referrer) {
      return res.status(404).json({ valid: false, message: "Invalid referral code" });
    }

    res.json({
      valid: true,
      referrer_name: referrer.full_name
    });
  } catch (error) {
    console.error("Verify referral code error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================
   REGISTER WITH REFERRAL
   Called during user registration
   ========================================= */
exports.registerWithReferral = async (userId, referralCode) => {
  try {
    if (!referralCode) {
      return { success: true, message: "No referral code provided" };
    }

    const referrer = await User.findOne({ referral_code: referralCode.toUpperCase() });
    if (!referrer) {
      return { success: true, message: "Invalid referral code, continuing without referral" };
    }

    // Update the new user's referred_by field
    const newUser = await User.findById(userId);
    if (!newUser) {
      return { success: false, message: "User not found" };
    }

    // Prevent self-referral
    if (referrer._id.toString() === newUser._id.toString()) {
      return { success: true, message: "Self-referral not allowed" };
    }

    newUser.referred_by = referrer._id;
    
    // Add to referrer's referrals array
    if (!referrer.referrals) {
      referrer.referrals = [];
    }
    referrer.referrals.push(newUser._id);
    
    await newUser.save();
    await referrer.save();

    console.log(`✅ User ${newUser.full_name} registered with referral code ${referralCode} from ${referrer.full_name}`);

    return { success: true, referrer_id: referrer._id };
  } catch (error) {
    console.error("Register with referral error:", error);
    return { success: false, error: error.message };
  }
};

/* =========================================
   ADMIN: GET ALL AFFILIATES
   Get all users with their referral data
   ========================================= */
exports.getAllAffiliates = async (req, res) => {
  try {
    // Get all users who have referrals or have been referred
    const affiliates = await User.find({
      $or: [
        { referral_code: { $exists: true, $ne: null } },
        { referred_by: { $exists: true, $ne: null } }
      ]
    })
    .select('full_name phone email referral_code referred_by referral_commission_earned referrals created_at')
    .populate('referrals', 'full_name phone is_activated created_at')
    .lean();

    // Transform data for admin view
    const transformedAffiliates = affiliates.map(affiliate => {
      const referralCount = affiliate.referrals?.length || 0;
      const activeReferrals = affiliate.referrals?.filter(r => r.is_activated === true).length || 0;
      
      return {
        id: affiliate._id,
        full_name: affiliate.full_name,
        phone: affiliate.phone,
        email: affiliate.email,
        referral_code: affiliate.referral_code,
        referral_count: referralCount,
        active_referrals: activeReferrals,
        commission_earned: affiliate.referral_commission_earned || 0,
        joined_at: affiliate.created_at,
        referrals_list: (affiliate.referrals || []).map(r => ({
          name: r.full_name,
          phone: r.phone,
          is_activated: r.is_activated,
          joined_at: r.created_at
        }))
      };
    });

    // Sort by commission earned (highest first)
    transformedAffiliates.sort((a, b) => b.commission_earned - a.commission_earned);

    res.json({
      success: true,
      total_affiliates: transformedAffiliates.length,
      total_commission_paid: transformedAffiliates.reduce((sum, a) => sum + a.commission_earned, 0),
      affiliates: transformedAffiliates
    });
  } catch (error) {
    console.error("Get all affiliates error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
