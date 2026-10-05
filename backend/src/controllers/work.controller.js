const mongoose = require("mongoose");
const User = require("../models/User");
const WorkTask = require("../models/WorkTask");
const WorkSubmission = require("../models/WorkSubmission");
const { seedWorkTasks } = require("../services/workSeed.service");
const { creditSubmission } = require("../services/workCredit.service");
const { evaluateSubmission } = require("../utils/workEvaluation");
const { countWords } = require("../utils/textMatch");
const {
  TASK_TYPE_ORDER,
  TASK_TYPE_META,
  MAX_AI_ATTEMPTS,
  TASK_TYPES,
  getTaskPay,
  getDailyLimit,
  getTypeFromSlug,
  isTaskType,
} = require("../config/workTasks");

/* The non-survey earning tasks, from the earner's side.

   Everything that can move money routes through creditSubmission() in
   services/workCredit.service.js. Nothing in this file writes to
   `total_earned` directly - do not add such a write.

   The account must be activated before any work is accepted, exactly as
   survey.controller.js requires for surveys. */

const today = () => new Date().toISOString().split("T")[0];

/** Mirrors hasPaidActivationFee() in utils/activationStatus.js. */
function isActivated(user) {
  return (
    user.is_activated === true ||
    user.account_activated === true ||
    user.all_plans_completed === true ||
    user.welcome_bonus_paid === true
  );
}

/** The per-type daily counter, resetting all types when the date rolls over. */
function getDailyCount(user, type) {
  if (user.work_daily_date !== today()) return 0;
  const counts = user.work_daily_counts;
  if (!counts) return 0;
  const value = typeof counts.get === "function" ? counts.get(type) : counts[type];
  return Number(value || 0);
}

/* =========================== LISTING =========================== */

/**
 * GET /work/types
 * The four earning options with this user's progress against each. Backs the
 * cards on the hub, so it must work even for a brand new account.
 */
exports.getTypes = async (req, res) => {
  try {
    await seedWorkTasks();

    const user = await User.findById(req.user.id).select(
      "work_completed_ids work_pending_ids work_daily_date work_daily_counts total_work_earnings is_activated account_activated all_plans_completed welcome_bonus_paid"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const userId = new mongoose.Types.ObjectId(String(req.user.id));

    // One pass over this user's submissions gives credited and pending counts
    // per type; one pass over the catalogue gives how many exist per type.
    const [totals, userTotals] = await Promise.all([
      WorkTask.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$type", total: { $sum: 1 }, topPay: { $max: "$pay" } } },
      ]),
      WorkSubmission.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: "$type",
            credited: { $sum: { $cond: ["$credited", 1, 0] } },
            pending: {
              $sum: {
                $cond: [
                  { $in: ["$status", ["PENDING", "AUTO_REVIEW"]] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
    ]);

    const totalByType = totals.reduce((acc, row) => {
      acc[row._id] = { total: row.total, topPay: row.topPay };
      return acc;
    }, {});
    const userByType = userTotals.reduce((acc, row) => {
      acc[row._id] = row;
      return acc;
    }, {});

    const types = TASK_TYPE_ORDER.map((type) => {
      const meta = TASK_TYPE_META[type];
      const catalogue = totalByType[type] || { total: 0, topPay: getTaskPay(type) };
      const mine = userByType[type] || { credited: 0, pending: 0 };
      const limit = getDailyLimit(type);

      return {
        type,
        slug: meta.slug,
        label: meta.label,
        short: meta.short,
        icon: meta.icon,
        accent: meta.accent,
        blurb: meta.blurb,
        pay: catalogue.topPay || getTaskPay(type),
        totalTasks: catalogue.total,
        completed: mine.credited,
        pending: mine.pending,
        remaining: Math.max(0, catalogue.total - mine.credited),
        doneToday: getDailyCount(user, type),
        dailyLimit: limit,
        remainingToday: Math.max(0, limit - getDailyCount(user, type)),
      };
    });

    return res.json({
      success: true,
      activated: isActivated(user),
      totalWorkEarnings: user.total_work_earnings || 0,
      types,
    });
  } catch (err) {
    console.error("getTypes error:", err);
    return res.status(500).json({ message: "Could not load tasks" });
  }
};

/**
 * GET /work/tasks?type=<slug>
 * Every task of one type, with this user's state on each.
 */
exports.getTasks = async (req, res) => {
  try {
    await seedWorkTasks();

    const type = getTypeFromSlug(req.query.type);
    if (!type) {
      return res.status(400).json({
        message: `Unknown task type. Expected one of: ${TASK_TYPE_ORDER.map(
          (t) => TASK_TYPE_META[t].slug
        ).join(", ")}`,
      });
    }

    const user = await User.findById(req.user.id).select(
      "work_completed_ids work_pending_ids work_daily_date work_daily_counts"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const [tasks, submissions] = await Promise.all([
      WorkTask.find({ type, isActive: true }).sort({ order: 1, taskId: 1 }),
      WorkSubmission.find({ user: user._id, type }).select(
        "taskId status selectedOption reviewNotes createdAt"
      ),
    ]);

    const completedIds = new Set(user.work_completed_ids || []);
    const pendingIds = new Set(user.work_pending_ids || []);

    // Attempts per task drive the AI-training cap, and a last message gives
    // the user feedback on work a reviewer sent back.
    const attemptsByTask = new Map();
    const lastMessageByTask = new Map();
    submissions.forEach((submission) => {
      attemptsByTask.set(
        submission.taskId,
        (attemptsByTask.get(submission.taskId) || 0) + 1
      );
      if (submission.status === "REJECTED" && submission.reviewNotes) {
        lastMessageByTask.set(submission.taskId, submission.reviewNotes);
      }
    });

    const shaped = tasks.map((task) => {
      const clientTask = task.toClientJSON();
      const attempts = attemptsByTask.get(task.taskId) || 0;
      const isCompleted = completedIds.has(task.taskId);
      const isPending = pendingIds.has(task.taskId);

      let state = "available";
      if (isCompleted) state = "completed";
      else if (isPending) state = "pending";
      else if (type === TASK_TYPES.AI_TRAINING && attempts >= MAX_AI_ATTEMPTS) {
        state = "exhausted";
      }

      return {
        ...clientTask,
        state,
        attempts,
        attemptsAllowed: type === TASK_TYPES.AI_TRAINING ? MAX_AI_ATTEMPTS : null,
        lastMessage: lastMessageByTask.get(task.taskId) || "",
        /* The explanation reveals the better reply, so it is only sent once
           the task can no longer be answered: paid, or attempts used up. */
        explanation:
          state === "completed" || state === "exhausted"
            ? task.explanation || ""
            : "",
      };
    });

    const limit = getDailyLimit(type);
    const doneToday = getDailyCount(user, type);

    return res.json({
      success: true,
      type,
      slug: TASK_TYPE_META[type].slug,
      label: TASK_TYPE_META[type].label,
      accent: TASK_TYPE_META[type].accent,
      pay: getTaskPay(type),
      dailyLimit: limit,
      doneToday,
      remainingToday: Math.max(0, limit - doneToday),
      totalTasks: shaped.length,
      completedTasks: shaped.filter((t) => t.state === "completed").length,
      tasks: shaped,
    });
  } catch (err) {
    console.error("getTasks error:", err);
    return res.status(500).json({ message: "Could not load tasks" });
  }
};

/**
 * GET /work/tasks/:taskId
 * A single task. Same answer-key rules as the list: the reference transcript
 * and the correct reply are never included.
 */
exports.getTaskById = async (req, res) => {
  try {
    await seedWorkTasks();

    const task = await WorkTask.findOne({ taskId: req.params.taskId, isActive: true });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const user = await User.findById(req.user.id).select(
      "work_completed_ids work_pending_ids"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const attempts = await WorkSubmission.countDocuments({
      user: user._id,
      taskId: task.taskId,
    });
    const completed = (user.work_completed_ids || []).includes(task.taskId);
    const pending = (user.work_pending_ids || []).includes(task.taskId);
    const exhausted =
      task.type === TASK_TYPES.AI_TRAINING && attempts >= MAX_AI_ATTEMPTS;

    return res.json({
      success: true,
      task: {
        ...task.toClientJSON(),
        state: completed
          ? "completed"
          : pending
          ? "pending"
          : exhausted
          ? "exhausted"
          : "available",
        attempts,
        attemptsAllowed: task.type === TASK_TYPES.AI_TRAINING ? MAX_AI_ATTEMPTS : null,
        explanation:
          completed || exhausted ? task.explanation || "" : "",
      },
    });
  } catch (err) {
    console.error("getTaskById error:", err);
    return res.status(500).json({ message: "Could not load task" });
  }
};

/* =========================== SUBMISSION =========================== */

/**
 * POST /work/tasks/:taskId/submit
 * Body: { content } for written and transcription work,
 *       { selectedOption } for AI training.
 *
 * Outcome depends on the task type:
 *   AI training   correct -> credited now; wrong -> rejected, retryable
 *                 until MAX_AI_ATTEMPTS
 *   Transcription >= pass -> credited now; >= floor -> review queue;
 *                 below floor -> rejected, retryable
 *   Article and Academic -> always the review queue
 */
exports.submitTask = async (req, res) => {
  try {
    await seedWorkTasks();

    const task = await WorkTask.findOne({ taskId: req.params.taskId, isActive: true });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!isActivated(user)) {
      return res.status(403).json({
        success: false,
        message: "Activate your account before taking on paid work.",
        is_activated: false,
      });
    }

    // Already paid: a task can only ever pay once per user.
    if ((user.work_completed_ids || []).includes(task.taskId)) {
      return res.status(400).json({
        success: false,
        message: "You have already been paid for this task.",
        already_completed: true,
      });
    }

    // Awaiting review: block a second submission until a reviewer decides.
    if ((user.work_pending_ids || []).includes(task.taskId)) {
      return res.status(400).json({
        success: false,
        message: "This task is already waiting for review.",
        already_pending: true,
      });
    }

    // Daily cap per type.
    const limit = getDailyLimit(task.type);
    if (getDailyCount(user, task.type) >= limit) {
      return res.status(403).json({
        success: false,
        message: `Daily limit reached. You can complete ${limit} ${TASK_TYPE_META[
          task.type
        ].label.toLowerCase()} tasks per day. Come back tomorrow.`,
        remaining_today: 0,
        limit,
        next_available: "tomorrow",
      });
    }

    // How many times this specific task has been attempted already. Only AI
    // training cares, but the count is cheap and makes the cap explicit.
    const previousAttempts = await WorkSubmission.countDocuments({
      user: user._id,
      taskId: task.taskId,
    });

    const verdict = evaluateSubmission(task, {
      content: req.body?.content,
      selectedOption: req.body?.selectedOption,
      previousAttempts,
    });

    if (!verdict.ok) {
      return res.status(400).json({ success: false, message: verdict.message });
    }

    const wordCount =
      verdict.wordCount ?? (verdict.outcome ? countWords(req.body?.content) : 0);

    const submission = await WorkSubmission.create({
      user: user._id,
      task: task._id,
      taskId: task.taskId,
      type: task.type,
      title: task.title,
      pay: task.pay,
      content: task.type === TASK_TYPES.AI_TRAINING ? "" : String(req.body?.content || "").trim(),
      wordCount,
      selectedOption:
        task.type === TASK_TYPES.AI_TRAINING ? verdict.selectedOption ?? null : null,
      autoScore: verdict.score ?? null,
      status:
        verdict.outcome === "review"
          ? "PENDING"
          : verdict.outcome === "paid"
          ? "AUTO_APPROVED"
          : "REJECTED",
      reviewNotes: verdict.outcome === "rejected" ? verdict.message : "",
    });

    // Count the attempt regardless of outcome: the work was done.
    await consumeDailyAllowance(user, task.type);

    let credited = false;
    let newBalance = user.total_earned || 0;

    if (verdict.outcome === "review") {
      await User.updateOne(
        { _id: user._id },
        { $addToSet: { work_pending_ids: task.taskId } }
      );
    }

    if (verdict.outcome === "paid") {
      const result = await creditSubmission(submission._id, { creditedBy: "auto" });
      credited = result.paid;
      if (result.totalEarned !== null) newBalance = result.totalEarned;
    }

    const attemptsNow = previousAttempts + 1;
    const attemptsLeft =
      task.type === TASK_TYPES.AI_TRAINING
        ? Math.max(0, MAX_AI_ATTEMPTS - attemptsNow)
        : null;

    return res.json({
      success: true,
      outcome: verdict.outcome,
      credited,
      pay: verdict.outcome === "paid" ? task.pay : 0,
      pendingPay: verdict.outcome === "review" ? task.pay : 0,
      message: verdict.message,
      taskId: task.taskId,
      type: task.type,
      autoScore: verdict.score ?? null,
      wordCount,
      attempts: attemptsNow,
      attemptsLeft,
      newBalance,
      /* Only reveal the answer key once the task can no longer be answered,
         so a retry is not just "read the explanation and pick it". */
      explanation:
        verdict.outcome === "paid" || attemptsLeft === 0
          ? task.explanation || ""
          : "",
      remainingToday: Math.max(0, limit - (getDailyCount(user, task.type) + 1)),
    });
  } catch (err) {
    console.error("submitTask error:", err);
    return res.status(500).json({ message: "Could not record your submission" });
  }
};

/**
 * Bump the daily counter for one type.
 *
 * Uses targeted updates rather than saving the loaded document, so it cannot
 * clobber work_completed_ids / work_pending_ids that creditSubmission() has
 * just written on a different copy of the same user.
 */
async function consumeDailyAllowance(user, type) {
  const stamp = today();
  if (user.work_daily_date !== stamp) {
    await User.updateOne(
      { _id: user._id },
      { $set: { work_daily_date: stamp, work_daily_counts: {} } }
    );
  }
  await User.updateOne(
    { _id: user._id },
    { $inc: { [`work_daily_counts.${type}`]: 1 } }
  );
}

/* =========================== STATS =========================== */

/** GET /work/stats - lifetime totals and per-type breakdown for this user. */
exports.getWorkStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "total_work_earnings work_completed_ids work_pending_ids work_daily_date work_daily_counts"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const userId = new mongoose.Types.ObjectId(String(req.user.id));

    const rows = await WorkSubmission.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: "$type",
          submitted: { $sum: 1 },
          credited: { $sum: { $cond: ["$credited", 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0] } },
          pending: {
            $sum: {
              $cond: [{ $in: ["$status", ["PENDING", "AUTO_REVIEW"]] }, 1, 0],
            },
          },
          rejected: { $sum: { $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0] } },
          earned: { $sum: { $cond: ["$credited", "$pay", 0] } },
        },
      },
    ]);

    const byType = rows.reduce((acc, row) => {
      acc[row._id] = row;
      return acc;
    }, {});

    const types = TASK_TYPE_ORDER.map((type) => {
      const row = byType[type] || {
        submitted: 0,
        credited: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        earned: 0,
      };
      return {
        type,
        slug: TASK_TYPE_META[type].slug,
        label: TASK_TYPE_META[type].short,
        accent: TASK_TYPE_META[type].accent,
        pay: getTaskPay(type),
        submitted: row.submitted,
        credited: row.credited,
        approved: row.approved,
        pending: row.pending,
        rejected: row.rejected,
        earned: row.earned,
        doneToday: getDailyCount(user, type),
        dailyLimit: getDailyLimit(type),
        remainingToday: Math.max(0, getDailyLimit(type) - getDailyCount(user, type)),
      };
    });

    return res.json({
      success: true,
      totalEarned: types.reduce((sum, t) => sum + t.earned, 0),
      lifetimeWorkEarnings: user.total_work_earnings || 0,
      completedCount: (user.work_completed_ids || []).length,
      pendingCount: (user.work_pending_ids || []).length,
      types,
    });
  } catch (err) {
    console.error("getWorkStats error:", err);
    return res.status(500).json({ message: "Could not load your work stats" });
  }
};

/** GET /work/submissions - this user's submission history, newest first. */
exports.getMySubmissions = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    const submissions = await WorkSubmission.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({
      success: true,
      submissions: submissions.map((submission) => submission.toClientJSON()),
    });
  } catch (err) {
    console.error("getMySubmissions error:", err);
    return res.status(500).json({ message: "Could not load your submissions" });
  }
};

module.exports.isTaskType = isTaskType;
