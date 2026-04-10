const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const { 
  initiateLoginFeePayment, 
  verifyLoginFeePayment, 
  checkLoginFeeStatus,
  paymentWebhook 
} = require("../controllers/loginFee.controller");

router.post("/initiate", protect, initiateLoginFeePayment);
router.post("/verify", protect, verifyLoginFeePayment);
router.get("/status", protect, checkLoginFeeStatus);
router.post("/webhook", paymentWebhook);

module.exports = router;
