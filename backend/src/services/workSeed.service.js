const WorkTask = require("../models/WorkTask");
const { ALL_WORK_TASKS, validateWorkTasks } = require("../data/workTasks");

/* Seeds the work catalogue into Mongo.

   UPSERT, NOT INSERT-IF-EMPTY
   ---------------------------
   The survey seeder skips everything once the collection is non-empty. That
   is wrong here: if a pay rate is corrected or a confusing brief is rewritten,
   the fix must reach production without a manual database edit. So each task
   is upserted by taskId and its content is overwritten on every boot.

   `isActive` is deliberately NOT overwritten. It lives in $setOnInsert only,
   so an admin who retires a task does not have it silently switched back on
   by the next deploy.

   The whole catalogue is validated before a single write. A malformed task
   sets a wrong answer key, and a wrong answer key pays people wrongly - far
   better to fail the boot than to run with bad data. */

let seedPromise = null;

async function runSeed() {
  const summary = validateWorkTasks();

  const operations = ALL_WORK_TASKS.map((task) => {
    const { isActive, taskId, ...content } = task;
    return {
      updateOne: {
        filter: { taskId },
        update: {
          $set: content,
          // Preserves an admin's decision to retire a task.
          $setOnInsert: { taskId, isActive: isActive !== false },
        },
        upsert: true,
      },
    };
  });

  const result = await WorkTask.bulkWrite(operations, { ordered: false });

  return {
    ...summary,
    inserted: result.upsertedCount,
    updated: result.modifiedCount,
  };
}

/**
 * Seed once per process. Concurrent callers share the same in-flight promise
 * so a burst of requests at boot cannot race duplicate seed runs.
 */
function seedWorkTasks() {
  if (!seedPromise) {
    seedPromise = runSeed().catch((err) => {
      // Allow a later request to retry rather than caching the failure.
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

/** Force a re-seed. Intended for scripts and tests. */
async function reseedWorkTasks() {
  seedPromise = null;
  return seedWorkTasks();
}

module.exports = { seedWorkTasks, reseedWorkTasks };
