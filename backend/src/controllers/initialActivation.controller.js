const User = require("../models/User");
const Notification = require("../models/Notification");

const INITIAL_ACTIVATION_FEE = 100;

/* =====================================
   USER — SUBMIT INITIAL ACTIVATION PAYMENT
   KES 100 required before dashboard access
===================================== */
exports.submitInitialActivation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mpesa_code } = req.body;
    const paymentReference = String(mpesa_code || "").trim();

    if (!paymentReference) {
      return res.status(400).json({
        message: "Please enter the M-Pesa payment reference"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already submitted
    if (user.initial_activation && user.initial_activation.status === 'SUBMITTED') {
      return res.status(400).json({
        message: "Payment already submitted and awaiting approval"
      });
    }

    // Check if already approved
    if (user.initial_activation && user.initial_activation.status === 'APPROVED') {
      return res.status(400).json({
        message: "Account already activated"
      });
    }

    // Save the initial activation payment
    user.initial_activation = {
      mpesa_code: paymentReference,
      amount: INITIAL_ACTIVATION_FEE,
      status: 'SUBMITTED',
      submitted_at: new Date()
    };

    await user.save();

    // Create notification
    try {
      const notification = new Notification({
        user_id: user._id,
        title: "📝 Initial Activation Submitted",
        message: "Your account activation payment of KES 100 has been submitted. Awaiting admin approval.",
        action_route: "/activation-payment",
        type: "activation"
      });
      await notification.save();
    } catch (notifError) {
      console.error("Initial activation notification error:", notifError);
    }

    return res.json({
      success: true,
      message: "Payment submitted successfully. Awaiting admin approval.",
      status: "SUBMITTED"
    });
  } catch (error) {
    console.error("❌ Initial activation submit error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =====================================
   USER — CHECK INITIAL ACTIVATION STATUS
===================================== */
exports.getInitialActivationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const status = user.initial_activation?.status || 'PENDING';
    const mpesa_code = user.initial_activation?.mpesa_code || '';
    const submitted_at = user.initial_activation?.submitted_at || null;

    return res.json({
      success: true,
      status: status,
      mpesa_code: mpesa_code,
      submitted_at: submitted_at,
      amount: INITIAL_ACTIVATION_FEE
    });
  } catch (error) {
    console.error("❌ Get initial activation status error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =====================================
   ADMIN — APPROVE INITIAL ACTIVATION
===================================== */
exports.approveInitialActivation = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.initial_activation || user.initial_activation.status !== 'SUBMITTED') {
      return res.status(400).json({
        message: "No pending initial activation for this user"
      });
    }

    // Update status to APPROVED
    user.initial_activation.status = 'APPROVED';
    user.initial_activation.processed_at = new Date();
    
    await user.save();

    // Create notification for approval
    try {
      const notification = new Notification({
        user_id: user._id,
        title: "✅ Account Activated!",
        message: "Your account has been activated! You can now access the dashboard and start earning.",
        action_route: "/dashboard",
        type: "activation"
      });
      await notification.save();
    } catch (notifError) {
      console.error("Initial activation approval notification error:", notifError);
    }

    console.log(`✅ Initial activation approved - User: ${user.full_name}, Phone: ${user.phone}`);

    return res.json({
      success: true,
      message: "Initial activation approved",
      user_id: userId,
      user_name: user.full_name,
      phone: user.phone
    });
  } catch (error) {
    console.error("❌ Approve initial activation error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =====================================
   ADMIN — REJECT INITIAL ACTIVATION
===================================== */
exports.rejectInitialActivation = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.initial_activation || user.initial_activation.status !== 'SUBMITTED') {
      return res.status(400).json({
        message: "No pending initial activation for this user"
      });
    }

    // Update status to REJECTED
    user.initial_activation.status = 'REJECTED';
    user.initial_activation.processed_at = new Date();
    
    await user.save();

    // Create notification for rejection
    try {
      const notification = new Notification({
        user_id: user._id,
        title: "❌ Activation Rejected",
        message: `Your activation payment was rejected. ${reason || 'Please check your M-Pesa payment and try again.'}`,
        action_route: "/activation-payment",
        type: "system"
      });
      await notification.save();
    } catch (notifError) {
      console.error("Initial activation rejection notification error:", notifError);
    }

    return res.json({
      success: true,
      message: "Initial activation rejected",
      user_id: userId
    });
  } catch (error) {
    console.error("❌ Reject initial activation error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =====================================
   ADMIN — GET ALL PENDING INITIAL ACTIVATIONS
===================================== */
exports.getPendingInitialActivations = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    // Find all users with pending initial activations
    const users = await User.find({
      'initial_activation.status': 'SUBMITTED'
    }).select('full_name phone email initial_activation created_at');

    const pendingActivations = users.map(user => ({
      id: user._id,
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      mpesa_code: user.initial_activation.mpesa_code,
      amount: user.initial_activation.amount,
      status: user.initial_activation.status,
      submitted_at: user.initial_activation.submitted_at,
      created_at: user.created_at
    }));

    return res.json({
      success: true,
      count: pendingActivations.length,
      payments: pendingActivations
    });
  } catch (error) {
    console.error("❌ Get pending initial activations error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =====================================
   ADMIN — GET ALL INITIAL ACTIVATIONS
===================================== */
exports.getAllInitialActivations = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    // Find all users with initial activation data
    const users = await User.find({
      'initial_activation.0': { $exists: true }
    }).select('full_name phone email initial_activation created_at');

    const allActivations = users.map(user => ({
      id: user._id,
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      mpesa_code: user.initial_activation?.mpesa_code || '',
      amount: user.initial_activation?.amount || 0,
      status: user.initial_activation?.status || 'PENDING',
      submitted_at: user.initial_activation?.submitted_at,
      processed_at: user.initial_activation?.processed_at,
      created_at: user.created_at
    }));

    // Sort by submission date (newest first)
    allActivations.sort((a, b) => {
      const dateA = a.submitted_at ? new Date(a.submitted_at) : new Date(0);
      const dateB = b.submitted_at ? new Date(b.submitted_at) : new Date(0);
      return dateB - dateA;
    });

    return res.json({
      success: true,
      count: allActivations.length,
      payments: allActivations
    });
  } catch (error) {
    console.error("❌ Get all initial activations error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
