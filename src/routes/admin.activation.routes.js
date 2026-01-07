const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middlewares/auth.middleware");
const controller = require("../controllers/admin.activation.controller");

/**
 * ====================================================
 * 🔐 ADMIN ACTIVATION ROUTES
 * - Cookie-based auth
 * - Admin role enforced
 * ====================================================
 */
router.use(protect);
router.use(adminOnly);

/**
 * ====================================================
 * 💳 ACTIVATION PAYMENTS
 * ====================================================
 */

/**
 * GET
 * /admin/activations
 * ➜ View ALL activation payments (any status)
 */
router.get("/activations", controller.getActivationPayments);

/**
 * GET
 * /admin/activations/pending
 * ➜ View ONLY pending (SUBMITTED) payments
 * (Admin focus queue)
 */
router.get(
  "/activations/pending",
  controller.getPendingActivations
);

/**
 * PATCH
 * /admin/activations/:id/approve
 * ➜ Approve activation payment
 * ➜ Activates user
 * ➜ Moves locked → available balance
 */
router.patch(
  "/activations/:id/approve",
  controller.approveActivation
);

/**
 * PATCH
 * /admin/activations/:id/reject
 * ➜ Reject activation payment
 * ➜ User remains INACTIVE
 */
router.patch(
  "/activations/:id/reject",
  controller.rejectActivation
);

module.exports = router;
