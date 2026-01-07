const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const surveyController = require("../controllers/survey.controller");

// ===============================
// SURVEY ROUTES
// ===============================

// Submit ONE survey (step-by-step only)
router.post("/submit", protect, surveyController.submitSurvey);

module.exports = router;
