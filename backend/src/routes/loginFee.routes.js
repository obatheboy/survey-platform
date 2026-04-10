const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const { 
  initiateLoginFeePayment, 
  verifyLoginFeePayment, 
  checkLoginFeeStatus,
  paymentWebhook,
  submitManualPayment
} = require("../controllers/loginFee.controller");

router.post("/initiate", protect, initiateLoginFeePayment);
router.post("/verify", protect, verifyLoginFeePayment);
router.get("/status", protect, checkLoginFeeStatus);
router.post("/webhook", paymentWebhook);
router.post("/manual-submit", protect, submitManualPayment);

module.exports = router;
