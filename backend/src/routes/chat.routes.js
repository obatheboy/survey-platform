const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const chatController = require('../controllers/chat.controller');

router.use(protect);

router.get('/profiles', chatController.getProfiles);
router.get('/profiles/:profileId', chatController.getProfile);
router.post('/profiles/:profileId/unlock', chatController.unlockProfile);
router.post('/profiles/:profileId/unlock/confirm', chatController.confirmUnlock);
router.get('/profiles/:profileId/chat', chatController.getChatMessages);
router.post('/profiles/:profileId/chat', chatController.sendChatMessage);
router.get('/stats', chatController.getUserStats);

module.exports = router;
