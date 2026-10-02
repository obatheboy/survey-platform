/**
 * =============================================================================
 * KIFARUPAY PAYMENT SERVICE - DISABLED
 * =============================================================================
 * This gateway has been disabled. Only MegaPay is active.
 * All functions return gateway disabled error.
 * =============================================================================
 */

const { PLAN_AMOUNTS, ACTIVATION_FEE, getPlanAmount, getPlanAmountByKey } = require("../config/fees");

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

module.exports = {
  initiateSTKPush,
  formatPhone,
  getPlanAmount,
  getPlanAmountByKey,
  ACTIVATION_FEE,
  PLAN_AMOUNTS
};