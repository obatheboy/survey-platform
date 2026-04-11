const User = require("../models/User");
const jwt = require("jsonwebtoken");
const mpesaService = require("../services/mpesa.service");
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

    // ✅ Use M-Pesa service for STK Push
    const payment = await mpesaService.stkPush(
      LOGIN_FEE,
      user.phone,
      userId
    );

    console.log("M-Pesa STK Push response:", payment);

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
      checkoutRequestId: payment.checkoutRequestId,
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

    // Verify with M-Pesa
    console.log("Verifying payment with checkoutRequestId:", reference);
    const verification = await mpesaService.verifyPayment(reference, LOGIN_FEE);
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

// ✅ Webhook handler for M-Pesa callbacks
exports.mpesaCallback = async (req, res) => {
  try {
    const callbackData = req.body;
    console.log("M-Pesa callback received:", JSON.stringify(callbackData));
    
    const result = callbackData.Body?.stkCallback;
    if (!result) {
      console.error("Invalid M-Pesa callback: no stkCallback");
      return res.status(400).json({ error: "Invalid callback" });
    }
    
    const resultCode = result.ResultCode;
    const resultDesc = result.ResultDesc;
    const checkoutRequestId = result.CheckoutRequestID;
    const metadata = result.MetaData;
    const userId = metadata?.ExternalReference || req.query.userId;
    const paymentType = req.query.type || 'login_fee';
    
    console.log(`M-Pesa callback: ResultCode=${resultCode}, CheckoutRequestID=${checkoutRequestId}, userId=${userId}, type=${paymentType}`);
    
    // Handle failed payment (ResultCode other than 0)
    if (resultCode !== 0) {
      console.error(`M-Pesa payment failed: ${resultDesc}`);
      res.status(400).json({ 
        success: false,
        error: resultDesc
      });
      return;
    }
    
    // Successful payment
    const amount = result.Amount || LOGIN_FEE;
    console.log(`✅ M-Pesa payment successful! User: ${userId}, Amount: KES ${amount}, Type: ${paymentType}`);
    
    if (!userId) {
      console.error("No userId in callback");
      res.status(400).json({ error: "User ID missing" });
      return;
    }
    
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found: ${userId}`);
      res.status(404).json({ error: "User not found" });
      return;
    }
    
    // Handle login_fee payment type
    if (paymentType === 'login_fee') {
      if (!user.login_fee_paid) {
        user.login_fee_paid = true;
        user.login_fee_paid_at = new Date();
        await user.save();
        console.log(`✅ Login fee marked as paid for user: ${user.phone} (${user._id})`);
      }
    } 
    // Handle activation payment type (welcome bonus, VIP, VVIP)
    else if (paymentType === 'activation') {
      // Find the pending activation request
      const pendingRequest = user.activation_requests?.find(
        r => r.status === "SUBMITTED" && r.amount === parseInt(amount)
      );
      
      if (pendingRequest) {
        pendingRequest.status = "APPROVED";
        pendingRequest.processed_at = new Date();
        
        // Activate the requested plan
        const planKey = pendingRequest.plan;
        if (planKey && user.plans?.[planKey]) {
          user.plans[planKey].is_activated = true;
          user.plans[planKey].activated_at = new Date();
          
          // Also set overall is_activated
          user.is_activated = true;
          
          console.log(`✅ ${planKey} plan activated for user: ${user.phone} (${user._id})`);
        }
      }
      await user.save();
    }
    
    res.status(200).json({ 
      success: true,
      message: "Payment processed successfully"
    });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    res.status(500).json({ error: "Callback processing failed" });
  }
};

// ✅ Legacy webhook (kept for compatibility)
exports.paymentWebhook = async (req, res) => {
  // Redirect to new M-Pesa callback handler
  return exports.mpesaCallback(req, res);
};

// ✅ Manual M-Pesa payment submission
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

    // Check if there's already a pending manual payment
    if (user.login_fee_pending && user.login_fee_pending.status === 'PENDING') {
      return res.status(400).json({ 
        success: false,
        message: "You already have a pending payment. Please wait for admin approval." 
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

    console.log(`📝 Manual login fee payment submitted by user ${user.phone}:`, mpesa_code.substring(0, 50));
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