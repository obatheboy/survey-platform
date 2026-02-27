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
 * /api/admin/activations/initial
 * ➜ View initial account activations (NEW)
 */
router.get("/activations/initial", controller.getInitialActivations);

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
 * ✅ NEW: PATCH
 * /api/admin/activations/initial/:userId/approve
 * ➜ Approve initial account activation (100 KES)
 */
router.patch(
  "/activations/initial/:userId/approve",
  controller.approveInitialActivation
);

/**
 * ✅ NEW: PATCH
 * /api/admin/activations/initial/:userId/reject
 * ➜ Reject initial account activation
 */
router.patch(
  "/activations/initial/:userId/reject",
  controller.rejectInitialActivation
);

module.exports = router;
