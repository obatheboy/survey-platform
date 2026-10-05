const {
  TASK_TYPES,
  MAX_AI_ATTEMPTS,
  TRANSCRIPTION_PASS_SIMILARITY,
  TRANSCRIPTION_REVIEW_FLOOR,
} = require("../config/workTasks");
const { transcriptSimilarity, countWords } = require("./textMatch");

/* Decides what happens to a submission, with no database involved.

   Kept pure so the money rules can be tested without Mongo, and so the
   controller stays a thin orchestrator. Each evaluator returns a uniform
   shape:

     { ok, outcome, message, ...extras }

   `ok: false` means the request is rejected before anything is written.
   `outcome` is what the submission should become:
     "paid"     - auto-verified and immediately credited
     "review"   - queued for a human reviewer
     "rejected" - recorded but not queued, and retryable

   The bands are deliberately conservative. Paying for bad work costs money;
   sending it to a reviewer only costs time, and a reviewer can always
   approve it. */

/* ---------------------------- AI TRAINING ---------------------------- */

/**
 * An AI-training answer is right or wrong with nothing in between, so there
 * is no review band - a wrong answer is not "close", it is wrong.
 *
 * Attempts are capped: with only two replies to choose from, unlimited
 * retries would let a user guess until correct and be paid for it.
 */
function evaluateAiAnswer(task, { selectedOption, previousAttempts = 0 }) {
  if (selectedOption === null || selectedOption === undefined) {
    return { ok: false, message: "Choose one of the replies." };
  }

  const index = Number(selectedOption);
  const optionCount = (task.options || []).length;

  if (!Number.isInteger(index) || index < 0 || index >= optionCount) {
    return { ok: false, message: "Invalid reply selected." };
  }

  if (previousAttempts >= MAX_AI_ATTEMPTS) {
    return {
      ok: false,
      message: `You have already used your ${MAX_AI_ATTEMPTS} attempts on this task.`,
      attemptsExhausted: true,
    };
  }

  const correct = index === task.correctAnswer;

  return {
    ok: true,
    outcome: correct ? "paid" : "rejected",
    correct,
    selectedOption: index,
    // Always returned, right or wrong, so the task teaches something.
    explanation: task.explanation || "",
    message: correct
      ? "Correct - that is the better reply."
      : "That is not the better reply. Read the explanation and try another task.",
  };
}

/* --------------------------- TRANSCRIPTION --------------------------- */

/**
 * Three bands, not two.
 *
 *   >= pass threshold   the transcript matches the recording -> pay now
 *   >= review floor     close but imperfect -> a human decides
 *   <  review floor     not a transcript of this recording at all -> reject
 *
 * The middle band exists because speech genuinely varies: accent, pace and
 * punctuation choices can push a correct transcript a few words off without
 * the transcriber having done anything wrong. Rejecting those outright would
 * punish good work; paying them blindly would pay for sloppy work.
 */
function evaluateTranscript(task, { content }) {
  const transcript = String(content || "").trim();

  if (!transcript) {
    return { ok: false, message: "Type what you heard before submitting." };
  }

  if (!task.expectedTranscript) {
    // A misconfigured task. Fail closed rather than scoring against nothing.
    return {
      ok: false,
      message: "This task is misconfigured. Please report it.",
    };
  }

  const score = transcriptSimilarity(transcript, task.expectedTranscript);
  const rounded = Math.round(score * 100) / 100;

  if (score >= TRANSCRIPTION_PASS_SIMILARITY) {
    return {
      ok: true,
      outcome: "paid",
      score: rounded,
      message: "Accurate transcript.",
    };
  }

  if (score >= TRANSCRIPTION_REVIEW_FLOOR) {
    return {
      ok: true,
      outcome: "review",
      score: rounded,
      message:
        "Your transcript is close but not an exact match. It has been sent to a reviewer.",
    };
  }

  return {
    ok: true,
    outcome: "rejected",
    score: rounded,
    message:
      "That does not match the recording. Listen again and submit a full transcript.",
  };
}

/* ------------------------ ARTICLE / ACADEMIC ------------------------- */

/**
 * Written work is gated only on length; whether it is any good is a human
 * judgement, which is why these types always land in the review queue.
 *
 * The window is enforced strictly in both directions. An over-length piece is
 * rejected rather than truncated, because the brief asked for a length and
 * the reviewer marks against that ask.
 */
function evaluateWritten(task, { content }) {
  const body = String(content || "").trim();

  if (!body) {
    return { ok: false, message: "Write your submission before submitting." };
  }

  const wordCount = countWords(body);
  const min = task.wordLimits?.min ?? 0;
  const max = task.wordLimits?.max ?? Infinity;

  if (min && wordCount < min) {
    return {
      ok: false,
      message: `Too short: ${wordCount} words. Write at least ${min}.`,
      wordCount,
      wordLimits: { min, max },
    };
  }

  if (Number.isFinite(max) && wordCount > max) {
    return {
      ok: false,
      message: `Too long: ${wordCount} words. Trim to at most ${max}.`,
      wordCount,
      wordLimits: { min, max },
    };
  }

  return {
    ok: true,
    outcome: "review",
    wordCount,
    wordLimits: { min, max },
    message: "Submitted. A reviewer will check your work and then release the payment.",
  };
}

/** Route a submission to the right evaluator for its task type. */
function evaluateSubmission(task, payload = {}) {
  switch (task.type) {
    case TASK_TYPES.AI_TRAINING:
      return evaluateAiAnswer(task, payload);
    case TASK_TYPES.TRANSCRIPTION:
      return evaluateTranscript(task, payload);
    case TASK_TYPES.ARTICLE:
    case TASK_TYPES.ACADEMIC:
      return evaluateWritten(task, payload);
    default:
      return { ok: false, message: "Unknown task type." };
  }
}

module.exports = {
  evaluateSubmission,
  evaluateAiAnswer,
  evaluateTranscript,
  evaluateWritten,
};
