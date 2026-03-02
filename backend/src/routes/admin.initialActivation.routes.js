const express = require("express");
const router = express.Router();

const { protect, adminProtect } = require("../middlewares/auth.middleware");
const initialActivationController = require("../controllers/initialActivation.controller");

/**
 * =====================================
 * ADMIN INITIAL ACTIVATION ROUTES
 * Path: /api/admin/initial-activation
 * =====================================
 */

/**
 * GET /api/admin/initial-activation/pending
 * Get all pending initial activations
 * Protected: Admin JWT token
 */
router.get("/pending", protect, adminProtect, initialActivationController.getPendingInitialActivations);

/**
 * GET /api/admin/initial-activation/all
 * Get all initial activations
 * Protected: Admin JWT token
 */
router.get("/all", protect, adminProtect, initialActivationController.getAllInitialActivations);

/**
 * POST /api/admin/initial-activation/approve
 * Approve initial activation
 * Protected: Admin JWT token
 */
router.post("/approve", protect, adminProtect, initialActivationController.approveInitialActivation);

/**
 * POST /api/admin/initial-activation/reject
 * Reject initial activation
 * Protected: Admin JWT token
 */
router.post("/reject", protect, adminProtect, initialActivationController.rejectInitialActivation);

module.exports = router;
