const express = require('express');
const router = express.Router();
const gamificationController = require('../controllers/gamification.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get user achievements
router.get('/achievements', gamificationController.getUserAchievements);

// Get leaderboard
router.get('/leaderboard', gamificationController.getLeaderboard);

// Check daily reward status
router.get('/daily-reward', gamificationController.checkDailyReward);

// Claim daily reward
router.post('/daily-reward/claim', gamificationController.claimDailyReward);

// Get user gamification stats
router.get('/stats', gamificationController.getUserStats);

// Seed achievements (admin only - can be called manually)
router.post('/seed-achievements', gamificationController.seedAchievements);

module.exports = router;
