const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const {
  getTypes,
  getTasks,
  getTaskById,
  submitTask,
  getWorkStats,
  getMySubmissions,
} = require("../controllers/work.controller");

/* ===============================
   💼 WORK TASKS — earner routes
   ===============================
   All routes require a logged-in user. Activation is enforced inside
   submitTask rather than here, so an unactivated earner can still browse the
   catalogue (and be told what activation would unlock) instead of hitting a
   dead 403 on the list itself.

   Fixed paths are declared before /tasks/:taskId, so "types", "stats" and
   "submissions" can never be swallowed as a task id. */

router.get("/types", protect, getTypes);
router.get("/stats", protect, getWorkStats);
router.get("/submissions", protect, getMySubmissions);

router.get("/tasks", protect, getTasks);
router.get("/tasks/:taskId", protect, getTaskById);
router.post("/tasks/:taskId/submit", protect, submitTask);

module.exports = router;
