const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const {
  checkLoginFeeStatus,
  manualApprovePayment,
  getPendingPayments
} = require("../controllers/loginFee.controller");

// ❌ DISABLED: Automatic payment initiation
// router.post("/initiate", protect, initiateLoginFeePayment);

// ❌ DISABLED: Paynecta automatic payment
// router.post("/initiate-paynecta", protect, initiatePaynectaPayment);

// ✅ CHECK STATUS - User can check if they've been approved (for manual flow)
router.get("/status", protect, checkLoginFeeStatus);

// ✅ ADMIN ENDPOINTS - For manual approval after verifying in Paynecta dashboard
router.post("/admin/approve", protect, manualApprovePayment);
router.get("/admin/pending", protect, getPendingPayments);

module.exports = router;