const User = require("../models/User");
const Survey = require("../models/Survey");

const TOTAL_SURVEYS = 60;
const DAILY_SURVEY_LIMIT = 5;
const SURVEY_EARNINGS = 97;

/* ===============================
   GET ALL SURVEYS
=============================== */
exports.getSurveys = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "survey_categories_completed survey_completed_count daily_survey_date daily_survey_count"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const surveys = await Survey.find({ isActive: true }).sort({ category: 1, title: 1 });
    const completed = new Set(user.survey_categories_completed || []);

    const result = surveys.map(s => ({
      _id: s._id,
      title: s.title,
      category: s.category,
      earnings: s.earnings,
      estimatedTime: s.estimatedTime,
      totalQuestions: s.totalQuestions,
      questions: s.questions,
      isCompleted: completed.has(s._id.toString())
    }));

    return res.json({
      surveys: result,
      total_surveys: surveys.length,
      total_completed: completed.size,
      survey_earnings: SURVEY_EARNINGS
    });
  } catch (err) {
    console.error("getSurveys error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   COMPLETE A SURVEY
   Awards KES 97, enforces 5/day limit
=============================== */
exports.completeSurvey = async (req, res) => {
  try {
    const { surveyId } = req.params;

    const survey = await Survey.findById(surveyId);
    if (!survey) return res.status(404).json({ message: "Survey not found" });
    if (!survey.isActive) return res.status(400).json({ message: "Survey is not active" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if already completed
    const completed = user.survey_categories_completed || [];
    if (completed.includes(survey._id.toString())) {
      return res.status(400).json({ message: "Survey already completed" });
    }

    // Daily limit check
    const today = new Date().toISOString().split("T")[0];
    if (user.daily_survey_date !== today) {
      user.daily_survey_date = today;
      user.daily_survey_count = 0;
    }

    if ((user.daily_survey_count || 0) >= DAILY_SURVEY_LIMIT) {
      return res.status(403).json({
        message: `Daily limit reached. You can complete ${DAILY_SURVEY_LIMIT} surveys per day. Come back tomorrow!`,
        remaining_today: 0,
        limit: DAILY_SURVEY_LIMIT,
        next_available: "tomorrow"
      });
    }

    // Complete the survey
    user.survey_categories_completed = completed;
    user.survey_categories_completed.push(survey._id.toString());
    user.survey_completed_count = (user.survey_completed_count || 0) + 1;
    user.daily_survey_count = (user.daily_survey_count || 0) + 1;
    user.total_survey_earnings = (user.total_survey_earnings || 0) + survey.earnings;
    user.wallet_balance = (user.wallet_balance || 0) + survey.earnings;

    await user.save();

    return res.json({
      success: true,
      message: `Survey completed! Earned KES ${survey.earnings}`,
      earnings: survey.earnings,
      new_balance: user.wallet_balance,
      total_completed: user.survey_completed_count,
      daily_count: user.daily_survey_count,
      remaining_today: DAILY_SURVEY_LIMIT - user.daily_survey_count,
      all_surveys_done: user.survey_completed_count >= TOTAL_SURVEYS
    });
  } catch (err) {
    console.error("completeSurvey error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   GET SURVEY STATS
=============================== */
exports.getSurveyStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "survey_categories_completed survey_completed_count daily_survey_date daily_survey_count total_survey_earnings wallet_balance"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const today = new Date().toISOString().split("T")[0];
    const dailyCount = user.daily_survey_date === today ? (user.daily_survey_count || 0) : 0;

    return res.json({
      total_surveys: TOTAL_SURVEYS,
      total_completed: user.survey_completed_count || 0,
      total_earnings: user.total_survey_earnings || 0,
      wallet_balance: user.wallet_balance || 0,
      daily_count: dailyCount,
      remaining_today: Math.max(0, DAILY_SURVEY_LIMIT - dailyCount),
      all_surveys_done: (user.survey_completed_count || 0) >= TOTAL_SURVEYS
    });
  } catch (err) {
    console.error("getSurveyStats error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   GET SURVEY CATEGORIES
=============================== */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Survey.distinct("category");
    return res.json({ categories });
  } catch (err) {
    console.error("getCategories error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};