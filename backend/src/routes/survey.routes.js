const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const {
  getSurveys,
  getSurveyById,
  completeSurvey,
  getSurveyStats,
  getCategories
} = require("../controllers/survey.controller");

router.get("/", protect, getSurveys);
router.get("/stats", protect, getSurveyStats);
router.get("/categories", protect, getCategories);
router.get("/:surveyId", protect, getSurveyById);
router.post("/:surveyId/complete", protect, completeSurvey);

module.exports = router;