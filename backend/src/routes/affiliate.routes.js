const express = require("express");
const router = express.Router();
const { getAffiliateStats, verifyReferralCode } = require("../controllers/affiliate.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Get affiliate stats (protected route)
router.get("/stats", authMiddleware, getAffiliateStats);

// Verify referral code (public route)
router.post("/verify-code", verifyReferralCode);

module.exports = router;
