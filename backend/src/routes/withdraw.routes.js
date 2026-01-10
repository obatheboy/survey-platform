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

/* =====================================
   USER — REQUEST WITHDRAWAL
   POST /api/withdraw/request
===================================== */
router.post("/request", protect, requestWithdraw);

/* =====================================
   ADMIN — WITHDRAWALS
   GET /api/withdraw/admin/pending
   GET /api/withdraw/admin/all
   PATCH /api/withdraw/admin/:id/approve
   PATCH /api/withdraw/admin/:id/reject
===================================== */
router.get("/admin/pending", adminProtect, getPendingWithdrawals);
router.get("/admin/all", adminProtect, getAllWithdrawals);
router.patch("/admin/:id/approve", adminProtect, approveWithdraw);
router.patch("/admin/:id/reject", adminProtect, rejectWithdraw);

module.exports = router;
