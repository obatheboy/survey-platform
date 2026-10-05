const { ARTICLE_TASKS } = require("./articles");
const { AI_TRAINING_TASKS } = require("./aiTraining");
const { ACADEMIC_TASKS } = require("./academic");
const { TRANSCRIPTION_TASKS } = require("./transcription");
const {
  TASK_TYPES,
  TASK_TYPE_ORDER,
  getTaskPay,
  getWordLimits,
} = require("../../config/workTasks");

/* The full work catalogue: every paid task the platform offers outside of
   surveys. Kept in four files by type so each stays reviewable, then merged
   here and validated once.

   validateWorkTasks() runs at seed time. A malformed task is a money bug -
   an AI task whose correctAnswer points past the end of its options list
   would mark every user wrong, and a transcription with no expected
   transcript would score everyone at zero. Failing loudly at seed time is
   far better than paying out wrongly at runtime. */

const ALL_WORK_TASKS = [
  ...AI_TRAINING_TASKS,
  ...ARTICLE_TASKS,
  ...TRANSCRIPTION_TASKS,
  ...ACADEMIC_TASKS,
];

/** Check one task against the rules for its type. Returns an error string. */
function validateTask(task) {
  const label = task.taskId || "(missing taskId)";

  if (!task.taskId) return "Task is missing taskId";
  if (!task.title) return `${label}: missing title`;
  if (!TASK_TYPE_ORDER.includes(task.type)) {
    return `${label}: unknown type "${task.type}"`;
  }
  if (typeof task.pay !== "number" || task.pay <= 0) {
    return `${label}: pay must be a positive number`;
  }
  if (task.pay !== getTaskPay(task.type)) {
    return `${label}: pay ${task.pay} does not match the configured ${getTaskPay(task.type)}`;
  }

  if (task.type === TASK_TYPES.AI_TRAINING) {
    const options = task.options || [];
    if (options.length < 2) return `${label}: needs at least two options`;
    if (
      typeof task.correctAnswer !== "number" ||
      task.correctAnswer < 0 ||
      task.correctAnswer >= options.length
    ) {
      return `${label}: correctAnswer must index into its options`;
    }
    if (!task.prompt) return `${label}: missing prompt`;
    if (options.some((option) => !option.text)) {
      return `${label}: every option needs text`;
    }
    return null;
  }

  if (task.type === TASK_TYPES.TRANSCRIPTION) {
    if (!task.spokenText) return `${label}: missing spokenText`;
    if (!task.expectedTranscript) return `${label}: missing expectedTranscript`;
    return null;
  }

  // ARTICLE and ACADEMIC both pay out on human review, so the brief and the
  // word limits are what the reviewer marks against - both are required.
  if (!task.brief) return `${label}: missing brief`;
  const limits = task.wordLimits || getWordLimits(task.type);
  if (!limits || !limits.min || !limits.max || limits.min >= limits.max) {
    return `${label}: invalid word limits`;
  }
  return null;
}

/** Validate the whole catalogue. Throws with every problem listed at once. */
function validateWorkTasks(tasks = ALL_WORK_TASKS) {
  const problems = [];
  const seenIds = new Set();

  tasks.forEach((task) => {
    if (task.taskId && seenIds.has(task.taskId)) {
      problems.push(`Duplicate taskId: ${task.taskId}`);
    }
    if (task.taskId) seenIds.add(task.taskId);

    const problem = validateTask(task);
    if (problem) problems.push(problem);
  });

  if (problems.length > 0) {
    throw new Error(
      `Work task catalogue is invalid:\n  - ${problems.join("\n  - ")}`
    );
  }

  const byType = TASK_TYPE_ORDER.reduce((acc, type) => {
    acc[type] = tasks.filter((task) => task.type === type).length;
    return acc;
  }, {});

  return { total: tasks.length, byType };
}

module.exports = {
  ALL_WORK_TASKS,
  validateWorkTasks,
  validateTask,
};
