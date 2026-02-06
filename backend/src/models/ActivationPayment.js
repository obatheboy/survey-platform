const mongoose = require('mongoose');

const activationPaymentSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['REGULAR', 'VIP', 'VVIP'],
    required: true
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
});

module.exports = mongoose.model('ActivationPayment', activationPaymentSchema);