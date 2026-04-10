const ActivationPayment = require("../models/ActivationPayment");

exports.createPaymentRequest = async (userId, phone, amount) => {
  const payment = new ActivationPayment({
    user_id: userId,
    phone,
    amount,
    status: "PENDING",
    payment_method: "M-PESA",
    type: "LOGIN_FEE"
  });
  await payment.save();
  return payment;
};

exports.updatePaymentStatus = async (paymentId, status, transactionId) => {
  const payment = await ActivationPayment.findById(paymentId);
  if (!payment) {
    throw new Error("Payment not found");
  }
  payment.status = status;
  if (transactionId) {
    payment.transaction_id = transactionId;
  }
  await payment.save();
  return payment;
};

exports.getPaymentByUserId = async (userId) => {
  return await ActivationPayment.findOne({ 
    user_id: userId, 
    type: "LOGIN_FEE" 
  }).sort({ createdAt: -1 });
};
