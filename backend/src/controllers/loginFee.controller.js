const User = require("../models/User");
const jwt = require("jsonwebtoken");
const paystackService = require("../services/paystack.service");

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

    // Use user's email or generate one
    const userEmail = user.email || `user_${userId}@surveyearn.com`;
    
    // Initialize Paystack payment
    const payment = await paystackService.initializePayment(
      LOGIN_FEE,
      user.phone,
      userEmail,
      userId,
      "SurveyEarn Login Fee - KES 100"
    );

    console.log("Paystack payment response:", payment);
    console.log("Paystack response keys:", payment.data ? Object.keys(payment.data) : "no data");
    console.log("Full Paystack response:", JSON.stringify(payment, null, 2));

    // For STK Push, the response has reference and status
    const reference = payment.data?.reference;
    const status = payment.data?.status;

    if (!reference) {
      console.error("No reference in STK Push response:", payment);
      return res.status(500).json({ 
        message: "Payment initialization failed. Please try again or contact support.",
        debug: "no_reference"
      });
    }

    res.status(200).json({
      success: true,
      message: status === "success" ? "Payment completed" : "STK Push sent to your phone",
      reference: reference,
      status: status,
      amount: LOGIN_FEE,
      instructions: "Please check your phone for the M-Pesa STK push and enter your PIN"
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
    const { reference } = req.body;
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

    // Verify with Paystack if reference provided
    if (reference) {
      try {
        const verification = await paystackService.verifyPayment(reference);
        console.log("Payment verification response:", verification);
        
        if (verification.data?.status === "success" && verification.data?.amount === LOGIN_FEE * 100) {
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

// Webhook handler for Paystack callbacks
exports.paymentWebhook = async (req, res) => {
  try {
    const event = req.body;
    console.log("Paystack webhook received:", event);
    
    // Verify the event is from Paystack
    const hash = require("crypto")
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");
    
    if (hash !== req.headers["x-paystack-signature"]) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }
    
    // Handle successful payment
    if (event.event === "charge.success") {
      const metadata = event.data?.metadata || {};
      
      if (metadata.type === "login_fee" && metadata.user_id) {
        const user = await User.findById(metadata.user_id);
        if (user && !user.login_fee_paid) {
          user.login_fee_paid = true;
          await user.save();
          console.log(`✅ Login fee paid for user: ${user.phone}`);
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};