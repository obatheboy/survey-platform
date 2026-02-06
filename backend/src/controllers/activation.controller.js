const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification"); // ✅ ADDED: Import Notification model

const TOTAL_SURVEYS = 10;

/* ===============================
   PLAN ACTIVATION FEES (SOURCE OF TRUTH)
================================ */
const PLAN_FEES = {
  REGULAR: 100,
  VIP: 150,
  VVIP: 200,
};

/* =====================================
   USER — SUBMIT ACTIVATION PAYMENT
===================================== */
exports.submitActivationPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mpesa_code, plan } = req.body;
    const paymentReference = String(mpesa_code || "").trim();

    if (!paymentReference) {
      return res.status(400).json({
        message: "Please enter the M-Pesa payment reference",
      });
    }

    if (!PLAN_FEES[plan]) {
      return res.status(400).json({
        message: "Invalid plan",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has the plan
    if (!user.plans || !user.plans[plan]) {
      return res.status(400).json({ message: "Survey plan not found" });
    }

    const userPlan = user.plans[plan];

    // Check if surveys are completed
    if (!userPlan.completed || userPlan.surveys_completed !== TOTAL_SURVEYS) {
      return res.status(400).json({
        message: "Complete all surveys before activation",
      });
    }

    // Check if already activated
    if (userPlan.is_activated) {
      return res.status(400).json({
        message: "Plan already activated",
      });
    }

    // Initialize activation_requests array if it doesn't exist
    if (!user.activation_requests) {
      user.activation_requests = [];
    }
    
    // Check for existing pending activation for this plan
    const existingRequest = user.activation_requests.find(
      req => req.plan === plan && req.status === 'SUBMITTED'
    );
    
    if (existingRequest) {
      return res.status(400).json({
        message: "Activation already submitted and pending approval",
      });
    }
    
    // Add new activation request
    user.activation_requests.push({
      plan: plan,
      mpesa_code: paymentReference,
      amount: PLAN_FEES[plan],
      status: 'SUBMITTED',
      created_at: new Date()
    });
    
    await user.save();

    // ✅ ADDED: Create notification for activation submission
    try {
      const notification = new Notification({
        user_id: user._id,
        title: `📝 ${plan} Activation Submitted`,
        message: `Your ${plan} plan activation request has been submitted. Awaiting admin approval.`,
        action_route: "/dashboard",
        type: "activation"
      });
      await notification.save();
      console.log(`✅ Activation submission notification created for ${plan} plan`);
    } catch (notifError) {
      console.error("❌ Activation submission notification error:", notifError);
    }

    return res.json({
      activation_status: "SUBMITTED",
      activation_required: true,
      withdraw_unlocked: false,
      message: "Payment submitted successfully. Awaiting admin approval.",
    });
  } catch (error) {
    console.error("❌ Activation submit error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =====================================
   ADMIN — APPROVE ACTIVATION
===================================== */
exports.approveActivation = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const { userId, activationId } = req.body;

    if (!userId || !activationId) {
      return res.status(400).json({ 
        message: "User ID and Activation ID required" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the activation request
    const activationRequest = user.activation_requests.id(activationId);
    if (!activationRequest) {
      return res.status(404).json({ message: "Activation request not found" });
    }

    if (activationRequest.status !== 'SUBMITTED') {
      return res.status(400).json({
        message: "Activation already processed",
      });
    }

    const plan = activationRequest.plan;

    // Check if user has the plan completed
    if (!user.plans || !user.plans[plan]) {
      return res.status(400).json({
        message: "User has not completed required surveys",
      });
    }

    const userPlan = user.plans[plan];
    
    if (!userPlan.completed || userPlan.surveys_completed !== TOTAL_SURVEYS) {
      return res.status(400).json({
        message: "User has not completed required surveys",
      });
    }

    if (userPlan.is_activated) {
      return res.status(400).json({
        message: "Plan already activated",
      });
    }

    // Update activation request status
    activationRequest.status = 'APPROVED';
    activationRequest.processed_at = new Date();

    // Activate the plan
    user.plans[plan].is_activated = true;
    user.plans[plan].activated_at = new Date();
    
    // If REGULAR plan is activated, also set user.is_activated = true
    if (plan === "REGULAR") {
      user.is_activated = true;
    }
    
    await user.save();

    // ✅ ADDED: Create notification for activation approval
    try {
      const notification = new Notification({
        user_id: user._id,
        title: `✅ ${plan} Plan Activated!`,
        message: `Your ${plan} plan has been successfully activated! You can now withdraw your earnings.`,
        action_route: "/withdraw",
        type: "activation"
      });
      await notification.save();
      console.log(`✅ Activation approval notification created for ${plan} plan`);
    } catch (notifError) {
      console.error("❌ Activation approval notification error:", notifError);
    }

    return res.json({
      message: "Activation approved",
      plan: plan,
      withdraw_unlocked: true,
    });
  } catch (error) {
    console.error("❌ Approve activation error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =====================================
   ADMIN — REJECT ACTIVATION
===================================== */
exports.rejectActivation = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const { userId, activationId } = req.body;

    if (!userId || !activationId) {
      return res.status(400).json({ 
        message: "User ID and Activation ID required" 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the activation request
    const activationRequest = user.activation_requests.id(activationId);
    if (!activationRequest) {
      return res.status(404).json({ 
        message: "Activation request not found" 
      });
    }

    if (activationRequest.status !== 'SUBMITTED') {
      return res.status(400).json({
        message: "Activation already processed",
      });
    }

    // Update activation request status
    activationRequest.status = 'REJECTED';
    activationRequest.processed_at = new Date();
    
    await user.save();

    // ✅ ADDED: Create notification for activation rejection
    try {
      const notification = new Notification({
        user_id: user._id,
        title: `❌ ${activationRequest.plan} Activation Rejected`,
        message: `Your ${activationRequest.plan} plan activation request was rejected. Please check your M-Pesa payment and try again.`,
        action_route: "/activation",
        type: "system"
      });
      await notification.save();
    } catch (notifError) {
      console.error("❌ Activation rejection notification error:", notifError);
    }

    return res.json({ 
      message: "Activation rejected",
      user_id: userId,
      activation_id: activationId
    });
  } catch (error) {
    console.error("❌ Reject activation error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =====================================
   ADMIN — GET PENDING ACTIVATIONS
===================================== */
exports.getPendingActivations = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    // Find all users with pending activation requests
    const users = await User.find({
      'activation_requests.status': 'SUBMITTED'
    }).select('full_name phone email activation_requests');

    // Format the response
    const pendingActivations = [];
    
    users.forEach(user => {
      user.activation_requests.forEach(activation => {
        if (activation.status === 'SUBMITTED') {
          pendingActivations.push({
            activation_id: activation._id,
            user_id: user._id,
            user_name: user.full_name,
            user_phone: user.phone,
            user_email: user.email,
            plan: activation.plan,
            mpesa_code: activation.mpesa_code,
            amount: activation.amount,
            created_at: activation.created_at
          });
        }
      });
    });

    return res.json({
      count: pendingActivations.length,
      activations: pendingActivations
    });
  } catch (error) {
    console.error("❌ Get pending activations error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};