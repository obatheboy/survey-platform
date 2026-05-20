/**
 * =============================================================================
 * KIFARUPAY PAYMENT SERVICE - DISABLED
 * =============================================================================
 * This gateway has been disabled. Only MegaPay is active.
 * All functions return gateway disabled error.
 * =============================================================================
 */

const PLAN_AMOUNTS = {
  WELCOME_BONUS: 100,
  REGULAR: 100,
  VIP: 200,
  VVIP: 300
};

const initiateSTKPush = async () => {
  return {
    success: false,
    message: "Payment gateway disabled. Please use MegaPay instead.",
    gateway: "DISABLED"
  };
};

const formatPhone = (phone) => {
  return phone;
};

const getPlanAmount = () => {
  return PLAN_AMOUNTS.REGULAR;
};

const getPlanAmountByKey = () => {
  return null;
};

module.exports = {
  initiateSTKPush,
  formatPhone,
  getPlanAmount,
  getPlanAmountByKey,
  PLAN_AMOUNTS
};