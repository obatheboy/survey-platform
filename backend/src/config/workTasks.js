/* =====================================================
   💼 WORK TASK TYPES - SINGLE SOURCE OF TRUTH
   =====================================================
   The four non-survey earning task types and their money.
   `total_earned` on the user is the only balance that withdrawals
   validate and deduct against, so every payout here credits that field,
   exactly like SURVEY_EARNINGS does in survey.controller.js.

   VERIFICATION MODES
   ------------------
   Real freelance work is not instantly self-verifying. A written article
   cannot be priced by a regex, so this platform splits the four types into
   two verification modes:

     auto   - the submission can be checked server-side against stored
              expected output, so it is credited immediately.
                   AI_TRAINING   (multiple-choice preference tasks)
                   TRANSCRIPTION (transcript compared to a stored reference)

     review - a human must judge the work, so the submission is queued as
              PENDING and the payout is credited only when an admin
              approves it.
                   ARTICLE       (300-600 word article)
                   ACADEMIC      (800-1500 word academic piece)

   Never credit a review-mode submission at submit time. If you do, the
   approval step would pay twice.
   ===================================================== */

const TASK_TYPES = {
  ARTICLE: "ARTICLE",
  AI_TRAINING: "AI_TRAINING",
  ACADEMIC: "ACADEMIC",
  TRANSCRIPTION: "TRANSCRIPTION",
};

/* How each type is verified, and therefore when it pays out. */
const VERIFICATION_MODE = {
  ARTICLE: "review",
  ACADEMIC: "review",
  AI_TRAINING: "auto",
  TRANSCRIPTION: "auto",
};

/* KES paid per completed (and, for review types, approved) task. */
const TASK_PAY = {
  ARTICLE: 150,
  AI_TRAINING: 40,
  ACADEMIC: 300,
  TRANSCRIPTION: 120,
};

/* How many of each type a user may do per day. Article and academic work
   is slow, so the caps are low; AI training is quick and repetitive, so the
   cap is high. The date+count pair is stored on the user like
   daily_survey_date / daily_survey_count. */
const DAILY_LIMITS = {
  ARTICLE: 3,
  AI_TRAINING: 25,
  ACADEMIC: 2,
  TRANSCRIPTION: 5,
};

/* Word-count windows for the two written types. A submission outside its
   window is rejected before it is ever queued, so reviewers only ever see
   work that meets the brief. */
const WORD_LIMITS = {
  ARTICLE: { min: 300, max: 600 },
  ACADEMIC: { min: 800, max: 1500 },
};

/* A transcription must be at least this similar (0-1) to the stored
   reference transcript to be credited automatically. Between the review
   floor and this threshold it is held for a human instead of being rejected,
   because accent and punctuation differences are legitimate. Below the floor
   it is so far from the recording that it is simply rejected, with a retry. */
const TRANSCRIPTION_PASS_SIMILARITY = 0.85;
const TRANSCRIPTION_REVIEW_FLOOR = 0.5;

/* An AI-training task offers only two replies, so a guess has a 50% chance of
   being right. Without a cap, a user could re-answer the same task until they
   got it right and be paid for guessing. Two attempts are allowed - enough to
   absorb a genuine misclick, far too few to farm. */
const MAX_AI_ATTEMPTS = 2;

/* Display metadata. Kept server-side so admin screens and seeded task
   documents share one wording. The frontend mirrors only the parts it
   renders (see src/constants/workTasks.js). */
const TASK_TYPE_META = {
  ARTICLE: {
    label: "Writing Articles",
    short: "Articles",
    slug: "articles",
    icon: "✍️",
    accent: "#7c3aed",
    blurb: "Write short articles from a brief and get paid per approved piece.",
  },
  AI_TRAINING: {
    label: "AI Training",
    short: "AI Training",
    slug: "ai-training",
    icon: "🤖",
    accent: "#06b6d4",
    blurb: "Compare AI answers and teach the model which response is better.",
  },
  ACADEMIC: {
    label: "Academic Writing",
    short: "Academic",
    slug: "academic-writing",
    icon: "🎓",
    accent: "#ea580c",
    blurb: "Research and write longer academic pieces for the highest payout.",
  },
  TRANSCRIPTION: {
    label: "Transcription",
    short: "Transcription",
    slug: "transcription",
    icon: "🎧",
    accent: "#0DAA65",
    blurb: "Type out short recordings. Accurate transcripts are paid instantly.",
  },
};

const TASK_TYPE_ORDER = [
  TASK_TYPES.AI_TRAINING,
  TASK_TYPES.ARTICLE,
  TASK_TYPES.TRANSCRIPTION,
  TASK_TYPES.ACADEMIC,
];

/** Resolve a route slug ("ai-training") back to its type key. */
const getTypeFromSlug = (slug) => {
  const wanted = String(slug || "").trim().toLowerCase();
  return TASK_TYPE_ORDER.find((type) => TASK_TYPE_META[type].slug === wanted) || null;
};

/** Resolve a type key to its route slug. */
const getSlugForType = (type) => {
  const meta = TASK_TYPE_META[String(type || "").toUpperCase()];
  return meta ? meta.slug : null;
};

const isTaskType = (type) =>
  Object.prototype.hasOwnProperty.call(TASK_TYPES, String(type || "").toUpperCase());

/** Payout for a task type, or null when the type is unknown. */
const getTaskPay = (type) => {
  const key = String(type || "").toUpperCase();
  return Object.prototype.hasOwnProperty.call(TASK_PAY, key) ? TASK_PAY[key] : null;
};

const getDailyLimit = (type) => {
  const key = String(type || "").toUpperCase();
  return DAILY_LIMITS[key] ?? 0;
};

const getWordLimits = (type) => WORD_LIMITS[String(type || "").toUpperCase()] || null;

const getVerificationMode = (type) =>
  VERIFICATION_MODE[String(type || "").toUpperCase()] || null;

const isAutoVerified = (type) => getVerificationMode(type) === "auto";

module.exports = {
  TASK_TYPES,
  TASK_TYPE_ORDER,
  TASK_TYPE_META,
  VERIFICATION_MODE,
  TASK_PAY,
  DAILY_LIMITS,
  WORD_LIMITS,
  TRANSCRIPTION_PASS_SIMILARITY,
  TRANSCRIPTION_REVIEW_FLOOR,
  MAX_AI_ATTEMPTS,
  getTypeFromSlug,
  getSlugForType,
  isTaskType,
  getTaskPay,
  getDailyLimit,
  getWordLimits,
  getVerificationMode,
  isAutoVerified,
};
