const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const { 
  initiateLoginFeePayment, 
  checkLoginFeeStatus,
  manualApprovePayment,
  getPendingPayments,
  verifyWithPaystack
} = require("../controllers/loginFee.controller");

// ✅ STK PUSH ENDPOINT - User initiates payment, receives STK on phone
router.post("/initiate", protect, initiateLoginFeePayment);

// ✅ CHECK STATUS - User can check if they've been approved
router.get("/status", protect, checkLoginFeeStatus);

// ✅ ADMIN ENDPOINTS - For manual approval after verifying in Paystack dashboard
router.post("/admin/approve", protect, manualApprovePayment);
router.get("/admin/pending", protect, getPendingPayments);
router.post("/admin/verify-paystack", protect, verifyWithPaystack);

// ❌ REMOVED - These caused auto-approval or were unused
// router.post("/verify", ...) - was calling wrong function and auto-approving
// router.post("/webhook", ...) - no webhook needed for manual approval
// router.post("/manual-submit", ...) - not needed

module.exports = router;