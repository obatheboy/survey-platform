const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const planPaymentController = require("../controllers/planPayment.controller");

/**
 * POST /api/plans/initiate
 * Send STK push for a specific plan
 * Protected: User JWT token
 * Body: { plan: "welcome_bonus"|"regular"|"vip"|"vvip", phone_number: "..." }
 */
router.post("/initiate", protect, planPaymentController.initiatePlanPayment);

/**
 * POST /api/plans/confirm
 * Auto-verify payment, mark plan as paid
 * No auth required (uses phone to find user)
 * Body: { transaction_request_id, phone, plan? }
 */
router.post("/confirm", planPaymentController.confirmPlanPayment);

/**
 * GET /api/plans/status
 * Get which plans are paid/unpaid
 * Protected: User JWT token
 */
router.get("/status", protect, planPaymentController.getPlanPaymentStatus);

/**
 * GET /api/plans/next
 * Return the next unpaid plan
 * Protected: User JWT token
 */
router.get("/next", protect, planPaymentController.getNextUnpaidPlan);

module.exports = router;
