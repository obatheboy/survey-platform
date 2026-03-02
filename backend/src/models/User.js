const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  password_hash: {
    type: String,
    required: true
  },
  status: {  // ✅ ADDED: User status field
    type: String,
    enum: ['ACTIVE', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  role: {  // ✅ ADDED: User role field
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  is_activated: {
    type: Boolean,
    default: false
  },
  total_earned: {
    type: Number,
    default: 0
  },
  welcome_bonus: {
    type: Number,
    default: 1200
  },
  welcome_bonus_received: {
    type: Boolean,
    default: false
  },
  welcome_bonus_withdrawn: {
    type: Boolean,
    default: false
  },
  balance: {
    type: Number,
    default: 0
  },
  plan: {
    type: String,
    enum: ['REGULAR', 'VIP', 'VVIP'],
    default: 'REGULAR'
  },
  // ✅ Plans structure for surveys
  plans: {
    REGULAR: {
      surveys_completed: { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
      is_activated: { type: Boolean, default: false },
      total_surveys: { type: Number, default: 10 },
      activated_at: { type: Date }
    },
    VIP: {
      surveys_completed: { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
      is_activated: { type: Boolean, default: false },
      total_surveys: { type: Number, default: 10 },
      activated_at: { type: Date }
    },
    VVIP: {
      surveys_completed: { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
      is_activated: { type: Boolean, default: false },
      total_surveys: { type: Number, default: 10 },
      activated_at: { type: Date }
    }
  },
  // ✅ Activation requests array - ENUM RESTRICTION REMOVED
  activation_requests: [{
    plan: { 
      type: String, 
      required: true,
      trim: true,
      uppercase: true  // Convert to uppercase for consistency
    },
    mpesa_code: { 
      type: String, 
      required: true,
      trim: true 
    },
    amount: { 
      type: Number, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['SUBMITTED', 'APPROVED', 'REJECTED'],
      default: 'SUBMITTED' 
    },
    created_at: { 
      type: Date, 
      default: Date.now 
    },
    processed_at: { 
      type: Date 
    },
    admin_notes: { 
      type: String 
    }
  }],
  // ✅ Withdrawal requests array - FIXED: Added 'SUBMITTED' to enum
  withdrawal_requests: [{
    phone_number: { type: String, required: true },
    amount: { type: Number, required: true },
    fee: { type: Number, default: 0 },
    net_amount: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ['SUBMITTED', 'PENDING', 'PROCESSING', 'APPROVED', 'REJECTED', 'PAID'], // ✅ FIX: Added 'SUBMITTED'
      default: 'SUBMITTED'  // ✅ FIX: Changed default to 'SUBMITTED'
    },
    type: { 
      type: String, 
      enum: ['welcome_bonus', 'REGULAR', 'VIP', 'VVIP', 'balance', 'affiliate'],
      default: 'balance' 
    },
    created_at: { type: Date, default: Date.now },
    processed_at: { type: Date },
    transaction_id: { type: String }
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {  // ✅ ADDED: Updated at timestamp
    type: Date,
    default: Date.now
  },
  // ============================================
  // AFFILIATE SYSTEM FIELDS
  // ============================================
  referral_code: {
    type: String,
    unique: true,
    sparse: true
  },
  referred_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referral_commission_earned: {
    type: Number,
    default: 0
  },
  referrals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  referral_commissions: [{
    referred_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    referred_user_name: String,
    amount: { type: Number, default: 50 },
    status: { type: String, enum: ['PENDING', 'CREDITED'], default: 'CREDITED' },
    created_at: { type: Date, default: Date.now },
    from_activation: { type: Boolean, default: true }  // Track if from activation payment
  }],
  // ============================================
  // GAMIFICATION FIELDS
  // ============================================
  // Streak tracking
  current_streak: {
    type: Number,
    default: 0
  },
  longest_streak: {
    type: Number,
    default: 0
  },
  last_survey_date: {
    type: Date,
    default: null
  },
  // Daily rewards
  daily_reward_claimed: {
    type: Date,
    default: null
  },
  daily_reward_streak: {
    type: Number,
    default: 0
  },
  total_daily_rewards_claimed: {
    type: Number,
    default: 0
  },
  // Level and XP system
  level: {
    type: Number,
    default: 1
  },
  xp: {
    type: Number,
    default: 0
  },
  xp_to_next_level: {
    type: Number,
    default: 100
  },
  // Total stats for achievements
  total_surveys_completed: {
    type: Number,
    default: 0
  },
  total_withdrawals_completed: {
    type: Number,
    default: 0
  }
});

// ✅ ADDED: Update timestamp before saving
userSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);