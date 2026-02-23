const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievement_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  progress: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  completed_at: {
    type: Date
  },
  reward_claimed: {
    type: Boolean,
    default: false
  },
  reward_claimed_at: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index to ensure one achievement per user
userAchievementSchema.index({ user_id: 1, achievement_id: 1 }, { unique: true });

// Static method to check and update user achievements
userAchievementSchema.statics.checkAchievements = async function(userId, type, currentValue) {
  const Achievement = mongoose.model('Achievement');
  
  // Find all achievements of this type that the user doesn't have completed
  const achievements = await Achievement.find({
    type: type,
    is_active: true
  });
  
  const results = [];
  
  for (const achievement of achievements) {
    // Check if user already has this achievement
    let userAchievement = await this.findOne({
      user_id: userId,
      achievement_id: achievement._id
    });
    
    if (!userAchievement) {
      // Create new user achievement
      userAchievement = await this.create({
        user_id: userId,
        achievement_id: achievement._id,
        progress: 0,
        completed: false
      });
    }
    
    // Update progress
    userAchievement.progress = currentValue;
    
    // Check if completed
    if (currentValue >= achievement.requirement && !userAchievement.completed) {
      userAchievement.completed = true;
      userAchievement.completed_at = new Date();
      await userAchievement.save();
      
      results.push({
        achievement: achievement,
        userAchievement: userAchievement,
        isNew: true
      });
    } else {
      await userAchievement.save();
    }
  }
  
  return results;
};

module.exports = mongoose.model('UserAchievement', userAchievementSchema);
