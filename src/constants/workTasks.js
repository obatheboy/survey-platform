/* =====================================================
   💼 WORK TASK TYPES - FRONTEND MIRROR
   =====================================================
   MUST match backend/src/config/workTasks.js.

   The backend pays these amounts by task type and enforces the daily caps, so
   the numbers here are for display only. If they drift, the app advertises
   one figure and credits another - treat the two files as a single unit, the
   same way src/constants/fees.js mirrors backend/src/config/fees.js.

   Icons and accent colours live here because they are presentation, and the
   backend has no opinion about them. */

export const TASK_TYPES = {
  ARTICLE: "ARTICLE",
  AI_TRAINING: "AI_TRAINING",
  ACADEMIC: "ACADEMIC",
  TRANSCRIPTION: "TRANSCRIPTION",
};

/* Order shown on the earning hub: quickest and most approachable first. */
export const TASK_TYPE_ORDER = [
  TASK_TYPES.AI_TRAINING,
  TASK_TYPES.ARTICLE,
  TASK_TYPES.TRANSCRIPTION,
  TASK_TYPES.ACADEMIC,
];

/* KES per completed (and, for review types, approved) task. */
export const TASK_PAY = {
  ARTICLE: 150,
  AI_TRAINING: 40,
  ACADEMIC: 300,
  TRANSCRIPTION: 120,
};

/* How many of each type a user may submit per day. */
export const DAILY_LIMITS = {
  ARTICLE: 3,
  AI_TRAINING: 25,
  ACADEMIC: 2,
  TRANSCRIPTION: 5,
};

/* Word-count windows enforced by the backend for the two written types. */
export const WORD_LIMITS = {
  ARTICLE: { min: 300, max: 600 },
  ACADEMIC: { min: 800, max: 1500 },
};

/* "auto" pays the moment the work is validated; "review" pays when a human
   approves it. Shown in the UI so nobody is surprised by a pending payout. */
export const VERIFICATION_MODE = {
  ARTICLE: "review",
  ACADEMIC: "review",
  AI_TRAINING: "auto",
  TRANSCRIPTION: "auto",
};

/* Answers an AI-training task is capped at, so guessing cannot be farmed. */
export const MAX_AI_ATTEMPTS = 2;

export const TASK_TYPE_META = {
  ARTICLE: {
    label: "Writing Articles",
    short: "Articles",
    slug: "articles",
    icon: "✍️",
    accent: "#7c3aed",
    softAccent: "#f5f3ff",
    blurb: "Write a short article from a brief. A reviewer checks it, then you are paid.",
    effort: "300-600 words",
  },
  AI_TRAINING: {
    label: "AI Training",
    short: "AI Training",
    slug: "ai-training",
    icon: "🤖",
    accent: "#06b6d4",
    softAccent: "#ecfeff",
    blurb: "Read two AI replies and pick the better one. Paid instantly when correct.",
    effort: "2-3 minutes",
  },
  ACADEMIC: {
    label: "Academic Writing",
    short: "Academic",
    slug: "academic-writing",
    icon: "🎓",
    accent: "#ea580c",
    softAccent: "#fff7ed",
    blurb: "Longer reasoned pieces. The highest payout of any task on the platform.",
    effort: "800-1500 words",
  },
  TRANSCRIPTION: {
    label: "Transcription",
    short: "Transcription",
    slug: "transcription",
    icon: "🎧",
    accent: "#0DAA65",
    softAccent: "#ecfdf5",
    blurb: "Listen to a short clip and type what you hear. Accurate work is paid instantly.",
    effort: "5-7 minutes",
  },
};

/** Route slug -> type key. Returns null for anything unrecognised. */
export const getTypeFromSlug = (slug) => {
  const wanted = String(slug || "").trim().toLowerCase();
  return TASK_TYPE_ORDER.find((type) => TASK_TYPE_META[type].slug === wanted) || null;
};

/** Type key -> route slug. */
export const getSlugForType = (type) => {
  const meta = TASK_TYPE_META[String(type || "").toUpperCase()];
  return meta ? meta.slug : null;
};

export const getTaskPay = (type) =>
  TASK_PAY[String(type || "").toUpperCase()] ?? 0;

export const getDailyLimit = (type) =>
  DAILY_LIMITS[String(type || "").toUpperCase()] ?? 0;

export const getWordLimits = (type) =>
  WORD_LIMITS[String(type || "").toUpperCase()] || null;

export const isAutoVerified = (type) =>
  VERIFICATION_MODE[String(type || "").toUpperCase()] === "auto";

/* Human wording for a submission status coming back from the backend. */
export const STATUS_LABELS = {
  PENDING: { label: "In review", tone: "pending" },
  AUTO_REVIEW: { label: "In review", tone: "pending" },
  AUTO_APPROVED: { label: "Paid", tone: "paid" },
  APPROVED: { label: "Approved", tone: "paid" },
  REJECTED: { label: "Needs another try", tone: "rejected" },
};

export default {
  TASK_TYPES,
  TASK_TYPE_ORDER,
  TASK_TYPE_META,
  TASK_PAY,
  DAILY_LIMITS,
  WORD_LIMITS,
  VERIFICATION_MODE,
  MAX_AI_ATTEMPTS,
  STATUS_LABELS,
};
