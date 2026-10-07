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
    default: null
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
  login_fee_paid: {
    type: Boolean,
    default: false
  },
  welcome_bonus_paid: {
    type: Boolean,
    default: false
  },
  regular_paid: {
    type: Boolean,
    default: false
  },
  vip_paid: {
    type: Boolean,
    default: false
  },
  vvip_paid: {
    type: Boolean,
    default: false
  },
  account_activated: {
    type: Boolean,
    default: false
  },
  has_seen_welcome_popup: {
    type: Boolean,
    default: false
  },
  login_fee_paid_at: {
    type: Date
  },
  login_fee_pending: {
    mpesa_code: { type: String },
    amount: { type: Number, default: require("../config/fees").ACTIVATION_FEE },
    submitted_at: { type: Date },
    status: { 
      type: String, 
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    },
    approved_at: { type: Date },
    rejected_at: { type: Date },
    rejection_reason: { type: String }
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
  survey_onboarding_completed: {
    type: Boolean,
    default: false
  },
  survey_answers: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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
    },
    // The welcome bonus is a paid plan entry too. It must be declared here or
    // Mongoose strict mode silently drops it on save.
    WELCOME_BONUS: {
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
     },
     is_welcome_bonus: {
       type: Boolean,
       default: false
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
  },
  // ============================================
  // PROGRESSIVE PLAN PAYMENT FIELDS
  // ============================================
  plans_paid: {
    type: Map,
    of: Boolean,
    default: {}
  },
  all_plans_completed: {
    type: Boolean,
    default: false
  },
  // ============================================
  // POST-WITHDRAWAL TRACKING
  // ============================================
  withdrawal_submitted_at: {
    type: Date,
    default: null
  },
  withdrawal_status: {
    type: String,
    enum: ['none', 'pending', 'processing', 'completed', 'failed', 'SUBMITTED'],
    default: 'none'
  },
  // ============================================
  // CHATWAZUNGU — Premium Chat Platform
  // ============================================
  unlocked_profiles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  }],
  total_unlocks: {
    type: Number,
    default: 0
  },
  chat_earnings: {
    type: Number,
    default: 0
  },
  wallet_balance: {
    type: Number,
    default: 0
  },
  // ============================================
  // 🆕 SURVEY SYSTEM — 60 surveys, KES 450 each, 5/day limit
  // ============================================
  // The 60 surveys are hardcoded client-side as `survey-001`..`survey-060`,
  // so this holds string ids, not Survey ObjectIds. Typing it as ObjectId
  // threw a CastError on every completion and no earnings were ever credited.
  survey_categories_completed: [{
    type: String
  }],
  survey_completed_count: {
    type: Number,
    default: 0
  },
  daily_survey_date: {
    type: String,
    default: ""
  },
  daily_survey_count: {
    type: Number,
    default: 0
  },
  total_survey_earnings: {
    type: Number,
    default: 0
  },
  // ============================================
  // 🆕 WORK SYSTEM — articles, AI training, transcription, academic writing
  // ============================================
  // Task ids the user has already been PAID for (or auto-approved). This is
  // the idempotency guard: a task in here can never be submitted or paid
  // again. Tasks held for review live in work_pending_ids instead, so a
  // rejected submission can be retried.
  work_completed_ids: [{
    type: String
  }],
  // Task ids submitted and waiting on a human reviewer. A task appears in
  // exactly one of work_completed_ids or work_pending_ids at a time.
  work_pending_ids: [{
    type: String
  }],
  // Per-type daily counters, mirroring daily_survey_date/daily_survey_count.
  // All counts reset together when the date rolls over.
  work_daily_date: {
    type: String,
    default: ""
  },
  work_daily_counts: {
    type: Map,
    of: Number,
    default: {}
  },
  total_work_earnings: {
    type: Number,
    default: 0
  }
});

// ✅ ADDED: Update timestamp before saving
function generateReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

userSchema.pre('save', function(next) {
  if (this.isNew && !this.referral_code) {
    this.referral_code = generateReferralCode();
  }
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);
