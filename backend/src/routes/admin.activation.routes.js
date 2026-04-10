const express = require("express");
const router = express.Router();

const { adminProtect } = require("../middlewares/auth.middleware");
const controller = require("../controllers/admin.activation.controller");

/**
 * ====================================================
 * 🔐 ADMIN ACTIVATION ROUTES
 * - Header-based admin JWT (Bearer token)
 * ====================================================
 */
router.use(adminProtect);

/**
 * ====================================================
 * 💳 ACTIVATION PAYMENTS
 * ====================================================
 */

/**
 * GET
 * /api/admin/activations
 * ➜ View ALL activation payments
 */
router.get("/activations", controller.getActivationPayments);

/**
 * GET
 * /api/admin/activations/pending
 * ➜ View ONLY pending (SUBMITTED) payments
 */
router.get(
  "/activations/pending",
  controller.getPendingActivations
);

/**
 * PATCH
 * /api/admin/activations/:id/approve
 * ➜ Approve activation payment
 */
router.patch(
  "/activations/:id/approve",
  controller.approveActivation
);

/**
 * PATCH
 * /api/admin/activations/:id/reject
 * ➜ Reject activation payment
 */
router.patch(
  "/activations/:id/reject",
  controller.rejectActivation
);

/**
 * ====================================================
 * 💰 LOGIN FEE PAYMENTS (NEW)
 * ====================================================
 */

/**
 * GET
 * /api/admin/login-fee/all
 * ➜ View ALL login fee payments (with status)
 */
router.get(
  "/login-fee/all",
  controller.getAllLoginFeePayments
);

/**
 * GET
 * /api/admin/login-fee/pending
 * ➜ View pending login fee payments
 */
router.get(
  "/login-fee/pending",
  controller.getPendingLoginFeePayments
);

/**
 * PATCH
 * /api/admin/login-fee/:userId/approve
 * ➜ Approve login fee payment
 */
router.patch(
  "/login-fee/:userId/approve",
  controller.approveLoginFee
);

/**
 * PATCH
 * /api/admin/login-fee/:userId/reject
 * ➜ Reject login fee payment
 */
router.patch(
  "/login-fee/:userId/reject",
  controller.rejectLoginFee
);

module.exports = router;
