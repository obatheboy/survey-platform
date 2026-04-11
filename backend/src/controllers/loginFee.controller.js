const User = require("../models/User");
const jwt = require("jsonwebtoken");
const paystackService = require("../services/paystack.service"); // ✅ FIXED: Use paystack service

const LOGIN_FEE = 100;

exports.initiateLoginFeePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    console.log("=== INITIATE LOGIN FEE PAYMENT ===");
    console.log("User ID:", userId);
    console.log("User phone:", user.phone);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.login_fee_paid) {
      return res.status(400).json({ message: "Login fee already paid" });
    }

    // ✅ Use Paystack service for STK Push (FIXED)
    const payment = await paystackService.initializePayment(
      LOGIN_FEE,
      user.phone,
      user.email,
      userId,
      "Login fee payment"
    );

    console.log("Paystack STK Push response:", payment);

    if (!payment.success) {
      console.error("STK Push failed:", payment);
      return res.status(500).json({ 
        message: "Failed to initiate STK Push. Please try again.",
        debug: payment.message || payment.error
      });
    }

    // ✅ Return response for STK push
    res.status(200).json({
      success: true,
      message: "STK Push sent to your phone. Check your M-Pesa and enter PIN.",
      reference: payment.reference,
      authorization_url: payment.authorization_url,
      amount: LOGIN_FEE,
      phone: user.phone,
      instructions: "Please check your phone for the M-Pesa STK push and enter your PIN"
    });
    
  } catch (error) {
    console.error("Login fee payment error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to initiate payment: " + (error.message || "Unknown error"),
      debug: error.message
    });
  }
};

exports.verifyLoginFeePayment = async (req, res) => {
  try {
    const { reference } = req.body;
    const userId = req.user.id;
    let user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If no reference provided, just check current status
    if (!reference) {
      console.log("No reference provided, checking user login_fee_paid status:", user.login_fee_paid);
      if (user.login_fee_paid) {
        const token = jwt.sign(
          { id: user._id, phone: user.phone, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );
        return res.status(200).json({
          success: true,
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
      return res.status(400).json({ 
        success: false,
        message: "Please initiate payment first to get STK push." 
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

    // Verify with Paystack
    console.log("Verifying payment with reference:", reference);
    const verification = await paystackService.verifyPayment(reference);
    console.log("Verification result:", verification);
    
    if (verification.success && verification.amount >= LOGIN_FEE) {
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

    // If payment not verified yet
    res.status(400).json({ 
      success: false,
      message: "Payment not yet received. Please complete payment first." 
    });
    
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to verify payment" 
    });
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
      success: true,
      login_fee_paid: user.login_fee_paid || false
    });
  } catch (error) {
    console.error("Check status error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to check payment status" 
    });
  }
};

// ✅ Webhook handler for Paystack callbacks (FIXED)
exports.paymentWebhook = async (req, res) => {
  try {
    const crypto = require("crypto");
    const event = req.body;
    console.log("Paystack webhook received:", event.event);
    
    // Verify the event is from Paystack
    const hash = crypto
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
      const userId = metadata.user_id;
      const amount = event.data?.amount / 100;
      
      console.log(`✅ Payment successful! User: ${userId}, Amount: KES ${amount}`);
      
      if (userId) {
        const user = await User.findById(userId);
        if (user && !user.login_fee_paid) {
          user.login_fee_paid = true;
          user.login_fee_paid_at = new Date();
          await user.save();
          console.log(`✅ Login fee marked as paid for user: ${user.phone} (${user._id})`);
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

// ✅ Keep manual payment submission (if you need it)
exports.submitManualPayment = async (req, res) => {
  try {
    const { mpesa_code } = req.body;
    const userId = req.user.id;
    
    if (!mpesa_code || !mpesa_code.trim()) {
      return res.status(400).json({ 
        success: false,
        message: "M-Pesa message or confirmation code is required" 
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
        message: "Login fee already paid" 
      });
    }

    // Store the manual payment for admin approval
    user.login_fee_pending = {
      mpesa_code: mpesa_code.trim(),
      amount: LOGIN_FEE,
      submitted_at: new Date(),
      status: 'PENDING'
    };
    await user.save();

    console.log(`📝 Manual login fee payment submitted by user ${user.phone}`);
    console.log("Stored login_fee_pending:", JSON.stringify(user.login_fee_pending));

    res.status(200).json({
      success: true,
      message: "Payment submitted for admin approval"
    });

  } catch (error) {
    console.error("Manual payment submission error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to submit payment" 
    });
  }
};