const User = require("../models/User");
const WorkSubmission = require("../models/WorkSubmission");

/* The ONE place work earnings are credited.

   Both routes that can pay a user - auto-approval at submit time, and admin
   approval of a reviewed submission - call creditSubmission(). Keeping a
   single implementation is the point: two copies would eventually disagree,
   and a disagreement here means money.

   DOUBLE-PAY PROTECTION IS TWO LAYERS DEEP
   ----------------------------------------
   1. The submission is claimed with a conditional update on `credited: false`.
      Only the request that wins that update goes on to pay. A second
      concurrent approve of the same work updates 0 documents and stops.
   2. The user charge is itself conditional on `work_completed_ids` not
      already holding the task. Even if a duplicate submission record existed
      for the same task, the payout update matches nothing and no money moves.

   `total_earned` is the balance withdrawals validate and deduct against
   (see withdraw.controller.js), so that is what is incremented.
   `wallet_balance` is then mirrored to match, exactly as survey.controller.js
   does, for any legacy consumer reading it. */

/**
 * Mark a submission paid and credit its author.
 *
 * @returns {Promise<{
 *   paid: boolean, duplicate: boolean, pay: number,
 *   totalEarned: number|null, submission: object|null
 * }>}
 */
async function creditSubmission(submissionId, { creditedBy = "auto" } = {}) {
  const now = new Date();

  // Layer 1: claim the submission. Losing this race means someone already paid it.
  const claimed = await WorkSubmission.findOneAndUpdate(
    { _id: submissionId, credited: false },
    { $set: { credited: true, creditedAt: now, creditedBy: String(creditedBy) } },
    { new: true }
  );

  if (!claimed) {
    return { paid: false, duplicate: true, pay: 0, totalEarned: null, submission: null };
  }

  // Layer 2: charge the user only if this task has never been paid before.
  const user = await User.findOneAndUpdate(
    { _id: claimed.user, work_completed_ids: { $ne: claimed.taskId } },
    {
      $inc: { total_earned: claimed.pay, total_work_earnings: claimed.pay },
      $addToSet: { work_completed_ids: claimed.taskId },
      $pull: { work_pending_ids: claimed.taskId },
    },
    { new: true, select: "total_earned work_completed_ids" }
  );

  if (!user) {
    // The task was already credited to this user earlier. The submission
    // record is still correctly marked as paid, but no money moves.
    return {
      paid: false,
      duplicate: true,
      pay: 0,
      totalEarned: null,
      submission: claimed,
    };
  }

  // Mirror the balance for legacy readers (same rule as the survey payout).
  await User.updateOne(
    { _id: user._id },
    { $set: { wallet_balance: user.total_earned } }
  );

  return {
    paid: true,
    duplicate: false,
    pay: claimed.pay,
    totalEarned: user.total_earned,
    submission: claimed,
  };
}

/**
 * Reverse a payout. Used when a submission is rejected AFTER it was credited
 * (for example an auto-approved transcription that a reviewer overturns), so
 * a rejection can never leave the user holding money for rejected work.
 */
async function revokeCredit(submissionId, { reason = "rejected" } = {}) {
  const submission = await WorkSubmission.findById(submissionId);
  if (!submission || !submission.credited) {
    return { revoked: false, pay: 0 };
  }

  await WorkSubmission.updateOne(
    { _id: submission._id },
    {
      $set: {
        credited: false,
        creditedAt: null,
        creditedBy: null,
        reviewNotes: reason,
      },
    }
  );

  const user = await User.findOneAndUpdate(
    { _id: submission.user, work_completed_ids: submission.taskId },
    {
      $inc: { total_earned: -submission.pay, total_work_earnings: -submission.pay },
      $pull: { work_completed_ids: submission.taskId },
    },
    { new: true, select: "total_earned work_completed_ids" }
  );

  if (!user) return { revoked: false, pay: 0 };

  // Never let a reversal push a balance below zero.
  const safeBalance = Math.max(0, user.total_earned);
  await User.updateOne(
    { _id: user._id },
    { $set: { total_earned: safeBalance, wallet_balance: safeBalance } }
  );

  return { revoked: true, pay: submission.pay };
}

module.exports = { creditSubmission, revokeCredit };
