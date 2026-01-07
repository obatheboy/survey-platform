const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const {
  requestWithdraw,
  getPendingWithdrawals,
  getAllWithdrawals,
  approveWithdraw,
  rejectWithdraw,
} = require("../controllers/withdraw.controller");

/**
 * =====================================
 * USER — REQUEST WITHDRAWAL
 * POST /api/withdraw/request
 * =====================================
 */
router.post("/request", protect, requestWithdraw);

/**
 * =====================================
 * ADMIN — WITHDRAWALS
 * =====================================
 */

// 🔄 Get pending withdrawals
// GET /api/withdraw/admin/pending
router.get("/admin/pending", protect, getPendingWithdrawals);

// 📋 Get all withdrawals
// GET /api/withdraw/admin/all
router.get("/admin/all", protect, getAllWithdrawals);

// ✅ Approve withdrawal
// PATCH /api/withdraw/admin/:id/approve
router.patch("/admin/:id/approve", protect, approveWithdraw);

// ❌ Reject withdrawal
// PATCH /api/withdraw/admin/:id/reject
router.patch("/admin/:id/reject", protect, rejectWithdraw);

module.exports = router;
