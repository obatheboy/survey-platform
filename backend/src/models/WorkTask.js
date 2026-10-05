const mongoose = require("mongoose");
const {
  TASK_TYPE_ORDER,
  TASK_TYPES,
  TASK_PAY,
  WORD_LIMITS,
} = require("../config/workTasks");

/* A single unit of paid work. One collection holds all four types, keyed by
   `type`, so the browse list, the submission flow and the admin queue can all
   be written once against `WorkTask` instead of four near-identical models.

   TWO FIELDS MUST NEVER REACH THE CLIENT
   --------------------------------------
     correctAnswer      (AI_TRAINING)   - the right response
     expectedTranscript (TRANSCRIPTION) - the reference transcript

   They are the answer key. work.controller.js projects them out for every
   user-facing response; do not add a route that returns a raw document. */

const workTaskSchema = new mongoose.Schema(
  {
    /* Stable public id, e.g. "art-001", "ait-014", "trs-006". Mirrors the
       survey-001 convention: readable, sortable, and safe to show users. */
    taskId: { type: String, required: true, unique: true, trim: true },

    type: {
      type: String,
      required: true,
      enum: TASK_TYPE_ORDER,
      index: true,
    },

    title: { type: String, required: true, trim: true },
    category: { type: String, default: "", trim: true },
    brief: { type: String, default: "" },
    instructions: [{ type: String }],

    /* The payout is snapshotted onto the task so a rate change never
       retro-prices work a user has already been shown. */
    pay: { type: Number, required: true, min: 0 },
    estimatedTime: { type: String, default: "10 min" },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },

    /* ---- ARTICLE / ACADEMIC ---- */
    wordLimits: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
    },
    /* Optional content angles the writer may choose from. */
    angles: [{ type: String }],
    /* Required section structure, academic tasks only. */
    requiredSections: [{ type: String }],
    /* What the reviewer will look for. Shown to the writer so the standard
       is never a secret. */
    reviewerNotes: { type: String, default: "" },

    /* ---- AI_TRAINING ---- */
    /* The prompt both candidate replies are answering. */
    prompt: { type: String, default: "" },
    /* Candidate replies. `label` is what the user sees (Reply A / Reply B),
       `text` is the reply body being judged. */
    options: [
      {
        _id: false,
        label: { type: String, default: "" },
        text: { type: String, default: "" },
      },
    ],
    /* Index into `options` of the better reply. SERVER-ONLY. */
    correctAnswer: { type: Number, default: null },
    /* Shown to the user after they answer, to make the task educational. */
    explanation: { type: String, default: "" },

    /* ---- TRANSCRIPTION ---- */
    /* Spoken through the browser's speech synthesiser. There is no audio
       hosting, so `spokenText` IS the audio; `expectedTranscript` is the
       written form it is scored against. */
    spokenText: { type: String, default: "" },
    /* SERVER-ONLY reference transcript. */
    expectedTranscript: { type: String, default: "" },
    speakerNotes: { type: String, default: "" },
    /* Accent/pace hint surfaced in the player UI. */
    accent: { type: String, default: "Kenyan English" },

    isActive: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

/* Browse queries are always "active tasks of one type, in display order". */
workTaskSchema.index({ type: 1, isActive: 1, order: 1 });

/* Shape a task for a user: everything except the answer keys. */
workTaskSchema.methods.toClientJSON = function toClientJSON() {
  return {
    _id: this._id,
    taskId: this.taskId,
    type: this.type,
    title: this.title,
    category: this.category,
    brief: this.brief,
    instructions: this.instructions || [],
    pay: this.pay,
    estimatedTime: this.estimatedTime,
    difficulty: this.difficulty,
    wordLimits: {
      min: this.wordLimits?.min ?? WORD_LIMITS[this.type]?.min ?? null,
      max: this.wordLimits?.max ?? WORD_LIMITS[this.type]?.max ?? null,
    },
    angles: this.angles || [],
    requiredSections: this.requiredSections || [],
    reviewerNotes: this.reviewerNotes || "",
    /* AI training: the replies to judge, never which one is correct. */
    prompt: this.prompt,
    options: (this.options || []).map((option) => ({
      label: option.label,
      text: option.text,
    })),
    /* Transcription: the passage to play and the accent hint, never the
       reference transcript. */
    spokenText: this.spokenText,
    speakerNotes: this.speakerNotes,
    accent: this.accent,
    isActive: this.isActive,
  };
};

const WorkTask = mongoose.model("WorkTask", workTaskSchema);

module.exports = WorkTask;
module.exports.TASK_TYPES = TASK_TYPES;
module.exports.DEFAULT_PAY = TASK_PAY;
