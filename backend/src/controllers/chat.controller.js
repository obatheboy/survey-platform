const Profile = require('../models/Profile');
const User = require('../models/User');

const AI_RESPONSES = [
  "Hey there! I'm so excited to chat with you! What's on your mind today?",
  "Hello! I've been looking forward to our conversation. How are you doing?",
  "Hi there! I love meeting new people. Tell me, what brings you here?",
  "Greetings! I'm here and ready to chat. What would you like to talk about?",
  "Hey! I noticed you unlocked me - thank you! I'm curious about you now.",
  "Hello friend! I'm feeling chatty today. Want to share something about yourself?",
  "Hi! I'm really hoping we can have a meaningful conversation. Where should we start?",
  "Welcome! I'm always up for a good conversation. What's your favorite topic?",
  "Hey there! I'm new here and a bit nervous. Please be kind to me!",
  "Hello! I'm glad you chose to unlock me. I promise I'm interesting!",
  "Hi! I love deep conversations but also fun banter. Your choice!",
  "Greetings! I'm quite curious about the world. Let's explore ideas together.",
  "Hey! I'm here to listen. Sometimes it's nice to just talk, you know?",
  "Hello friend! I'm feeling social today. Let's have some fun chatting!",
  "Hi there! I'm looking for someone genuine. Are you here for real connection?",
  "Welcome! I believe in the power of conversation. Let's make some magic happen.",
  "Hey! I've been waiting for someone like you. Tell me something unique about yourself.",
  "Hello! I'm a bit of a talker but I also love listening. Your move!",
  "Hi! I noticed we both have things in common. Let's discover them together.",
  "Greetings! I'm here to brighten your day with great conversation. Ready?"
];

const getProfiles = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    const profiles = await Profile.find({}).lean();

    const unlockedSet = new Set(user.unlocked_profiles.map(p => p.toString()));

    const profilesWithStatus = profiles.map(p => ({
      ...p,
      id: p._id,
      _id: undefined,
      is_unlocked: unlockedSet.size > 0 && unlockedSet.has(p._id.toString())
    }));

    const shuffled = profilesWithStatus.sort(() => Math.random() - 0.5);

    res.json({
      profiles: shuffled,
      total_unlocks: user.total_unlocks,
      wallet_balance: user.wallet_balance
    });
  } catch (error) {
    console.error('Error fetching profiles:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
};

const getProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const userId = req.user._id;
    const user = await User.findById(userId);

    const profile = await Profile.findById(profileId).lean();

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const isUnlocked = user.unlocked_profiles.includes(profile._id);

    res.json({
      ...profile,
      id: profile._id,
      _id: undefined,
      is_unlocked: isUnlocked
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const unlockProfile = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { phone_number, plan } = req.body;
    const userId = req.user._id;

    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const megapayService = require('../services/megapay.service');

    const result = await megapayService.initiateSTKPush({
      phone_number: phone_number || req.user.phone,
      amount: 99,
      account_reference: `UNLOCK_${profileId}_${userId}`,
      transaction_description: `Unlock profile ${profile.name}`
    });

    res.json({
      message: 'STK push initiated for profile unlock',
      checkout_url: result.checkout_url,
      payment_reference: result.payment_reference,
      amount: 99,
      profile: {
        id: profile._id,
        name: profile.name,
        age: profile.age,
        location: profile.location
      }
    });
  } catch (error) {
    console.error('Error unlocking profile:', error);
    res.status(500).json({ error: 'Failed to initiate unlock payment' });
  }
};

const confirmUnlock = async (req, res) => {
  try {
    const { profileId, payment_reference, result_code } = req.body;
    const userId = req.user._id;

    if (result_code !== '200' && result_code !== 'Success' && result_code !== 'success') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    const profile = await Profile.findById(profileId);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const user = await User.findById(userId);

    if (user.unlocked_profiles.includes(profile._id)) {
      return res.json({
        message: 'Profile already unlocked',
        is_unlocked: true
      });
    }

    user.unlocked_profiles.push(profile._id);
    user.total_unlocks += 1;
    user.wallet_balance += 500;

    await user.save();

    res.json({
      message: 'Profile unlocked successfully',
      is_unlocked: true,
      total_unlocks: user.total_unlocks,
      wallet_balance: user.wallet_balance,
      earnings: 500
    });
  } catch (error) {
    console.error('Error confirming unlock:', error);
    res.status(500).json({ error: 'Failed to confirm unlock' });
  }
};

const getChatMessages = async (req, res) => {
  try {
    const { profileId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user.unlocked_profiles.includes(profileId)) {
      return res.status(403).json({ error: 'Profile not unlocked' });
    }

    const messages = [
      {
        role: "ai",
        content: AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)],
        message_id: Date.now().toString(),
        timestamp: new Date().toISOString()
      }
    ];

    res.json({
      messages,
      profile_id: profileId
    });
  } catch (error) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({ error: 'Failed to get chat messages' });
  }
};

const sendChatMessage = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user.unlocked_profiles.includes(profileId)) {
      return res.status(403).json({ error: 'Profile not unlocked' });
    }

    const profile = await Profile.findById(profileId);

    const aiResponse = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];

    res.json({
      user_message: {
        role: "user",
        content: message,
        message_id: (Date.now() + 1).toString(),
        timestamp: new Date().toISOString()
      },
      ai_response: {
        role: "ai",
        content: aiResponse,
        message_id: (Date.now() + 2).toString(),
        timestamp: new Date().toISOString()
      },
      profile_name: profile.name
    });
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    res.json({
      total_unlocks: user.total_unlocks,
      wallet_balance: user.wallet_balance,
      unlocked_profiles_count: user.unlocked_profiles.length,
      can_withdraw: user.total_unlocks >= 6
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
};

module.exports = {
  getProfiles,
  getProfile,
  unlockProfile,
  confirmUnlock,
  getChatMessages,
  sendChatMessage,
  getUserStats
};
