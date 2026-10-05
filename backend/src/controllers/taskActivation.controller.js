const mongoose = require("mongoose");
const User = require("../models/User");
const Notification = require("../models/Notification");
const megaPayService = require("../services/megapay.service");
const { TASK_ACTIVATION_FEE } = require("../config/fees");

/* =====================================
   TASK ACTIVATION PAYMENT
   ===================================== */

/**
 * POST /api/task-activation/initiate
 * Initiate KES 98 task-activation payment via MegaPay STK Push.
 * Protected: User JWT token.
 * Body: { phone_number: "..." }
 */
exports.initiateTaskActivation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { phone_number } = req.body;

    if (!phone_number) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.task_activated === true || user.task_activation_fee_paid === true) {
      return res.status(400).json({
        success: false,
        message: "Task access already activated.",
        task_activated: true
      });
    }

    const amount = TASK_ACTIVATION_FEE;
    const orderReference = `TASK_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const megaPayReference = megaPayService.generateShortReference("TK");

    if (!user.task_activation_requests) {
      user.task_activation_requests = [];
    }

    user.task_activation_requests.push({
      plan: "TASK_ACTIVATION",
      mpesa_code: orderReference,
      amount: amount,
      status: "SUBMITTED",
      created_at: new Date(),
      is_welcome_bonus: false,
      payment_method: "megapay"
    });

    user.last_payment_reference = orderReference;
    user.last_payment_attempt = new Date();
    user.last_payment_plan = "TASK_ACTIVATION";
    user.payment_method = "megapay";
    await user.save();

    const paymentResult = await megaPayService.initiateSTKPush(
      amount,
      phone_number,
      megaPayReference
    );

    if (paymentResult.success) {
      const transactionRequestId = paymentResult.transaction_request_id || megaPayReference;
      const lastRequest = user.task_activation_requests[user.task_activation_requests.length - 1];
      lastRequest.mpesa_code = transactionRequestId;
      user.last_payment_reference = transactionRequestId;
      await user.save();

      try {
        const notification = new Notification({
          user_id: user._id,
          title: "🔔 Task Activation Payment",
          message: `STK push of KES ${amount} sent to ${phone_number}. Enter your M-Pesa PIN to complete payment and unlock paid work tasks.`,
          action_route: "/activate-tasks",
          type: "payment"
        });
        await notification.save();
      } catch (notifError) {
        console.error("Notification error:", notifError);
      }

      return res.status(200).json({
        success: true,
        message: "STK Push sent! Check your M-Pesa and enter your PIN.",
        reference: transactionRequestId,
        transaction_request_id: paymentResult.transaction_request_id || null,
        amount: amount,
        plan: "TASK_ACTIVATION"
      });
    } else {
      user.task_activation_requests.pop();
      user.last_payment_reference = null;
      await user.save();

      return res.status(400).json({
        success: false,
        message: paymentResult.message || "Failed to initiate STK Push. Please try again.",
        error_code: paymentResult.code || null,
        details: paymentResult.details || null
      });
    }
  } catch (error) {
    console.error("❌ Task activation initiation error:", error);
    if (error.code === "ENOTFOUND" || (error.message && error.message.includes("ENOTFOUND"))) {
      return res.status(503).json({ success: false, message: "Payment gateway temporarily unavailable. Please try again in a few minutes.", error: "DNS_RESOLUTION_FAILED" });
    }
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({ success: false, message: "Payment gateway connection refused. Please try again later.", error: "CONNECTION_REFUSED" });
    }
    if (error.code === "ETIMEDOUT") {
      return res.status(504).json({ success: false, message: "Payment gateway timed out. Please try again.", error: "TIMEOUT" });
    }
    return res.status(500).json({ success: false, message: "Server error: " + (error.message || "Unknown error") });
  }
};

/**
 * POST /api/task-activation/confirm
 * Auto-verify payment and unlock work tasks.
 * Protected: User JWT token.
 * Body: { transaction_request_id, phone }
 */
exports.confirmTaskActivation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { transaction_request_id, phone } = req.body;

    if (!transaction_request_id) {
      return res.status(400).json({ success: false, message: "transaction_request_id is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.task_activated === true || user.task_activation_fee_paid === true) {
      return res.status(200).json({
        success: true,
        message: "Task access already activated.",
        task_activated: true,
        redirect_to: "/hub"
      });
    }

    const pendingRequest = user.task_activation_requests?.find(
      r => r.status === "SUBMITTED" && r.mpesa_code === transaction_request_id
    );

    if (!pendingRequest) {
      return res.status(404).json({ success: false, message: "Pending task activation request not found for this transaction." });
    }

    const verification = await megaPayService.checkTransactionStatus(transaction_request_id, TASK_ACTIVATION_FEE);

    if (!verification.success) {
      return res.status(500).json({ success: false, message: "Failed to verify payment with gateway.", details: verification });
    }

    if (!verification.completed) {
      return res.status(200).json({
        success: false,
        message: verification.resultDesc || "Payment not yet completed.",
        status: verification.status || "Pending",
        missing_fields: verification.missing_fields || []
      });
    }

    if (verification.amount !== TASK_ACTIVATION_FEE) {
      return res.status(400).json({
        success: false,
        message: `Amount mismatch: expected KES ${TASK_ACTIVATION_FEE}, got KES ${verification.amount}.`
      });
    }

    pendingRequest.status = "APPROVED";
    pendingRequest.processed_at = new Date();
    user.task_activated = true;
    user.task_activation_fee_paid = true;
    user.task_activated_at = new Date();
    await user.save();

    try {
      const notification = new Notification({
        user_id: user._id,
        title: "✅ Task Access Activated!",
        message: "Your KES 98 task activation payment was successful. You can now access paid work tasks.",
        action_route: "/hub",
        type: "activation"
      });
      await notification.save();
    } catch (notifError) {
      console.error("Notification error:", notifError);
    }

    return res.status(200).json({
      success: true,
      message: "Task activation successful. You can now access paid work tasks.",
      task_activated: true,
      redirect_to: "/hub"
    });
  } catch (error) {
    console.error("❌ Task activation confirm error:", error);
    return res.status(500).json({ success: false, message: "Server error: " + (error.message || "Unknown error") });
  }
};

/**
 * GET /api/task-activation/status
 * Check current task activation status.
 * Protected: User JWT token.
 */
exports.getTaskActivationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("task_activated task_activation_fee_paid task_activation_requests");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const pending = (user.task_activation_requests || []).filter(
      r => r.status === "SUBMITTED" && r.payment_method === "megapay"
    );

    return res.status(200).json({
      success: true,
      task_activated: user.task_activated === true,
      task_activation_fee_paid: user.task_activation_fee_paid === true,
      pending_payments: pending.map(p => ({
        id: p._id,
        plan: p.plan,
        amount: p.amount,
        status: p.status,
        reference: p.mpesa_code,
        created_at: p.created_at
      }))
    });
  } catch (error) {
    console.error("❌ Task activation status error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
