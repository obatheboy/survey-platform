const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  action_route: {
    type: String,
    default: '/dashboard'
  },
  is_read: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['welcome_bonus', 'survey_completed', 'activation', 'withdrawal', 'system', 'promotion'],
    default: 'system'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
notificationSchema.index({ user_id: 1, created_at: -1 });
notificationSchema.index({ user_id: 1, is_read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);