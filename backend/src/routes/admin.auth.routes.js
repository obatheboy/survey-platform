const express = require("express");
const router = express.Router();
const { adminLogin } = require("../controllers/admin.auth.controller");
const { adminProtect } = require("../middlewares/auth.middleware");

/* ======================================================
   🔐 ADMIN AUTH ROUTES
====================================================== */

router.post("/login", adminLogin);

// Get current admin user
router.get("/me", adminProtect, (req, res) => {
  res.json({
    id: req.user.id,
    full_name: req.user.full_name,
    email: req.user.email,
    role: req.user.role,
  });
});

module.exports = router;
