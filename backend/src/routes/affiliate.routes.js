const express = require("express");
const router = express.Router();
const { getAffiliateStats, verifyReferralCode, getAllAffiliates } = require("../controllers/affiliate.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const adminAuthMiddleware = require("../middlewares/auth.middleware");

// Get affiliate stats (protected route)
router.get("/stats", authMiddleware, getAffiliateStats);

// Verify referral code (public route)
router.post("/verify-code", verifyReferralCode);

// Admin: Get all affiliates with their referrals (protected route)
router.get("/admin/all", adminAuthMiddleware, getAllAffiliates);

module.exports = router;
