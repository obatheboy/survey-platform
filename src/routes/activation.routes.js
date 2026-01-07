const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middlewares/auth.middleware");
const {
  submitActivationPayment,
  approveActivation,
  rejectActivation, // ✅ ADD THIS
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
router.patch("/:id/approve", protect, adminOnly, approveActivation);

/**
 * =====================================
 * ADMIN — REJECT ACTIVATION
 * PATCH /api/activation/:id/reject
 * =====================================
 */
router.patch("/:id/reject", protect, adminOnly, rejectActivation);

module.exports = router;
