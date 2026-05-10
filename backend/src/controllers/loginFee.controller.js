const User = require("../models/User");
const jwt = require("jsonwebtoken");
const megaPayService = require("../services/megapay.service");

/**
 * POST /api/login-fee/confirm
 * Frontend calls this after MegaPay confirms payment
 * ✅ FIXED: No auth required, uses phone only
 */
const confirmLoginFeePayment = async (req, res) => {
  try {
    console.log("=== CONFIRM LOGIN FEE PAYMENT ===");
    console.log("Request body:", req.body);
    
    const { transaction_request_id, phone } = req.body;

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

    // 🔍 FIXED: Try multiple phone formats to find user
    console.log("🔍 [LoginFee] Searching for user with phone:", phone);
    
    // 1️⃣ Try raw phone first (as stored during registration)
    let user = await User.findOne({ phone: phone.trim() });
    
    // 2️⃣ If not found, try formatted international (254...) format
    if (!user) {
      let formattedPhone = phone.replace(/\s+/g, '').replace(/-/g, '');
      if (formattedPhone.startsWith("+")) formattedPhone = formattedPhone.substring(1);
      if (formattedPhone.startsWith("0")) formattedPhone = "254" + formattedPhone.substring(1);
      if (formattedPhone.startsWith("7") && formattedPhone.length === 9) formattedPhone = "254" + formattedPhone;
      if (!formattedPhone.startsWith("254")) formattedPhone = "254" + formattedPhone;
      
      console.log("🔍 [LoginFee] Raw phone not found, trying formatted:", formattedPhone);
      user = await User.findOne({ phone: formattedPhone });
    }

    if (!user) {
      console.log("❌ [LoginFee] User not found with any format");
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first."
      });
    }

    console.log("✅ [LoginFee] User found:", user._id, user.full_name, " Paid:", user.login_fee_paid);

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

    const statusResult = await megaPayService.checkTransactionStatus(transaction_request_id);
    console.log("MegaPay result:", statusResult);

    if (statusResult.success && statusResult.completed) {
      user.login_fee_paid = true;
      user.login_fee_paid_at = new Date();
      await user.save();

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
      return res.status(200).json({
        success: false,
        message: "Payment not yet confirmed by MegaPay",
        paid: false
      });
    }
  } catch (error) {
    console.error("❌ Confirm login fee error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm payment: " + (error.message || "Unknown error")
    });
  } finally {
    console.log("✅ [LoginFee] /confirm response sent - Status:", res.statusCode);
  }
};

module.exports = {
  confirmLoginFeePayment
};