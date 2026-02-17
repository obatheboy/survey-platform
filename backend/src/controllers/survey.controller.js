const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");

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
   SELECT PLAN (FIXED - WITH PROPER INITIALIZATION)
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

    // Initialize ALL plans with proper structure if they don't exist
    const allPlans = ['REGULAR', 'VIP', 'VVIP'];
    allPlans.forEach(planKey => {
      if (!user.plans[planKey]) {
        user.plans[planKey] = {
          surveys_completed: 0,
          completed: false,
          is_activated: false,
          total_surveys: TOTAL_SURVEYS,
          activated_at: null
        };
      }
    });

    // Set the active plan
    user.active_plan = plan;

    await user.save();

    console.log(`✅ Plan selected - User: ${user.full_name || user.email}, Plan: ${plan}`);
    console.log(`📊 Plans after selection:`, {
      REGULAR: user.plans.REGULAR,
      VIP: user.plans.VIP,
      VVIP: user.plans.VVIP
    });

    return res.json({
      success: true,
      plan,
      plans: user.plans
    });
  } catch (err) {
    console.error("❌ Select plan error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   SUBMIT SURVEY (FIXED - NO EARNINGS ADDED HERE)
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
        activation_required: !userPlan.is_activated,
        message: "You've already completed this plan. Please activate to withdraw."
      });
    }

    // Increment survey count
    const currentCompleted = userPlan.surveys_completed || 0;
    const newCompleted = currentCompleted + 1;

    // Update the plan
    user.plans[plan].surveys_completed = newCompleted;

    // 🎯 COMPLETION POINT
    if (newCompleted === TOTAL_SURVEYS) {
      user.plans[plan].completed = true;
      
      console.log(`🎉 Plan completed - User: ${user.full_name || user.email}, Plan: ${plan}`);
      
      // ✅ FIX: Do NOT add earnings here - they will be added during activation
      // Earnings are only added when admin approves activation

      // Create notification for survey completion
      try {
        const notification = new Notification({
          user_id: user._id,
          title: `🎉 ${plan} Plan Completed!`,
          message: `Congratulations! You've completed all ${TOTAL_SURVEYS} surveys for your ${plan} plan. Submit payment of KES ${plan === 'REGULAR' ? 100 : plan === 'VIP' ? 150 : 200} to activate and withdraw KES ${PLAN_TOTAL_EARNINGS[plan]}.`,
          action_route: "/activation",
          type: "survey_completed"
        });
        await notification.save();
      } catch (notifError) {
        console.error("❌ Survey completion notification error:", notifError);
      }
    } else {
      // Optional: Create notification for milestone (every 3 surveys)
      if (newCompleted % 3 === 0 || newCompleted === 1) {
        try {
          const notification = new Notification({
            user_id: user._id,
            title: `📊 ${plan} Progress: ${newCompleted}/${TOTAL_SURVEYS}`,
            message: `Great work! You've completed ${newCompleted} out of ${TOTAL_SURVEYS} surveys. ${TOTAL_SURVEYS - newCompleted} more to go!`,
            action_route: "/surveys",
            type: "system"
          });
          await notification.save();
        } catch (notifError) {
          console.error("❌ Milestone notification error:", notifError);
        }
      }
    }

    await user.save();

    return res.json({
      success: true,
      plan,
      completed: newCompleted === TOTAL_SURVEYS,
      surveys_completed: newCompleted,
      activation_required: newCompleted === TOTAL_SURVEYS && !userPlan.is_activated,
      message: newCompleted === TOTAL_SURVEYS 
        ? "🎉 Plan completed! Please activate to withdraw." 
        : `✅ Survey ${newCompleted}/${TOTAL_SURVEYS} completed`
    });
  } catch (error) {
    console.error("❌ Survey submit error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   BATCH SUBMIT SURVEYS (FIXED - NO EARNINGS ADDED HERE)
================================ */
exports.batchSubmitSurveys = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan, count } = req.body;

    if (!PLAN_TOTAL_EARNINGS[plan]) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    if (!count || count < 1 || count > 10) {
      return res.status(400).json({ 
        message: "Invalid count. Must be between 1 and 10" 
      });
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
        success: true,
        plan,
        completed: true,
        surveys_completed: TOTAL_SURVEYS,
        activation_required: !userPlan.is_activated,
        added: 0,
        message: "Plan already completed. Please activate to withdraw."
      });
    }

    const currentCompleted = userPlan.surveys_completed || 0;
    const newCompleted = Math.min(currentCompleted + count, TOTAL_SURVEYS);
    const actualAdded = newCompleted - currentCompleted;

    if (actualAdded <= 0) {
      return res.json({
        success: true,
        plan,
        completed: userPlan.completed,
        surveys_completed: currentCompleted,
        added: 0
      });
    }

    // Update the plan
    user.plans[plan].surveys_completed = newCompleted;

    const isNowCompleted = newCompleted >= TOTAL_SURVEYS && !userPlan.completed;

    if (isNowCompleted) {
      user.plans[plan].completed = true;
      
      console.log(`🎉 Plan completed via batch - User: ${user.full_name || user.email}, Plan: ${plan}`);
      
      // ✅ FIX: Do NOT add earnings here - they will be added during activation

      try {
        const notification = new Notification({
          user_id: user._id,
          title: `🎉 ${plan} Plan Completed! (Batch)`,
          message: `Congratulations! You've completed all ${TOTAL_SURVEYS} surveys for your ${plan} plan. Submit payment of KES ${plan === 'REGULAR' ? 100 : plan === 'VIP' ? 150 : 200} to activate and withdraw KES ${PLAN_TOTAL_EARNINGS[plan]}.`,
          action_route: "/activation",
          type: "survey_completed"
        });
        await notification.save();
      } catch (notifError) {
        console.error("❌ Batch completion notification error:", notifError);
      }
    } else {
      // Create notification for batch progress
      try {
        const notification = new Notification({
          user_id: user._id,
          title: `🚀 ${plan} Plan Progress`,
          message: `You've completed ${newCompleted} out of ${TOTAL_SURVEYS} surveys for your ${plan} plan. ${TOTAL_SURVEYS - newCompleted} more to go!`,
          action_route: "/surveys",
          type: "system"
        });
        await notification.save();
      } catch (notifError) {
        console.error("❌ Batch progress notification error:", notifError);
      }
    }

    await user.save();

    return res.json({
      success: true,
      plan,
      completed: isNowCompleted || userPlan.completed,
      surveys_completed: newCompleted,
      added: actualAdded,
      activation_required: newCompleted >= TOTAL_SURVEYS && !userPlan.is_activated,
      message: isNowCompleted 
        ? "🎉 Plan completed! Please activate to withdraw." 
        : `✅ Added ${actualAdded} surveys. Total: ${newCompleted}/${TOTAL_SURVEYS}`
    });

  } catch (error) {
    console.error("❌ Batch submit surveys error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   GET SURVEY PROGRESS (FIXED)
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
    let totalEarned = user.total_earned || 0;

    // Ensure all plans exist
    if (!user.plans) {
      user.plans = {};
    }

    const allPlans = ['REGULAR', 'VIP', 'VVIP'];
    allPlans.forEach(planKey => {
      if (!user.plans[planKey]) {
        user.plans[planKey] = {
          surveys_completed: 0,
          completed: false,
          is_activated: false,
          total_surveys: TOTAL_SURVEYS
        };
      }
    });

    // Calculate progress for each plan
    for (const [planKey, planData] of Object.entries(user.plans)) {
      if (planData && typeof planData === 'object') {
        const surveysCompleted = planData.surveys_completed || 0;
        const isPlanActivated = planData.is_activated || false;
        const isPlanCompleted = planData.completed || false;
        
        progress[planKey] = {
          surveys_completed: surveysCompleted,
          completed: isPlanCompleted,
          is_activated: isPlanActivated,
          total_surveys: TOTAL_SURVEYS,
          total_earnings: PLAN_TOTAL_EARNINGS[planKey] || 0,
          progress_percentage: Math.min((surveysCompleted / TOTAL_SURVEYS) * 100, 100),
          can_activate: surveysCompleted >= TOTAL_SURVEYS && !isPlanActivated,
          can_withdraw: isPlanActivated && isPlanCompleted
        };

        totalCompleted += surveysCompleted;

        // Find active plan (first non-completed plan)
        if (!activePlan && surveysCompleted < TOTAL_SURVEYS) {
          activePlan = planKey;
        }
      }
    }

    // If all plans are completed, set active plan to null
    if (!activePlan && totalCompleted >= TOTAL_SURVEYS * 3) {
      activePlan = null;
    }

    res.json({
      success: true,
      total_surveys_completed: totalCompleted,
      active_plan: activePlan,
      total_earned: totalEarned,
      plans: progress,
      welcome_bonus: {
        received: user.welcome_bonus_received || false,
        amount: user.welcome_bonus || 1200,
        withdrawn: user.welcome_bonus_withdrawn || false
      }
    });
  } catch (error) {
    console.error("❌ Get survey progress error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ===============================
   RESET PLAN (DEBUG ONLY - REMOVE IN PRODUCTION)
================================ */
exports.resetPlan = async (req, res) => {
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

    // Reset the specified plan
    if (user.plans && user.plans[plan]) {
      user.plans[plan].surveys_completed = 0;
      user.plans[plan].completed = false;
      // Don't reset is_activated if you want to keep activation status
    }

    await user.save();

    res.json({
      success: true,
      message: `Plan ${plan} reset successfully`,
      plan: user.plans[plan]
    });
  } catch (error) {
    console.error("❌ Reset plan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};