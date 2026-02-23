const User = require('../models/User');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');

// Daily reward configuration
const DAILY_REWARDS = [
  { day: 1, reward: 50, xp: 10 },
  { day: 2, reward: 75, xp: 15 },
  { day: 3, reward: 100, xp: 20 },
  { day: 4, reward: 125, xp: 25 },
  { day: 5, reward: 150, xp: 30 },
  { day: 6, reward: 200, xp: 40 },
  { day: 7, reward: 300, xp: 50 } // Weekly bonus
];

// XP required per level (increases by 50 each level)
const getXpForLevel = (level) => 100 + (level - 1) * 50;

// Get user achievements with progress
exports.getUserAchievements = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userAchievements = await UserAchievement.find({ user_id: userId })
      .populate('achievement_id')
      .sort({ completed: -1, completed_at: -1 });
    
    // Get all achievements to show progress for ones not yet started
    const allAchievements = await Achievement.find({ is_active: true });
    
    // Combine and format
    const achievements = allAchievements.map(achievement => {
      const userAch = userAchievements.find(
        ua => ua.achievement_id._id.toString() === achievement._id.toString()
      );
      
      return {
        _id: achievement._id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        requirement: achievement.requirement,
        type: achievement.type,
        reward_bonus: achievement.reward_bonus,
        tier: achievement.tier,
        progress: userAch ? userAch.progress : 0,
        completed: userAch ? userAch.completed : false,
        completed_at: userAch ? userAch.completed_at : null,
        reward_claimed: userAch ? userAch.reward_claimed : false
      };
    });
    
    res.json({ achievements });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { type = 'earnings', limit = 10 } = req.query;
    
    let sortField;
    switch (type) {
      case 'surveys':
        sortField = { total_surveys_completed: -1 };
        break;
      case 'streaks':
        sortField = { longest_streak: -1 };
        break;
      case 'referrals':
        sortField = { 'referrals.length': -1 };
        break;
      default:
        sortField = { total_earned: -1 };
    }
    
    const users = await User.find({ role: 'user', is_activated: true })
      .select('full_name total_earned total_surveys_completed current_streak referrals level xp')
      .sort(sortField)
      .limit(parseInt(limit));
    
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      name: user.full_name,
      total_earned: user.total_earned,
      total_surveys: user.total_surveys_completed || 0,
      current_streak: user.current_streak || 0,
      referrals: user.referrals ? user.referrals.length : 0,
      level: user.level || 1,
      xp: user.xp || 0
    }));
    
    // Add current user's rank if not in top
    const userId = req.user?.id;
    if (userId) {
      const currentUser = await User.findById(userId).select('full_name total_earned total_surveys_completed current_streak referrals level xp');
      const userRank = await User.countDocuments({
        role: 'user',
        is_activated: true,
        [type === 'earnings' ? 'total_earned' : type === 'surveys' ? 'total_surveys_completed' : type === 'streaks' ? 'current_streak' : 'referrals']: 
          { $gt: type === 'earnings' ? currentUser.total_earned : type === 'surveys' ? currentUser.total_surveys_completed : type === 'streaks' ? currentUser.current_streak : currentUser.referrals.length }
      });
      
      const userEntry = {
        rank: userRank + 1,
        name: currentUser.full_name,
        total_earned: currentUser.total_earned,
        total_surveys: currentUser.total_surveys_completed || 0,
        current_streak: currentUser.current_streak || 0,
        referrals: currentUser.referrals ? currentUser.referrals.length : 0,
        level: currentUser.level || 1,
        xp: currentUser.xp || 0,
        isCurrentUser: true
      };
      
      // Check if user is not already in leaderboard
      if (!leaderboard.find(u => u.isCurrentUser)) {
        leaderboard.push(userEntry);
      }
    }
    
    res.json({ leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Claim daily reward
exports.claimDailyReward = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user can claim daily reward
    const now = new Date();
    const lastClaimed = user.daily_reward_claimed;
    
    if (lastClaimed) {
      const lastClaimedDate = new Date(lastClaimed);
      const daysSinceLastClaim = Math.floor((now - lastClaimedDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastClaim === 0) {
        return res.status(400).json({ message: 'You have already claimed your daily reward today!' });
      }
      
      // If more than 1 day, reset streak
      if (daysSinceLastClaim > 1) {
        user.daily_reward_streak = 0;
      }
    }
    
    // Calculate reward based on streak
    const streak = user.daily_reward_streak;
    const rewardIndex = Math.min(streak, DAILY_REWARDS.length - 1);
    const reward = DAILY_REWARDS[rewardIndex];
    
    // Update user
    user.balance += reward.reward;
    user.xp += reward.xp;
    user.daily_reward_claimed = now;
    user.daily_reward_streak += 1;
    user.total_daily_rewards_claimed += 1;
    
    // Check for level up
    let leveledUp = false;
    while (user.xp >= user.xp_to_next_level) {
      user.xp -= user.xp_to_next_level;
      user.level += 1;
      user.xp_to_next_level = getXpForLevel(user.level);
      leveledUp = true;
    }
    
    await user.save();
    
    // Check achievements
    await checkStreakAchievements(userId, user.daily_reward_streak);
    await checkEarningsAchievements(userId, user.total_earned);
    
    res.json({
      message: 'Daily reward claimed!',
      reward: reward.reward,
      xp_gained: reward.xp,
      new_balance: user.balance,
      streak: user.daily_reward_streak,
      level: user.level,
      xp: user.xp,
      xp_to_next_level: user.xp_to_next_level,
      leveled_up: leveledUp
    });
  } catch (error) {
    console.error('Claim daily reward error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user can claim daily reward
exports.checkDailyReward = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const now = new Date();
    const lastClaimed = user.daily_reward_claimed;
    
    let canClaim = false;
    let nextClaimTime = null;
    
    if (!lastClaimed) {
      canClaim = true;
    } else {
      const lastClaimedDate = new Date(lastClaimed);
      const daysSinceLastClaim = Math.floor((now - lastClaimedDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastClaim >= 1) {
        canClaim = true;
      } else {
        // Calculate next claim time (midnight)
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        nextClaimTime = tomorrow;
      }
    }
    
    const streak = user.daily_reward_streak;
    const nextReward = DAILY_REWARDS[Math.min(streak, DAILY_REWARDS.length - 1)];
    
    res.json({
      can_claim: canClaim,
      next_claim_time: nextClaimTime,
      current_streak: streak,
      next_reward: nextReward,
      level: user.level,
      xp: user.xp,
      xp_to_next_level: user.xp_to_next_level
    });
  } catch (error) {
    console.error('Check daily reward error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user streak (called when survey is completed)
exports.updateStreak = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return null;
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (user.last_survey_date) {
      const lastDate = new Date(user.last_survey_date);
      const lastDateOnly = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
      
      const daysDiff = Math.floor((today - lastDateOnly) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Already completed today, no streak change
        return user;
      } else if (daysDiff === 1) {
        // Consecutive day, increment streak
        user.current_streak += 1;
      } else {
        // Streak broken, reset
        user.current_streak = 1;
      }
    } else {
      // First survey
      user.current_streak = 1;
    }
    
    user.last_survey_date = now;
    
    // Update longest streak if needed
    if (user.current_streak > user.longest_streak) {
      user.longest_streak = user.current_streak;
    }
    
    await user.save();
    
    return user;
  } catch (error) {
    console.error('Update streak error:', error);
    return null;
  }
};

// Add XP to user
exports.addXp = async (userId, amount) => {
  try {
    const user = await User.findById(userId);
    if (!user) return null;
    
    user.xp += amount;
    
    // Check for level up
    let leveledUp = false;
    while (user.xp >= user.xp_to_next_level) {
      user.xp -= user.xp_to_next_level;
      user.level += 1;
      user.xp_to_next_level = getXpForLevel(user.level);
      leveledUp = true;
    }
    
    await user.save();
    
    return { user, leveledUp };
  } catch (error) {
    console.error('Add XP error:', error);
    return null;
  }
};

// Check and award achievements
async function checkSurveyAchievements(userId, surveysCompleted) {
  const results = await UserAchievement.checkAchievements(userId, 'surveys_completed', surveysCompleted);
  
  if (results.length > 0) {
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    for (const result of results) {
      user.balance += result.achievement.reward_bonus;
    }
    
    await user.save();
  }
  
  return results;
}

async function checkEarningsAchievements(userId, totalEarned) {
  return await UserAchievement.checkAchievements(userId, 'total_earned', totalEarned);
}

async function checkStreakAchievements(userId, streakDays) {
  const results = await UserAchievement.checkAchievements(userId, 'streak_days', streakDays);
  
  if (results.length > 0) {
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    for (const result of results) {
      user.balance += result.achievement.reward_bonus;
    }
    
    await user.save();
  }
  
  return results;
}

async function checkReferralAchievements(userId, referralsCount) {
  return await UserAchievement.checkAchievements(userId, 'referrals_count', referralsCount);
}

async function checkWithdrawalAchievements(userId, withdrawalsCount) {
  return await UserAchievement.checkAchievements(userId, 'withdrawals_count', withdrawalsCount);
}

// Get user stats for gamification
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      level: user.level || 1,
      xp: user.xp || 0,
      xp_to_next_level: user.xp_to_next_level || 100,
      current_streak: user.current_streak || 0,
      longest_streak: user.longest_streak || 0,
      total_surveys_completed: user.total_surveys_completed || 0,
      daily_reward_streak: user.daily_reward_streak || 0,
      total_daily_rewards_claimed: user.total_daily_rewards_claimed || 0,
      total_earned: user.total_earned || 0,
      balance: user.balance || 0
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Seed achievements (admin endpoint)
exports.seedAchievements = async (req, res) => {
  try {
    await Achievement.seedAchievements();
    res.json({ message: 'Achievements seeded successfully!' });
  } catch (error) {
    console.error('Seed achievements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = exports;
