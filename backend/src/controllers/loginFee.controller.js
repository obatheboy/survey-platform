const User = require("../models/User");
const jwt = require("jsonwebtoken");
const paystackService = require("../services/paystack.service");
const LOGIN_FEE = 100;

// ✅ Helper function to format phone numbers (handles 01 and 07)
const formatPhoneForPaystack = (phone) => {
  if (!phone) return null;
  let cleaned = phone.replace(/[^0-9]/g, '');
  
  // Handle 01XXXXXXXX (new Safaricom prefix)
  if (cleaned.startsWith('01')) {
    cleaned = '254' + cleaned.substring(1); // 01XXXXXXXX -> 2541XXXXXXXX
  }
  // Handle 07XXXXXXXX (old Safaricom prefix)
  else if (cleaned.startsWith('07')) {
    cleaned = '254' + cleaned.substring(1); // 07XXXXXXXX -> 2547XXXXXXXX
  }
  // Handle numbers starting with 1 or 7 (no leading 0)
  else if (cleaned.startsWith('1') || cleaned.startsWith('7')) {
    cleaned = '254' + cleaned;
  }
  // Handle numbers already starting with 254
  else if (!cleaned.startsWith('254')) {
    cleaned = '254' + cleaned;
  }
  
  return '+' + cleaned;
};

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

    // ✅ Format phone number correctly (handles 01 and 07)
    const formattedPhone = formatPhoneForPaystack(user.phone);
    console.log("Formatted phone for Paystack:", formattedPhone);
    
    // Use user's email or generate one
    const userEmail = user.email || `user_${userId}@surveyearn.com`;
    
    // ✅ Call paystack service with formatted phone
    const payment = await paystackService.initializePayment(
      LOGIN_FEE,
      formattedPhone,  // ✅ Use formatted phone
      userEmail,
      userId,
      "SurveyEarn Login Fee - KES 100"
    );

    console.log("Paystack payment response:", payment);

    // ✅ Check response structure
    const reference = payment.reference || payment.data?.reference;
    const authorizationUrl = payment.authorization_url || payment.data?.authorization_url;

    if (!reference && !authorizationUrl) {
      console.error("No reference or authorization_url in response:", payment);
      return res.status(500).json({ 
        message: "Payment initialization failed. Please try again.",
        debug: "no_reference_or_url"
      });
    }

    // ✅ Return response for STK push
    res.status(200).json({
      success: true,
      message: "STK Push sent to your phone. Check your M-Pesa and enter PIN.",
      authorization_url: authorizationUrl,
      reference: reference,
      amount: LOGIN_FEE,
      phone: formattedPhone,
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
        message: "No payment reference. Please initiate payment first." 
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

// ✅ Webhook handler for Paystack callbacks (UPDATED)
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
      
      if (userId && (metadata.type === "login_fee" || !metadata.type)) {
        const user = await User.findById(userId);
        if (user && !user.login_fee_paid) {
          user.login_fee_paid = true;
          user.login_fee_paid_at = new Date();
          await user.save();
          console.log(`✅ Login fee marked as paid for user: ${user.phone} (${user._id})`);
        } else if (user) {
          console.log(`User ${userId} already had login_fee_paid = true`);
        } else {
          console.log(`User ${userId} not found`);
        }
      } else {
        console.log("No user_id in metadata or not login_fee type:", metadata);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};