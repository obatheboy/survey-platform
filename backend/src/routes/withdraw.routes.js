const express = require("express");
const router = express.Router();

const { protect, adminProtect } = require("../middlewares/auth.middleware");

const {
  requestWithdraw,
  getUserWithdrawalHistory,
  getPendingWithdrawals,
  getAllWithdrawals,
  approveWithdraw,
  rejectWithdraw,
} = require("../controllers/withdraw.controller");

/* =====================================
   USER — REQUEST WITHDRAWAL
   POST /api/withdraw/request
   Body: { phone_number, amount, type }
   type can be 'normal' or 'welcome_bonus'
===================================== */
router.post("/request", protect, requestWithdraw);

/* =====================================
   USER — GET WITHDRAWAL HISTORY
   GET /api/withdraw/history
===================================== */
router.get("/history", protect, getUserWithdrawalHistory);

/* =====================================
   ADMIN — WITHDRAWALS
===================================== */
// Get all pending withdrawals
router.get("/admin/pending", adminProtect, getPendingWithdrawals);

// Get all withdrawals
router.get("/admin/all", adminProtect, getAllWithdrawals);

// Approve a withdrawal
router.patch("/admin/:id/approve", adminProtect, approveWithdraw);

// Reject a withdrawal
router.patch("/admin/:id/reject", adminProtect, rejectWithdraw);

module.exports = router;
