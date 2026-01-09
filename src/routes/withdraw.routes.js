const express = require("express");
const router = express.Router();

const { protect, adminProtect } = require("../middlewares/auth.middleware");

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
router.get("/admin/pending", adminProtect, getPendingWithdrawals);

router.get("/admin/all", adminProtect, getAllWithdrawals);

router.patch("/admin/:id/approve", adminProtect, approveWithdraw);

router.patch("/admin/:id/reject", adminProtect, rejectWithdraw);

module.exports = router;
