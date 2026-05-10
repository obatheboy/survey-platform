const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect, adminProtect } = require("../middlewares/auth.middleware");
const jwt = require("jsonwebtoken");
const {
  confirmLoginFeePayment,
  // Other endpoints will be added as needed
} = require("../controllers/loginFee.controller");

// ✅ INITIATE LOGIN FEE PAYMENT (KSH 95) via MegaPay STK Push
router.post("/initiate", protect, async (req, res) => {
  try {
    const { phone_number } = req.body;
    if (!phone_number) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    // Generate a unique reference
    const reference = `LOGIN_FEE_${req.user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Import service on-demand to avoid circular dependency
    const megaPayService = require("../services/megapay.service");

    const result = await megaPayService.initiateSTKPush(95, phone_number, reference);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: "STK Push sent successfully",
        transaction_request_id: result.transaction_request_id,
        reference: result.reference || reference,
        phone: result.phone
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || "Failed to initiate payment",
        details: result.details
      });
    }
  } catch (error) {
    console.error("Initiate login fee error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to initiate payment: " + (error.message || "Unknown error")
    });
  }
});

// ✅ CONFIRM LOGIN FEE PAYMENT (Frontend-triggered after MegaPay confirms)
router.post("/confirm", protect, confirmLoginFeePayment);

// ✅ CHECK STATUS - Auto-verification endpoint for frontend polling
router.get("/status", protect, async (req, res) => {
  try {
    const { transaction_request_id } = req.query;

    if (!transaction_request_id) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required"
      });
    }

    // Import service on-demand
    const megaPayService = require("../services/megapay.service");

    // Verify with MegaPay
    const statusResult = await megaPayService.checkTransactionStatus(transaction_request_id);

    if (statusResult.success && statusResult.completed) {
      // Payment confirmed - update user
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

       user.login_fee_paid = true;
       user.login_fee_paid_at = new Date();
       user.login_fee_approved_reference = transaction_request_id;
       await user.save();

       // Generate token
       const token = jwt.sign(
        { id: user._id, phone: user.phone, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        success: true,
        paid: true,
        message: "Payment confirmed",
        token,
        user: {
          id: user._id,
          full_name: user.full_name,
          phone: user.phone,
          email: user.email,
          login_fee_paid: true,
          survey_onboarding_completed: user.survey_onboarding_completed || false
        }
      });
    } else {
      return res.status(200).json({
        success: true,
        paid: false,
        message: "Payment not yet completed",
        status: statusResult.status || "Pending"
      });
    }
  } catch (error) {
    console.error("Check status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check status: " + (error.message || "Unknown error")
    });
  }
});

// ✅ ADMIN ENDPOINTS - For manual approval if needed (admin only)
router.post("/admin/approve", adminProtect, async (req, res) => {
  try {
    const { userId, reference, notes } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.login_fee_paid = true;
    user.login_fee_paid_at = new Date();
    user.login_fee_approved_reference = reference;
    user.login_fee_approved_notes = notes || "Manually approved by admin";
    await user.save();

    res.status(200).json({
      success: true,
      message: "User login fee approved successfully"
    });
  } catch (error) {
    console.error("Manual approve error:", error);
    res.status(500).json({ message: "Failed to approve user" });
  }
});

router.get("/admin/pending", adminProtect, async (req, res) => {
  try {
    const pendingUsers = await User.find({ login_fee_paid: false })
      .select('full_name phone email login_fee_pending created_at')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers
    });
  } catch (error) {
    console.error("Get pending error:", error);
    res.status(500).json({ message: "Failed to get pending payments" });
  }
});

module.exports = router;