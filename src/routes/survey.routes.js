const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const surveyController = require("../controllers/survey.controller");

// ===============================
// SURVEY ROUTES (AUTHORITATIVE)
// ===============================

// Select survey plan (ONCE per cycle)
router.post("/select-plan", protect, surveyController.selectPlan);

// Submit ONE survey (step-by-step only)
router.post("/submit", protect, surveyController.submitSurvey);

module.exports = router;
