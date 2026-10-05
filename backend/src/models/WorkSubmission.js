const mongoose = require("mongoose");
const { TASK_TYPE_ORDER } = require("../config/workTasks");

/* One attempt at one work task.

   MONEY SAFETY
   ------------
   `credited` is the only thing standing between this record and a double
   payout. It is flipped with a conditional update
   (`findOneAndUpdate({ _id, credited: false }, { credited: true })`), so the
   same submission can never be paid twice even if two requests land at once.
   Never credit a submission without winning that update first.

   `creditedAt` and `creditedBy` exist so a credit can be traced back to the
   reviewer (or to "auto") that caused it. */

const workSubmissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkTask",
      required: true,
    },
    /* Denormalised so the admin queue and the user's history render without
       a populate per row. */
    taskId: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: TASK_TYPE_ORDER,
      index: true,
    },
    title: { type: String, required: true, trim: true },

    /* Payout snapshotted at submit time. Approving pays this, not the task's
       current rate, so a rate change cannot re-price work in flight. */
    pay: { type: Number, required: true, min: 0 },

    /* The work itself. `content` holds written prose and transcripts;
       `selectedOption` holds the index chosen on an AI-training task. */
    content: { type: String, default: "" },
    wordCount: { type: Number, default: 0 },
    selectedOption: { type: Number, default: null },

    /* PENDING and AUTO_REVIEW are set on submit; APPROVED and REJECTED are
       set by a reviewer. AUTO_REVIEW means auto-scoring was inconclusive (a
       transcription that drifted too far), so a human decides. */
    status: {
      type: String,
      enum: ["PENDING", "AUTO_APPROVED", "AUTO_REVIEW", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },

    /* 0-1 similarity for transcriptions; null for everything else. */
    autoScore: { type: Number, default: null },

    credited: { type: Boolean, default: false, index: true },
    creditedAt: { type: Date, default: null },
    /* "auto" for instant credit, otherwise the reviewing admin's id. */
    creditedBy: { type: String, default: null },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    reviewNotes: { type: String, default: "" },

    createdAt: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

/* The user's own history, newest first. */
workSubmissionSchema.index({ user: 1, createdAt: -1 });
/* The admin queue: pending work, oldest first. */
workSubmissionSchema.index({ status: 1, createdAt: 1 });
/* "Has this user already been paid for this task?" - the idempotency probe. */
workSubmissionSchema.index({ user: 1, taskId: 1, credited: 1 });

/* A submission is only "open" while it can still turn into money. */
workSubmissionSchema.virtual("isOpen").get(function isOpen() {
  return this.status === "PENDING" || this.status === "AUTO_REVIEW";
});

/* Shape a submission for the user who owns it. */
workSubmissionSchema.methods.toClientJSON = function toClientJSON() {
  return {
    _id: this._id,
    taskId: this.taskId,
    type: this.type,
    title: this.title,
    pay: this.pay,
    status: this.status,
    autoScore: this.autoScore,
    credited: this.credited,
    wordCount: this.wordCount,
    reviewNotes: this.reviewNotes,
    createdAt: this.createdAt,
    reviewedAt: this.reviewedAt,
  };
};

module.exports = mongoose.model("WorkSubmission", workSubmissionSchema);
