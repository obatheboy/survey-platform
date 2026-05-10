const User = require("../models/User");
const jwt = require("jsonwebtoken");
const megaPayService = require("../services/megapay.service");

const LOGIN_FEE = 95;

// ✅ Initiate Login Fee Payment via MegaPay STK Push
exports.initiateLoginFeePayment = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    const user = await User.findById(userId);

    console.log("=== INITIATE LOGIN FEE PAYMENT (MEGAPAY AUTO-VERIFY) ===");
    console.log("User ID:", userId);
    console.log("User phone:", user?.phone);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.login_fee_paid) {
      return res.status(400).json({ message: "Login fee already paid" });
    }

    // Generate unique order reference for MegaPay
    const orderReference = `LOGIN_FEE_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Send MegaPay STK push
    const payment = await megaPayService.initiateSTKPush(
      LOGIN_FEE,
      user.phone,
      orderReference
    );

    console.log("MegaPay STK Push response:", payment);

    if (!payment.success) {
      console.error("STK Push failed:", payment);
      return res.status(500).json({
        success: false,
        message: "Failed to initiate STK Push. Please try again.",
        debug: payment.message || payment.error
      });
    }

    // Store reference for auto-verification
    user.last_payment_reference = payment.transaction_request_id || orderReference;
    user.last_payment_attempt = new Date();
    user.payment_method = "megapay";
    await user.save();

    // Return transaction_request_id for frontend polling
    res.status(200).json({
      success: true,
      message: "STK Push sent to your phone. Checking payment automatically...",
      reference: payment.transaction_request_id || orderReference,
      transaction_request_id: payment.transaction_request_id || orderReference,
      amount: LOGIN_FEE,
      phone: payment.phone,
      requires_manual_approval: false,
      instructions: "Payment will be verified automatically. Do not close this page."
    });

  } catch (error) {
    console.error("Login fee payment error:", error);

    // Handle DNS/connection errors
    if (error.code === 'ENOTFOUND' || (error.message && error.message.includes("ENOTFOUND"))) {
      return res.status(503).json({
        success: false,
        message: "Payment gateway temporarily unavailable. Please try again in a few minutes.",
        error: "DNS_RESOLUTION_FAILED"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to initiate payment: " + (error.message || "Unknown error")
    });
  }
};

// ✅ Check Login Fee Payment Status - AUTO-VERIFY via MegaPay
exports.checkLoginFeeStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;

    console.log("=== CHECK LOGIN FEE STATUS ===");
    console.log("User ID:", userId);

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If already paid, return immediately
    if (user.login_fee_paid) {
      return res.status(200).json({
        success: true,
        login_fee_paid: true,
        paid: true,
        status: "completed"
      });
    }

    // Get the transaction reference from the user's last payment attempt
    const transactionRequestId = user.last_payment_reference;

    if (!transactionRequestId) {
      return res.status(200).json({
        success: true,
        login_fee_paid: false,
        paid: false,
        status: "no_payment_initiated"
      });
    }

    // Check MegaPay transaction status
    const statusResult = await megaPayService.checkTransactionStatus(transactionRequestId);
    console.log("MegaPay status check result:", statusResult);

    if (statusResult.success && statusResult.completed) {
      // ✅ PAYMENT CONFIRMED - Auto-approve user
      user.login_fee_paid = true;
      user.login_fee_paid_at = new Date();
      user.login_fee_approved_reference = transactionRequestId;
      user.login_fee_approved_notes = "Auto-approved via MegaPay transaction detection";

      // Clear any pending status
      if (user.login_fee_pending) {
        user.login_fee_pending.status = 'APPROVED';
        user.login_fee_pending.approved_at = new Date();
      }

      await user.save();

      // Generate token for user
      const token = jwt.sign(
        { id: user._id, phone: user.phone, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      console.log(`✅ Login fee AUTO-APPROVED for user: ${user.full_name} (${user.phone})`);

      return res.status(200).json({
        success: true,
        login_fee_paid: true,
        paid: true,
        status: "completed",
        token: token,
        user: {
          id: user._id,
          full_name: user.full_name,
          phone: user.phone,
          email: user.email,
          login_fee_paid: true
        },
        message: "Payment confirmed! Access granted."
      });
    }

    // Payment not yet completed
    return res.status(200).json({
      success: true,
      login_fee_paid: false,
      paid: false,
      status: statusResult.status || "pending",
      result_desc: statusResult.resultDesc || "Payment not yet received",
      transaction_request_id: transactionRequestId
    });

  } catch (error) {
    console.error("Check login fee status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check payment status: " + (error.message || "Unknown error")
    });
  }
};

// ✅ Get pending payments for admin
exports.getPendingPayments = async (req, res) => {
  try {
    // Users who have attempted payment but not yet approved
    const pendingUsers = await User.find({
      login_fee_paid: false,
      $or: [
        { last_payment_reference: { $ne: null } },
        { "login_fee_pending.status": "PENDING" }
      ]
    }).select("_id full_name phone email last_payment_reference last_payment_attempt login_fee_pending createdAt");

    res.status(200).json({
      success: true,
      pending: pendingUsers
    });
  } catch (error) {
    console.error("Get pending payments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pending payments"
    });
  }
};

// ✅ MANUAL APPROVAL FUNCTION - Admin calls this after verifying payment
exports.manualApprovePayment = async (req, res) => {
  try {
    const { userId, reference, notes } = req.body;
    const adminId = req.user?.id;

    console.log("=== MANUAL APPROVAL ===");
    console.log("Admin ID:", adminId);
    console.log("User ID to approve:", userId);
    console.log("Payment reference:", reference);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.login_fee_paid) {
      return res.status(400).json({
        success: false,
        message: "User already has login fee paid"
      });
    }

    // ✅ Mark user as paid
    user.login_fee_paid = true;
    user.login_fee_paid_at = new Date();
    user.login_fee_approved_by = adminId;
    user.login_fee_approved_reference = reference;
    user.login_fee_approved_notes = notes || "Manually approved by admin";

    // Clear any pending status
    if (user.login_fee_pending) {
      user.login_fee_pending.status = 'APPROVED';
      user.login_fee_pending.approved_at = new Date();
      user.login_fee_pending.approved_by = adminId;
    }

    await user.save();

    console.log(`✅ User ${user.phone} (${user._id}) manually approved for login fee`);

    // Generate token for user
    const token = jwt.sign(
      { id: user._id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "User manually approved successfully",
      token,
      user: {
        id: user._id,
        full_name: user.full_name,
        phone: user.phone,
        login_fee_paid: true
      }
    });

  } catch (error) {
    console.error("Manual approval error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve user: " + error.message
    });
  }
};

// ✅ REMOVED: verifyWithPaystack (Paystack no longer used)
// ✅ REMOVED: verifyLoginFeePayment (auto-approval)
// ✅ REMOVED: paymentWebhook (no automation)
// ✅ REMOVED: submitManualPayment (handled by admin panel)