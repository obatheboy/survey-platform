const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const surveyController = require("../controllers/survey.controller");

// ===============================
// SURVEY ROUTES (AUTHORITATIVE)
// ===============================

// Select survey plan (creates plan row if missing)
// BODY: { plan: "REGULAR" | "VIP" | "VVIP" }
router.post(
  "/select-plan",
  protect,
  surveyController.selectPlan
);

// Submit ONE survey for a SPECIFIC plan
// BODY: { plan: "REGULAR" | "VIP" | "VVIP" }
router.post(
  "/submit",
  protect,
  surveyController.submitSurvey
);

module.exports = router;
