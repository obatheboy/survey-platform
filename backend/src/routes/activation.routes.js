const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const activationController = require("../controllers/activation.controller");

/**
 * =====================================
 * USER ACTIVATION ROUTES ONLY
 * Path: /api/activation
 * =====================================
 */

/**
 * POST /api/activation/submit
 * User submits activation payment
 * Protected: Regular user JWT token
 */
router.post("/submit", protect, activationController.submitActivationPayment);

/**
 * GET /api/activation/status
 * User checks activation status
 * Protected: Regular user JWT token
 */
router.get("/status", protect, (req, res) => {
  // This endpoint should be in controller, but added here for completeness
  res.json({
    message: "User activation status endpoint",
    note: "Implement this in activation.controller.js if needed"
  });
});

module.exports = router;