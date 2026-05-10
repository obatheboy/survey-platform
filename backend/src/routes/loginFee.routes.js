const express = require("express");
const router = express.Router();
const { protect, adminProtect } = require("../middlewares/auth.middleware");
const {
  initiateLoginFeePayment,
  checkLoginFeeStatus,
  manualApprovePayment,
  getPendingPayments
} = require("../controllers/loginFee.controller");

// ✅ INITIATE LOGIN FEE PAYMENT (KSH 95) via MegaPay STK Push
router.post("/initiate", protect, initiateLoginFeePayment);

// ✅ CHECK STATUS - Auto-verification endpoint for frontend polling
router.get("/status", protect, checkLoginFeeStatus);

// ✅ ADMIN ENDPOINTS - For manual approval if needed (admin only)
router.post("/admin/approve", adminProtect, manualApprovePayment);
router.get("/admin/pending", adminProtect, getPendingPayments);

module.exports = router;