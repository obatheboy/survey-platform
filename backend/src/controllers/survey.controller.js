const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification"); // ✅ ADDED: Import Notification model

const TOTAL_SURVEYS = 10;

/* ===============================
   PLAN TOTAL EARNINGS (SOURCE OF TRUTH)
================================ */
const PLAN_TOTAL_EARNINGS = {
  REGULAR: 1500,
  VIP: 2000,
  VVIP: 3000,
};

/* ===============================
   SELECT PLAN (FIXED)
================================ */
exports.selectPlan = async (req, res) => {
  const userId = req.user.id;
  const { plan } = req.body;

  if (!PLAN_TOTAL_EARNINGS[plan]) {
    return res.status(400).json({ message: "Invalid plan" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize plans object if it doesn't exist
    if (!user.plans) {
      user.plans = {};
    }

    // Initialize the selected plan if it doesn't exist
    if (!user.plans[plan]) {
      user.plans[plan] = {
        surveys_completed: 0,
        completed: false,
        is_activated: false,
        total_surveys: TOTAL_SURVEYS
      };
    }

    await user.save();

    return res.json({
      success: true,
      plan,
    });
  } catch (err) {
    console.error("❌ Select plan error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   SUBMIT SURVEY (WITH NOTIFICATIONS)
================================ */
exports.submitSurvey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan } = req.body;

    if (!PLAN_TOTAL_EARNINGS[plan]) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if plan exists
    if (!user.plans || !user.plans[plan]) {
      return res.status(400).json({ message: "Plan not selected" });
    }

    const userPlan = user.plans[plan];

    // Check if already completed
    if (userPlan.completed) {
      return res.json({
        plan,
        completed: true,
        surveys_completed: TOTAL_SURVEYS,
        activation_required: true,
      });
    }

    // Increment survey count
    const newCompleted = (userPlan.surveys_completed || 0) + 1;

    // 🎯 COMPLETION POINT
    if (newCompleted === TOTAL_SURVEYS) {
      // Update plan
      user.plans[plan].surveys_completed = TOTAL_SURVEYS;
      user.plans[plan].completed = true;
      
      // Update total earned
      user.total_earned = (user.total_earned || 0) + PLAN_TOTAL_EARNINGS[plan];
      
      await user.save();

      // ✅ ADDED: Create notification for survey completion
      try {
        const notification = new Notification({
          user_id: user._id,
          title: `🎉 ${plan} Plan Completed!`,
          message: `Congratulations! You've completed all ${TOTAL_SURVEYS} surveys for your ${plan} plan. Activate your account to withdraw KES ${PLAN_TOTAL_EARNINGS[plan]}.`,
          action_route: "/activation",
          type: "survey_completed"
        });
        await notification.save();
        console.log(`✅ Survey completion notification created for ${plan} plan`);
      } catch (notifError) {
        console.error("❌ Survey completion notification error:", notifError);
        // Don't fail the survey submission if notification fails
      }

      return res.json({
        plan,
        completed: true,
        surveys_completed: TOTAL_SURVEYS,
        activation_required: true,
      });
    }

    // ➕ NORMAL PROGRESS
    user.plans[plan].surveys_completed = newCompleted;
    await user.save();

    // Optional: Create notification for milestone (e.g., every 3 surveys)
    if (newCompleted % 3 === 0) {
      try {
        const notification = new Notification({
          user_id: user._id,
          title: `📊 Survey Progress: ${newCompleted}/${TOTAL_SURVEYS}`,
          message: `Great work! You've completed ${newCompleted} out of ${TOTAL_SURVEYS} surveys for your ${plan} plan. Keep going!`,
          action_route: "/surveys",
          type: "system"
        });
        await notification.save();
      } catch (notifError) {
        console.error("❌ Milestone notification error:", notifError);
      }
    }

    return res.json({
      plan,
      completed: false,
      surveys_completed: newCompleted,
    });
  } catch (error) {
    console.error("❌ Survey submit error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   GET SURVEY PROGRESS
================================ */
exports.getSurveyProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const progress = {};
    let totalCompleted = 0;
    let activePlan = null;

    if (user.plans) {
      for (const [planKey, planData] of Object.entries(user.plans)) {
        if (planData && typeof planData === 'object') {
          progress[planKey] = {
            surveys_completed: planData.surveys_completed || 0,
            completed: planData.completed || false,
            is_activated: planData.is_activated || false,
            total_surveys: TOTAL_SURVEYS,
            total_earnings: PLAN_TOTAL_EARNINGS[planKey] || 0
          };

          totalCompleted += planData.surveys_completed || 0;

          // Find active plan (first non-activated plan)
          if (!activePlan && !planData.is_activated) {
            activePlan = planKey;
          }
        }
      }
    }

    res.json({
      success: true,
      total_surveys_completed: totalCompleted,
      active_plan: activePlan,
      plans: progress
    });
  } catch (error) {
    console.error("❌ Get survey progress error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};