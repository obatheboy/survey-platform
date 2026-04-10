const User = require("../models/User");
const jwt = require("jsonwebtoken");
const instasendService = require("../services/instasend.service");

const LOGIN_FEE = 100;

exports.initiateLoginFeePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.login_fee_paid) {
      return res.status(400).json({ message: "Login fee already paid" });
    }

    // Create Instasend payment link
    const payment = await instasendService.createPaymentLink(
      LOGIN_FEE,
      user.phone,
      userId,
      "SurveyEarn Login Fee - KES 100"
    );

    console.log("Instasend payment response:", payment);
    console.log("Payment data keys:", payment.data ? Object.keys(payment.data) : "no data");
    console.log("Full payment response:", JSON.stringify(payment));

    // Extract checkout ID from various possible response structures
    // Try multiple field names that IntaSend might return
    const checkoutId = 
      payment.data?.checkout_id || 
      payment.data?.id || 
      payment.data?.session_id || 
      payment.data?.session?.id ||
      payment?.id ||
      payment?.checkout_id;
      
    const paymentLink = 
      payment.data?.url || 
      payment.data?.checkout_url ||
      payment.data?.link ||
      payment?.url;

    if (!checkoutId && !paymentLink) {
      console.error("No checkout ID or payment link in response:", payment);
      return res.status(500).json({ 
        message: "Payment initialization failed. Please try again or contact support.",
        debug: "no_checkout_id"
      });
    }

    res.status(200).json({
      success: true,
      message: paymentLink ? "Payment link created" : "STK Push sent to your phone",
      checkout_id: checkoutId,
      payment_link: paymentLink,
      amount: LOGIN_FEE,
      instructions: paymentLink 
        ? "Click 'Pay with M-Pesa' to complete payment" 
        : "Please check your phone for the M-Pesa STK push and enter your PIN"
    });
  } catch (error) {
    console.error("Login fee payment error:", error);
    // Return more detailed error for debugging
    const errorMessage = error.message || "Unknown error";
    res.status(500).json({ 
      message: "Failed to initiate payment",
      debug: errorMessage
    });
  }
};

exports.verifyLoginFeePayment = async (req, res) => {
  try {
    const { checkout_id } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.login_fee_paid) {
      const token = jwt.sign(
        { id: user._id, phone: user.phone, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      return res.status(200).json({
        message: "Login fee already paid",
        token,
        user: {
          id: user._id,
          full_name: user.full_name,
          phone: user.phone,
          login_fee_paid: true
        }
      });
    }

    // Verify with Instasend if checkout_id provided
    if (checkout_id) {
      try {
        const verification = await instasendService.verifyPayment(checkout_id);
        console.log("Payment verification response:", verification);
        
        if (verification.data?.status === "COMPLETED" || verification.data?.status === "success") {
          user.login_fee_paid = true;
          await user.save();

          const token = jwt.sign(
            { id: user._id, phone: user.phone, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
          );

          return res.status(200).json({
            message: "Payment verified successfully",
            token,
            user: {
              id: user._id,
              full_name: user.full_name,
              phone: user.phone,
              login_fee_paid: true
            }
          });
        }
      } catch (verifyError) {
        console.error("Payment verification error:", verifyError.message);
      }
    }

    // Manual verification fallback (admin approved)
    if (user.login_fee_paid) {
      const token = jwt.sign(
        { id: user._id, phone: user.phone, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        message: "Payment verified successfully",
        token,
        user: {
          id: user._id,
          full_name: user.full_name,
          phone: user.phone,
          login_fee_paid: true
        }
      });
    }

    res.status(400).json({ message: "Payment not yet received. Please complete payment first." });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ message: "Failed to verify payment" });
  }
};

exports.checkLoginFeeStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      login_fee_paid: user.login_fee_paid || false
    });
  } catch (error) {
    console.error("Check status error:", error);
    res.status(500).json({ message: "Failed to check payment status" });
  }
};

// Webhook handler for Instasend callbacks
exports.paymentWebhook = async (req, res) => {
  try {
    const { checkout_id, status, metadata } = req.body;
    
    if (status === "COMPLETED" && metadata?.user_id) {
      const user = await User.findById(metadata.user_id);
      if (user && !user.login_fee_paid) {
        user.login_fee_paid = true;
        await user.save();
        console.log(`✅ Login fee paid for user: ${user.phone}`);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};
