/**
 * =============================================================================
 * MEGAPAY PAYMENT ROUTES - ACTIVE GATEWAY
 * =============================================================================
 * MegaPay Configuration:
 * API Key: MGPYRHI7RIdn
 * Email: obavanteshia65@gmail.com
 * Endpoint: POST https://megapay.co.ke/backend/v1/initiatestk
 * =============================================================================
 */
const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const { adminProtect } = require("../middlewares/auth.middleware");
const megaPayController = require("../controllers/paynecta.controller");

/**
 * ========================================
 * MEGAPAY PAYMENT ROUTES - ONLY ACTIVE GATEWAY
 * ========================================
 */

// ===================== USER ROUTES =====================

/**
 * POST /api/megapay/initiate
 * Initiate MegaPay STK Push payment
 * Protected: User JWT token
 * Body: { plan: "welcome_bonus"|"regular"|"vip"|"vvip", phone_number: "254XXXXXXXXX", userId?: "optional if not in token" }
 */
router.post("/initiate", protect, megaPayController.initiatePaynectaPayment);

/**
 * GET /api/megapay/status
 * Check user's payment/activation status
 * Protected: User JWT token
 */
router.get("/status", protect, megaPayController.getUserPaymentStatus);

/**
 * GET /api/megapay/last-reference
 * Get user's last payment reference
 * Protected: User JWT token
 */
router.get("/last-reference", protect, megaPayController.getLastPaymentReference);

// ===================== ADMIN ROUTES =====================

/**
 * GET /api/megapay/admin/pending
 * Get all pending MegaPay payments
 * Protected: Admin JWT token
 */
router.get("/admin/pending", adminProtect, megaPayController.getPendingPaynectaPayments);

/**
 * GET /api/megapay/admin/all
 * Get all MegaPay payments (pending, approved, rejected)
 * Protected: Admin JWT token
 */
router.get("/admin/all", adminProtect, megaPayController.getAllPaynectaPayments);

/**
 * POST /api/megapay/admin/approve
 * Manually approve a MegaPay payment after verification
 * Protected: Admin JWT token
 * Body: { userId, activationId, notes? }
 */
router.post("/admin/approve", adminProtect, megaPayController.manualApprovePaynectaPayment);

/**
 * POST /api/megapay/admin/reject
 * Reject a MegaPay payment
 * Protected: Admin JWT token
 * Body: { userId, activationId, reason? }
 */
router.post("/admin/reject", adminProtect, megaPayController.rejectPaynectaPayment);

/**
 * GET /api/megapay/admin/plan-amounts
 * Get fixed plan amounts
 * Protected: Admin JWT token
 */
router.get("/admin/plan-amounts", adminProtect, megaPayController.getPlanAmounts);

module.exports = router;