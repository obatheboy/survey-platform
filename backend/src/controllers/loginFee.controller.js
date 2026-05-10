const User = require("../models/User");
const jwt = require("jsonwebtoken");
const megaPayService = require("../services/megapay.service");

/**
 * POST /api/login-fee/confirm
 * Frontend calls this after MegaPay confirms payment
 * This endpoint does NOT require login_fee_paid check (called before user is approved)
 * It directly verifies with MegaPay and marks user as paid
 */
exports.confirmLoginFeePayment = async (req, res) => {
  try {
    const { transaction_request_id, phone, userId } = req.body;

    console.log("=== CONFIRM LOGIN FEE PAYMENT (FRONTEND TRIGGERED) ===");
    console.log("Transaction ID:", transaction_request_id);
    console.log("Phone:", phone);
    console.log("User ID:", userId);

    if (!transaction_request_id) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required"
      });
    }

    // Find user by ID or phone
    const user = await User.findOne({
      $or: [
        { _id: userId },
        { phone: phone }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // If already paid, return success
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
      user.login_fee_approved_reference = transaction_request_id;
      user.login_fee_approved_notes = "Auto-approved via frontend confirmation";
      await user.save();

      console.log(`✅ Login fee marked as paid for: ${user.full_name} (${user.phone})`);

      // Generate token
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

// ✅ EXPORT CONTROLLER FUNCTIONS
module.exports = {
  confirmLoginFeePayment,
  // Other endpoints will be added as needed
};
