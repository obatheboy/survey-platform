const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const taskActivationController = require("../controllers/taskActivation.controller");

router.post("/initiate", protect, taskActivationController.initiateTaskActivation);
router.post("/confirm", protect, taskActivationController.confirmTaskActivation);
router.get("/status", protect, taskActivationController.getTaskActivationStatus);

module.exports = router;
