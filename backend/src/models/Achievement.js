const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['surveys', 'earnings', 'referrals', 'withdrawals', 'streaks', 'special'],
    required: true
  },
  requirement: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['surveys_completed', 'total_earned', 'referrals_count', 'withdrawals_count', 'streak_days', 'special'],
    required: true
  },
  reward_bonus: {
    type: Number,
    default: 0
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    default: 'bronze'
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Static method to seed default achievements
achievementSchema.statics.seedAchievements = async function() {
  const defaultAchievements = [
    // Survey Achievements
    {
      name: "First Steps",
      description: "Complete your first survey",
      icon: "🎯",
      category: "surveys",
      requirement: 1,
      type: "surveys_completed",
      reward_bonus: 100,
      tier: "bronze"
    },
    {
      name: "Getting Started",
      description: "Complete 5 surveys",
      icon: "📝",
      category: "surveys",
      requirement: 5,
      type: "surveys_completed",
      reward_bonus: 250,
      tier: "bronze"
    },
    {
      name: "Survey Enthusiast",
      description: "Complete 10 surveys",
      icon: "📊",
      category: "surveys",
      requirement: 10,
      type: "surveys_completed",
      reward_bonus: 500,
      tier: "silver"
    },
    {
      name: "Survey Pro",
      description: "Complete 25 surveys",
      icon: "🏆",
      category: "surveys",
      requirement: 25,
      type: "surveys_completed",
      reward_bonus: 1000,
      tier: "gold"
    },
    {
      name: "Survey Master",
      description: "Complete 50 surveys",
      icon: "👑",
      category: "surveys",
      requirement: 50,
      type: "surveys_completed",
      reward_bonus: 2500,
      tier: "platinum"
    },
    {
      name: "Survey Legend",
      description: "Complete 100 surveys",
      icon: "🌟",
      category: "surveys",
      requirement: 100,
      type: "surveys_completed",
      reward_bonus: 5000,
      tier: "diamond"
    },
    // Earnings Achievements
    {
      name: "First Kobo",
      description: "Earn your first 500 KSh",
      icon: "💵",
      category: "earnings",
      requirement: 500,
      type: "total_earned",
      reward_bonus: 50,
      tier: "bronze"
    },
    {
      name: "Money Maker",
      description: "Earn 5,000 KSh total",
      icon: "💰",
      category: "earnings",
      requirement: 5000,
      type: "total_earned",
      reward_bonus: 300,
      tier: "silver"
    },
    {
      name: "Big Earner",
      description: "Earn 15,000 KSh total",
      icon: "💎",
      category: "earnings",
      requirement: 15000,
      type: "total_earned",
      reward_bonus: 750,
      tier: "gold"
    },
    {
      name: "Top Earner",
      description: "Earn 50,000 KSh total",
      icon: "🏦",
      category: "earnings",
      requirement: 50000,
      type: "total_earned",
      reward_bonus: 2000,
      tier: "platinum"
    },
    {
      name: "Millionaire",
      description: "Earn 100,000 KSh total",
      icon: "🚀",
      category: "earnings",
      requirement: 100000,
      type: "total_earned",
      reward_bonus: 5000,
      tier: "diamond"
    },
    // Referral Achievements
    {
      name: "First Referral",
      description: "Refer your first user",
      icon: "👥",
      category: "referrals",
      requirement: 1,
      type: "referrals_count",
      reward_bonus: 200,
      tier: "bronze"
    },
    {
      name: "Network Builder",
      description: "Refer 5 users",
      icon: "🤝",
      category: "referrals",
      requirement: 5,
      type: "referrals_count",
      reward_bonus: 750,
      tier: "silver"
    },
    {
      name: "Influencer",
      description: "Refer 15 users",
      icon: "🌐",
      category: "referrals",
      requirement: 15,
      type: "referrals_count",
      reward_bonus: 2000,
      tier: "gold"
    },
    {
      name: "Empire Builder",
      description: "Refer 50 users",
      icon: "🏰",
      category: "referrals",
      requirement: 50,
      type: "referrals_count",
      reward_bonus: 5000,
      tier: "platinum"
    },
    // Withdrawal Achievements
    {
      name: "First Cash Out",
      description: "Complete your first withdrawal",
      icon: "🏧",
      category: "withdrawals",
      requirement: 1,
      type: "withdrawals_count",
      reward_bonus: 100,
      tier: "bronze"
    },
    {
      name: "Regular Withdrawer",
      description: "Complete 10 withdrawals",
      icon: "💳",
      category: "withdrawals",
      requirement: 10,
      type: "withdrawals_count",
      reward_bonus: 500,
      tier: "silver"
    },
    // Streak Achievements
    {
      name: "3 Day Streak",
      description: "Complete surveys 3 days in a row",
      icon: "🔥",
      category: "streaks",
      requirement: 3,
      type: "streak_days",
      reward_bonus: 150,
      tier: "bronze"
    },
    {
      name: "Week Warrior",
      description: "Complete surveys 7 days in a row",
      icon: "⚡",
      category: "streaks",
      requirement: 7,
      type: "streak_days",
      reward_bonus: 350,
      tier: "silver"
    },
    {
      name: "Two Week Titan",
      description: "Complete surveys 14 days in a row",
      icon: "💪",
      category: "streaks",
      requirement: 14,
      type: "streak_days",
      reward_bonus: 700,
      tier: "gold"
    },
    {
      name: "Monthly Master",
      description: "Complete surveys 30 days in a row",
      icon: "🌙",
      category: "streaks",
      requirement: 30,
      type: "streak_days",
      reward_bonus: 1500,
      tier: "platinum"
    },
    // Special Achievements
    {
      name: "Early Bird",
      description: "Complete a survey within 1 hour of login",
      icon: "🐦",
      category: "special",
      requirement: 1,
      type: "special",
      reward_bonus: 100,
      tier: "bronze"
    },
    {
      name: "Night Owl",
      description: "Complete a survey after 10 PM",
      icon: "🦉",
      category: "special",
      requirement: 1,
      type: "special",
      reward_bonus: 100,
      tier: "bronze"
    }
  ];

  for (const achievement of defaultAchievements) {
    await this.findOneAndUpdate(
      { name: achievement.name },
      achievement,
      { upsert: true, new: true }
    );
  }
  
  console.log('✅ Achievements seeded successfully!');
};

module.exports = mongoose.model('Achievement', achievementSchema);
