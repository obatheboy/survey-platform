const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const initialActivationController = require("../controllers/initialActivation.controller");

/**
 * =====================================
 * INITIAL ACTIVATION ROUTES
 * Path: /api/initial-activation
 * =====================================
 */

/**
 * POST /api/initial-activation/submit
 * User submits initial activation payment (KES 100)
 * Protected: Regular user JWT token
 */
router.post("/submit", protect, initialActivationController.submitInitialActivation);

/**
 * GET /api/initial-activation/status
 * User checks initial activation status
 * Protected: Regular user JWT token
 */
router.get("/status", protect, initialActivationController.getInitialActivationStatus);

module.exports = router;
