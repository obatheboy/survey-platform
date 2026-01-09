const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");

const {
  requestWithdraw,
  getUserWithdrawals,
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
 * USER — VIEW OWN WITHDRAWALS
 * GET /api/withdraw/my
 * =====================================
 */
router.get("/my", protect, getUserWithdrawals);

module.exports = router;
