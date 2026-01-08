const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const adminOnly = require("../middlewares/adminOnly"); // ✅ CORRECT SOURCE

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
router.get(
  "/admin/pending",
  protect,
  adminOnly,
  getPendingWithdrawals
);

// 📋 Get all withdrawals
router.get(
  "/admin/all",
  protect,
  adminOnly,
  getAllWithdrawals
);

// ✅ Approve withdrawal
router.patch(
  "/admin/:id/approve",
  protect,
  adminOnly,
  approveWithdraw
);

// ❌ Reject withdrawal
router.patch(
  "/admin/:id/reject",
  protect,
  adminOnly,
  rejectWithdraw
);

module.exports = router;
