const mongoose = require("mongoose");
const User = require("../models/User");
const WorkTask = require("../models/WorkTask");
const WorkSubmission = require("../models/WorkSubmission");
const { creditSubmission, revokeCredit } = require("../services/workCredit.service");
const {
  TASK_TYPE_ORDER,
  TASK_TYPE_META,
  getTypeFromSlug,
  getTaskPay,
} = require("../config/workTasks");

/* The reviewer's side of the work queue.

   Only article, academic and mid-band transcription work ever reaches this
   queue - AI-training answers and accurate transcripts are settled at submit
   time and never appear here.

   Admin responses deliberately DO include the answer key (the correct reply
   and the reference transcript). A reviewer cannot judge a transcription
   without the transcript, so the rule that keeps those fields away from
   earners does not apply here. Do not reuse these shapes on a user route. */

const REVIEWABLE_STATUSES = ["PENDING", "AUTO_REVIEW"];

/** GET /work/admin/overview - queue depth and payouts at a glance. */
exports.getWorkOverview = async (req, res) => {
  try {
    const liveStatuses = ["PENDING", "AUTO_REVIEW"];

    const [queueByType, totals] = await Promise.all([
      WorkSubmission.aggregate([
        { $match: { status: { $in: liveStatuses } } },
        { $group: { _id: "$type", count: { $sum: 1 }, value: { $sum: "$pay" } } },
      ]),
      WorkSubmission.aggregate([
        { $match: { credited: true } },
        { $group: { _id: "$type", count: { $sum: 1 }, paid: { $sum: "$pay" } } },
      ]),
    ]);

    const queueMap = queueByType.reduce((acc, row) => {
      acc[row._id] = row;
      return acc;
    }, {});
    const paidMap = totals.reduce((acc, row) => {
      acc[row._id] = row;
      return acc;
    }, {});

    const types = TASK_TYPE_ORDER.map((type) => ({
      type,
      slug: TASK_TYPE_META[type].slug,
      label: TASK_TYPE_META[type].label,
      accent: TASK_TYPE_META[type].accent,
      pay: getTaskPay(type),
      awaitingReview: queueMap[type]?.count || 0,
      awaitingValue: queueMap[type]?.value || 0,
      paidCount: paidMap[type]?.count || 0,
      paidTotal: paidMap[type]?.paid || 0,
    }));

    const [oldest, totalUsers] = await Promise.all([
      WorkSubmission.findOne({ status: { $in: liveStatuses } }).sort({ createdAt: 1 }),
      WorkSubmission.distinct("user", { status: { $in: liveStatuses } }),
    ]);

    return res.json({
      success: true,
      totalAwaitingReview: types.reduce((sum, t) => sum + t.awaitingReview, 0),
      totalAwaitingValue: types.reduce((sum, t) => sum + t.awaitingValue, 0),
      totalPaid: types.reduce((sum, t) => sum + t.paidTotal, 0),
      totalPaidCount: types.reduce((sum, t) => sum + t.paidCount, 0),
      earnersInQueue: totalUsers.length,
      oldestSubmissionAt: oldest?.createdAt || null,
      types,
    });
  } catch (err) {
    console.error("getWorkOverview error:", err);
    return res.status(500).json({ message: "Could not load the work overview" });
  }
};

/**
 * GET /work/admin/submissions
 * Query: status (pending|approved|rejected|all), type (slug), page, limit.
 * Oldest first by default, because a queue should be worked front to back.
 */
exports.getSubmissions = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Math.max(1, Number(req.query.limit) || 25), 100);

    const filter = {};

    const status = String(req.query.status || "pending").toLowerCase();
    if (status === "pending" || status === "review") {
      filter.status = { $in: REVIEWABLE_STATUSES };
    } else if (status === "approved") {
      filter.status = "APPROVED";
    } else if (status === "rejected") {
      filter.status = "REJECTED";
    } else if (status === "paid") {
      filter.credited = true;
    }
    // "all" leaves the filter open.

    if (req.query.type) {
      const type = getTypeFromSlug(req.query.type);
      if (!type) return res.status(400).json({ message: "Unknown task type" });
      filter.type = type;
    }

    const [submissions, total] = await Promise.all([
      WorkSubmission.find(filter)
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("user", "full_name phone email")
        .lean(),
      WorkSubmission.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      submissions: submissions.map((submission) => ({
        id: submission._id,
        taskId: submission.taskId,
        type: submission.type,
        typeLabel: TASK_TYPE_META[submission.type]?.label || submission.type,
        title: submission.title,
        pay: submission.pay,
        status: submission.status,
        credited: submission.credited,
        creditedBy: submission.creditedBy,
        autoScore: submission.autoScore,
        wordCount: submission.wordCount,
        preview: (submission.content || "").slice(0, 220),
        reviewNotes: submission.reviewNotes,
        createdAt: submission.createdAt,
        reviewedAt: submission.reviewedAt,
        user: submission.user
          ? {
              id: submission.user._id,
              fullName: submission.user.full_name,
              phone: submission.user.phone,
              email: submission.user.email,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error("getSubmissions error:", err);
    return res.status(500).json({ message: "Could not load submissions" });
  }
};

/**
 * GET /work/admin/submissions/:id
 * Full submission plus the task it answers, including the answer key - a
 * reviewer cannot check a transcription without the reference transcript.
 */
exports.getSubmissionById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid submission id" });
    }

    const submission = await WorkSubmission.findById(req.params.id)
      .populate("user", "full_name phone email total_earned")
      .lean();

    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const task = await WorkTask.findById(submission.task).lean();

    return res.json({
      success: true,
      submission: {
        id: submission._id,
        taskId: submission.taskId,
        type: submission.type,
        typeLabel: TASK_TYPE_META[submission.type]?.label || submission.type,
        title: submission.title,
        pay: submission.pay,
        status: submission.status,
        credited: submission.credited,
        creditedBy: submission.creditedBy,
        creditedAt: submission.creditedAt,
        autoScore: submission.autoScore,
        wordCount: submission.wordCount,
        content: submission.content,
        selectedOption: submission.selectedOption,
        reviewNotes: submission.reviewNotes,
        createdAt: submission.createdAt,
        reviewedAt: submission.reviewedAt,
        user: submission.user
          ? {
              id: submission.user._id,
              fullName: submission.user.full_name,
              phone: submission.user.phone,
              email: submission.user.email,
              totalEarned: submission.user.total_earned,
            }
          : null,
      },
      /* The judge's view of the task. `expectedTranscript` and
         `correctAnswer` are here on purpose - see the file header. */
      task: task
        ? {
            taskId: task.taskId,
            title: task.title,
            type: task.type,
            category: task.category,
            brief: task.brief,
            instructions: task.instructions || [],
            reviewerNotes: task.reviewerNotes || "",
            requiredSections: task.requiredSections || [],
            wordLimits: task.wordLimits || null,
            prompt: task.prompt || "",
            options: task.options || [],
            correctAnswer: task.correctAnswer ?? null,
            explanation: task.explanation || "",
            spokenText: task.spokenText || "",
            expectedTranscript: task.expectedTranscript || "",
          }
        : null,
    });
  } catch (err) {
    console.error("getSubmissionById error:", err);
    return res.status(500).json({ message: "Could not load the submission" });
  }
};

/**
 * POST /work/admin/submissions/:id/approve
 * Body: { notes }
 *
 * Marks the submission approved and pays it. creditSubmission() is the only
 * thing that moves money; its internal guards make a double approval
 * harmless - the second one updates nothing.
 */
exports.approveSubmission = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid submission id" });
    }

    const submission = await WorkSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    if (submission.status === "REJECTED") {
      return res.status(400).json({
        message: "This submission was rejected. The earner must resubmit it.",
      });
    }

    if (submission.credited) {
      return res.status(400).json({
        success: false,
        message: "This submission has already been paid.",
        already_credited: true,
      });
    }

    const notes = String(req.body?.notes || "").trim().slice(0, 1000);

    await WorkSubmission.updateOne(
      { _id: submission._id },
      {
        $set: {
          status: "APPROVED",
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          reviewNotes: notes || "Approved",
        },
      }
    );

    const result = await creditSubmission(submission._id, {
      creditedBy: String(req.user.id),
    });

    return res.json({
      success: true,
      message: result.paid
        ? `Approved and paid KES ${result.pay}.`
        : "Already paid - no further credit was issued.",
      paid: result.paid,
      amount: result.pay,
      submissionId: submission._id,
      taskId: submission.taskId,
    });
  } catch (err) {
    console.error("approveSubmission error:", err);
    return res.status(500).json({ message: "Could not approve the submission" });
  }
};

/**
 * POST /work/admin/submissions/:id/reject
 * Body: { reason }
 *
 * If the submission was already auto-credited (a transcription approved by
 * score that a reviewer overturns, say), the money is taken back so a
 * rejection can never leave someone holding payment for rejected work.
 * The task id is released from work_pending_ids so the earner can retry.
 */
exports.rejectSubmission = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid submission id" });
    }

    const submission = await WorkSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    if (submission.status === "APPROVED") {
      return res.status(400).json({
        message: "This submission is already approved. Reversing it is not supported.",
      });
    }

    const reason =
      String(req.body?.reason || "").trim().slice(0, 1000) ||
      "Did not meet the brief. Please read the instructions and resubmit.";

    await WorkSubmission.updateOne(
      { _id: submission._id },
      {
        $set: {
          status: "REJECTED",
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          reviewNotes: reason,
        },
      }
    );

    let amountReversed = 0;
    if (submission.credited) {
      const reversal = await revokeCredit(submission._id, { reason });
      amountReversed = reversal.revoked ? reversal.pay : 0;
    }

    // Release the task so it can be attempted again.
    await User.updateOne(
      { _id: submission.user },
      { $pull: { work_pending_ids: submission.taskId } }
    );

    return res.json({
      success: true,
      message: "Submission rejected. The earner can try again.",
      reversedAmount: amountReversed,
      submissionId: submission._id,
      taskId: submission.taskId,
    });
  } catch (err) {
    console.error("rejectSubmission error:", err);
    return res.status(500).json({ message: "Could not reject the submission" });
  }
};

module.exports.REVIEWABLE_STATUSES = REVIEWABLE_STATUSES;
