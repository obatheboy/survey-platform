const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middlewares/auth.middleware");
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
router.get(
  "/admin/pending",
  protect,
  adminOnly,
  getPendingWithdrawals
);

// 📋 Get all withdrawals
// GET /api/withdraw/admin/all
router.get(
  "/admin/all",
  protect,
  adminOnly,
  getAllWithdrawals
);

// ✅ Approve withdrawal
// PATCH /api/withdraw/admin/:id/approve
router.patch(
  "/admin/:id/approve",
  protect,
  adminOnly,
  approveWithdraw
);

// ❌ Reject withdrawal
// PATCH /api/withdraw/admin/:id/reject
router.patch(
  "/admin/:id/reject",
  protect,
  adminOnly,
  rejectWithdraw
);

module.exports = router;
