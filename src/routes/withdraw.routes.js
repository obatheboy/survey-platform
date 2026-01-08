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
 * =====================================
 */
router.post("/request", protect, requestWithdraw);

/**
 * =====================================
 * ADMIN — WITHDRAWALS
 * =====================================
 */

router.get(
  "/admin/pending",
  protect,
  adminOnly,
  getPendingWithdrawals
);

router.get(
  "/admin/all",
  protect,
  adminOnly,
  getAllWithdrawals
);

router.patch(
  "/admin/:id/approve",
  protect,
  adminOnly,
  approveWithdraw
);

router.patch(
  "/admin/:id/reject",
  protect,
  adminOnly,
  rejectWithdraw
);

module.exports = router;
