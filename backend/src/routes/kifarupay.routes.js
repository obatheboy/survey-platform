/**
 * =============================================================================
 * KIFARUPAY PAYMENT ROUTES - DISABLED
 * =============================================================================
 * This gateway has been disabled. Only MegaPay is active.
 * All routes return Payment gateway disabled error.
 * =============================================================================
 */
const express = require("express");
const router = express.Router();

// All Kifarupay routes are disabled
router.post("/initiate", (req, res) => {
  res.status(503).json({ success: false, message: "Payment gateway disabled. Use MegaPay.", gateway: "DISABLED" });
});
router.get("/status", (req, res) => {
  res.status(503).json({ success: false, message: "Payment gateway disabled. Use MegaPay.", gateway: "DISABLED" });
});
router.get("/last-reference", (req, res) => {
  res.status(503).json({ success: false, message: "Payment gateway disabled. Use MegaPay.", gateway: "DISABLED" });
});
router.get("/admin/pending", (req, res) => {
  res.status(200).json({ success: true, count: 0, payments: [], message: "Kifarupay gateway disabled" });
});
router.get("/admin/all", (req, res) => {
  res.status(200).json({ success: true, count: 0, payments: [], message: "Kifarupay gateway disabled" });
});
router.post("/admin/approve", (req, res) => {
  res.status(503).json({ success: false, message: "Payment gateway disabled. Use MegaPay.", gateway: "DISABLED" });
});
router.post("/admin/reject", (req, res) => {
  res.status(503).json({ success: false, message: "Payment gateway disabled. Use MegaPay.", gateway: "DISABLED" });
});
router.get("/admin/plan-amounts", (req, res) => {
  res.status(503).json({ success: false, message: "Payment gateway disabled. Use MegaPay.", gateway: "DISABLED" });
});

module.exports = router;