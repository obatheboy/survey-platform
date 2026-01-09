const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");

// ✅ IMPORT FROM THE CORRECT CONTROLLER
const {
  submitActivationPayment,
  approveActivation,
  rejectActivation,
} = require("../controllers/activation.controller");

/**
 * =====================================
 * USER — SUBMIT ACTIVATION PAYMENT
 * POST /api/activation/submit
 * =====================================
 */
router.post("/submit", protect, submitActivationPayment);

/**
 * =====================================
 * ADMIN — APPROVE ACTIVATION
 * PATCH /api/activation/:id/approve
 * =====================================
 */
router.patch("/:id/approve", protect, approveActivation);

/**
 * =====================================
 * ADMIN — REJECT ACTIVATION
 * PATCH /api/activation/:id/reject
 * =====================================
 */
router.patch("/:id/reject", protect, rejectActivation);

module.exports = router;
