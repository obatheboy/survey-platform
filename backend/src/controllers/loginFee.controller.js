const User = require("../models/User");
const jwt = require("jsonwebtoken");
const megaPayService = require("../services/megapay.service");

/**
 * POST /api/login-fee/confirm
 * Frontend calls this after MegaPay confirms payment
 * Verifies transaction with MegaPay and marks user as paid
 * ✅ FIXED: Uses phone number only - no authentication required
 */
const confirmLoginFeePayment = async (req, res) => {
  try {
    const { transaction_request_id, phone } = req.body;

    console.log("=== CONFIRM LOGIN FEE PAYMENT ===");
    console.log("Transaction ID:", transaction_request_id);
    console.log("Phone received:", phone);

    if (!transaction_request_id) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required"
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    // Format phone number to match database format (254XXXXXXXXX)
    let formattedPhone = phone.replace(/\s+/g, '').replace(/-/g, '');
    
    // Remove leading + if present
    if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.substring(1);
    }
    
    // Convert from 07XXXXXXXX to 2547XXXXXXXX
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.substring(1);
    }
    // Convert from 7XXXXXXXX to 2547XXXXXXXX (if 9 digits total)
    else if (formattedPhone.startsWith("7") && formattedPhone.length === 9) {
      formattedPhone = "254" + formattedPhone;
    }
    // Ensure it starts with 254
    else if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone;
    }
    
    console.log("Formatted phone for search:", formattedPhone);

    // Find user by phone number (no auth required - this is the key fix)
    const user = await User.findOne({ 
      phone: formattedPhone
    });

    if (!user) {
      console.log("User not found for phone:", phone, "formatted:", formattedPhone);
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first."
      });
    }

    console.log("User found:", user._id, user.full_name);

    // If already paid, return success with token
    if (user.login_fee_paid) {
      const token = jwt.sign(
        { id: user._id, phone: user.phone, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      return res.status(200).json({
        success: true,
        message: "Already paid",
        login_fee_paid: true,
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
    }

    // Verify with MegaPay directly
    const statusResult = await megaPayService.checkTransactionStatus(transaction_request_id);
    console.log("MegaPay verification result:", statusResult);

    if (statusResult.success && statusResult.completed) {
      // ✅ Payment confirmed - mark user as paid
      user.login_fee_paid = true;
      user.login_fee_paid_at = new Date();
      await user.save();

      console.log(`✅ Login fee marked as paid for: ${user.full_name} (${user.phone})`);

      // Generate token for the user
      const token = jwt.sign(
        { id: user._id, phone: user.phone, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        success: true,
        message: "Payment confirmed and activated",
        login_fee_paid: true,
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
      // Payment not yet completed or failed
      return res.status(400).json({
        success: false,
        message: "Payment not yet confirmed by MegaPay",
        result: statusResult
      });
    }
  } catch (error) {
    console.error("Confirm login fee error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm payment: " + (error.message || "Unknown error")
    });
  }
};

module.exports = {
  confirmLoginFeePayment
};