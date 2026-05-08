const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const { adminProtect } = require("../middlewares/auth.middleware");
const kifarupayController = require("../controllers/kifarupay.controller");

/**
 * ========================================
 * KIFARUPAY PAYMENT ROUTES
 * ========================================
 */

// ===================== USER ROUTES =====================

/**
 * POST /api/kifarupay/initiate
 * Initiate Kifarupay STK Push payment
 * Protected: User JWT token
 * Body: { plan: "welcome_bonus"|"regular"|"vip"|"vvip", phone_number: "254XXXXXXXXX", userId?: "optional if not in token" }
 */
router.post("/initiate", protect, kifarupayController.initiateKifarupayPayment);

/**
 * GET /api/kifarupay/status
 * Check user's payment/activation status
 * Protected: User JWT token
 */
router.get("/status", protect, kifarupayController.getUserPaymentStatus);

/**
 * GET /api/kifarupay/last-reference
 * Get user's last payment reference
 * Protected: User JWT token
 */
router.get("/last-reference", protect, kifarupayController.getLastPaymentReference);

// ===================== ADMIN ROUTES =====================

/**
 * GET /api/kifarupay/admin/pending
 * Get all pending Kifarupay payments
 * Protected: Admin JWT token
 */
router.get("/admin/pending", adminProtect, kifarupayController.getPendingKifarupayPayments);

/**
 * GET /api/kifarupay/admin/all
 * Get all Kifarupay payments (pending, approved, rejected)
 * Protected: Admin JWT token
 */
router.get("/admin/all", adminProtect, kifarupayController.getAllKifarupayPayments);

/**
 * POST /api/kifarupay/admin/approve
 * Manually approve a Kifarupay payment after verification
 * Protected: Admin JWT token
 * Body: { userId, activationId, notes? }
 */
router.post("/admin/approve", adminProtect, kifarupayController.manualApproveKifarupayPayment);

/**
 * POST /api/kifarupay/admin/reject
 * Reject a Kifarupay payment
 * Protected: Admin JWT token
 * Body: { userId, activationId, reason? }
 */
router.post("/admin/reject", adminProtect, kifarupayController.rejectKifarupayPayment);

/**
 * GET /api/kifarupay/admin/plan-amounts
 * Get fixed plan amounts
 * Protected: Admin JWT token
 */
router.get("/admin/plan-amounts", adminProtect, kifarupayController.getPlanAmounts);

module.exports = router;