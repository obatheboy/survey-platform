const User = require("../models/User");
const jwt = require("jsonwebtoken");
const paystackService = require("../services/paystack.service");
const https = require("https");

const LOGIN_FEE = 100;
const PAYNECTA_API_URL = "https://paynecta.co.ke/api";
const PAYNECTA_API_KEY = process.env.PAYNECTA_API_KEY;

// ✅ Initiate STK Push - NO AUTO APPROVAL, just sends STK
exports.initiateLoginFeePayment = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    const user = await User.findById(userId);
    
    console.log("=== INITIATE LOGIN FEE PAYMENT (STK PUSH ONLY) ===");
    console.log("User ID:", userId);
    console.log("User phone:", user?.phone);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.login_fee_paid) {
      return res.status(400).json({ message: "Login fee already paid" });
    }

    // ✅ Send STK push only - NO auto approval
    const payment = await paystackService.chargeMpesa(
      LOGIN_FEE,
      user.phone,
      user.email,
      userId
    );

    console.log("Paystack STK Push response:", payment);

    if (!payment.success) {
      console.error("STK Push failed:", payment);
      return res.status(500).json({ 
        success: false,
        message: "Failed to initiate STK Push. Please try again.",
        debug: payment.message
      });
    }

    // ✅ Store reference so admin can verify later
    user.last_payment_reference = payment.reference;
    user.last_payment_attempt = new Date();
    await user.save();

    // ✅ Return success - NO auto approval, user stays in app
    res.status(200).json({
      success: true,
      message: "STK Push sent to your phone. Check your M-Pesa and enter PIN.",
      reference: payment.reference,
      amount: LOGIN_FEE,
      phone: user.phone,
      requires_manual_approval: true,
      instructions: "Please check your phone for the M-Pesa STK push and enter your PIN. Admin will approve after verification."
    });
    
  } catch (error) {
    console.error("Login fee payment error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to initiate payment: " + (error.message || "Unknown error")
    });
  }
};

// ✅ Check payment status - for frontend to poll
exports.checkLoginFeeStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.body?.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      login_fee_paid: user.login_fee_paid || false,
      pending_approval: user.login_fee_pending?.status === 'PENDING' || false
    });
  } catch (error) {
    console.error("Check status error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to check payment status" 
    });
  }
};

// ✅ MANUAL APPROVAL FUNCTION - Admin calls this after verifying payment in Paystack dashboard
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

// ✅ Initiate Paynecta Payment
exports.initiatePaynectaPayment = async (req, res) => {
  try {
    const { userId, slug, amount } = req.body;
    const user = await User.findById(userId);
    
    console.log("=== INITIATE PAYNECTA PAYMENT ===");
    console.log("User ID:", userId);
    console.log("Slug:", slug);
    console.log("Amount:", amount);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.login_fee_paid) {
      return res.status(400).json({ message: "Login fee already paid" });
    }

    // Create payment reference
    const reference = `PAYN_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Store reference for verification
    user.last_payment_reference = reference;
    user.last_payment_attempt = new Date();
    user.payment_method = "paynecta";
    await user.save();

    // Return payment URL for widget
    res.status(200).json({
      success: true,
      message: "Payment initiated",
      reference: reference,
      paymentUrl: `https://paynecta.co.ke/pay/${slug}?amount=${amount}&phone=${user.phone}&reference=${reference}`,
      amount: amount,
      phone: user.phone,
      requires_verification: true
    });
    
  } catch (error) {
    console.error("Paynecta payment error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to initiate payment: " + (error.message || "Unknown error")
    });
  }
};

// ✅ Verify payment with Paystack (optional - admin can use to check before approving)
exports.verifyWithPaystack = async (req, res) => {
  try {
    const { reference } = req.body;
    
    if (!reference) {
      return res.status(400).json({ 
        success: false,
        message: "Payment reference required" 
      });
    }
    
    const verification = await paystackService.verifyPayment(reference);
    
    res.status(200).json({
      success: true,
      verified: verification.success,
      amount: verification.amount,
      status: verification.status,
      paid_at: verification.paid_at
    });
    
  } catch (error) {
    console.error("Verify with Paystack error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to verify payment: " + error.message
    });
  }
};

// ✅ REMOVED: verifyLoginFeePayment (auto-approval)
// ✅ REMOVED: paymentWebhook (no automation)
// ✅ REMOVED: submitManualPayment (handled by admin panel)