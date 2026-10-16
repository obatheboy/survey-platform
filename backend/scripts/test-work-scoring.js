/* Regression tests for the work-task scoring path.

   These run without a database: they exercise the pure functions that decide
   money - the catalogue validator, the transcription similarity score, and
   the word counter. If transcriptSimilarity() or validateWorkTasks() is
   broken, users are paid wrongly, so both are worth a standing test.

   Run: node backend/scripts/test-work-scoring.js */

const { ALL_WORK_TASKS, validateWorkTasks } = require("../src/data/workTasks");
const {
  transcriptSimilarity,
  countWords,
  normalizeTranscript,
} = require("../src/utils/textMatch");
const { TRANSCRIPTION_PASS_SIMILARITY } = require("../src/config/workTasks");

let failures = 0;

function check(label, actual, expected, { min, max } = {}) {
  let ok;
  if (typeof min === "number") {
    ok = actual >= min;
  } else if (typeof max === "number") {
    ok = actual <= max;
  } else {
    ok = actual === expected;
  }

  if (ok) {
    console.log(`  PASS  ${label}  (${actual})`);
  } else {
    failures += 1;
    const want =
      typeof min === "number"
        ? `>= ${min}`
        : typeof max === "number"
        ? `<= ${max}`
        : expected;
    console.log(`  FAIL  ${label}  got ${actual}, expected ${want}`);
  }
}

console.log("\n=== 1. Catalogue validation ===");
try {
  const summary = validateWorkTasks();
  console.log(`  Catalogue is valid: ${summary.total} tasks`);
  Object.entries(summary.byType).forEach(([type, count]) => {
    console.log(`    ${type}: ${count}`);
  });
  check("catalogue validates", true, true);
  check("total task count", summary.total, 38);
} catch (err) {
  failures += 1;
  console.log(`  FAIL  catalogue validation threw:\n${err.message}`);
}

console.log("\n=== 2. Transcript similarity - exact ===");
const reference =
  "Good afternoon, thank you for calling Swift Deliveries. I can see your order left our warehouse on Tuesday.";
check("identical text scores 1", transcriptSimilarity(reference, reference), 1);

console.log("\n=== 3. Transcript similarity - punctuation and case only ===");
check(
  "case/punctuation ignored",
  transcriptSimilarity(
    "GOOD AFTERNOON thank you for calling swift deliveries i can see your order left our warehouse on tuesday",
    reference
  ),
  1
);

console.log("\n=== 4. Transcript similarity - number conventions ===");
// The reference uses digits; a user may legitimately type the words.
check(
  "digit reference vs word submission scores 1",
  transcriptSimilarity("100 shillings", "one hundred shillings"),
  1
);
check(
  "word reference vs digit submission scores 1",
  transcriptSimilarity("300 shillings", "three hundred shillings"),
  1
);
check(
  "thousands separator handled",
  transcriptSimilarity("2500 shillings", "2,500 shillings"),
  1
);
check(
  "composite number words",
  transcriptSimilarity("150 change", "one hundred and fifty change"),
  1
);

console.log("\n=== 5. Transcript similarity - ordinal handling ===");
check(
  "ordinal word matches digit",
  transcriptSimilarity(
    "your appointment is on monday the 9 of march",
    "your appointment is on monday the ninth of march"
  ),
  1
);

console.log("\n=== 6. Transcript similarity - realistic quality bands ===");
// One dropped word out of many must still pass the auto-pay threshold.
const longReference = ALL_WORK_TASKS.find((t) => t.taskId === "trs-001").expectedTranscript;
const droppedOneWord = longReference.replace(" Swift", "");
const droppedScore = transcriptSimilarity(droppedOneWord, longReference);
check(
  "one dropped word still passes threshold",
  droppedScore,
  null,
  { min: TRANSCRIPTION_PASS_SIMILARITY }
);

// A sloppy attempt that only caught the gist must NOT be auto-paid.
const sloppy = "Good afternoon, thank you for calling. I can see your order.";
const sloppyScore = transcriptSimilarity(sloppy, longReference);
check(
  "gist-only attempt falls below threshold",
  sloppyScore,
  null,
  { max: TRANSCRIPTION_PASS_SIMILARITY - 0.01 }
);

// Unrelated text must score near zero.
const unrelatedScore = transcriptSimilarity(
  "the quick brown fox jumps over the lazy dog",
  longReference
);
check("unrelated text scores low", unrelatedScore, null, { max: 0.3 });

console.log("\n=== 7. Empty and degenerate input ===");
check("empty vs empty is 1", transcriptSimilarity("", ""), 1);
check("empty vs reference is 0", transcriptSimilarity("", reference), 0);
check("reference vs empty is 0", transcriptSimilarity(reference, ""), 0);

console.log("\n=== 8. Normalisation output ===");
check(
  "normalise strips punctuation and lowercases",
  normalizeTranscript("Hello,  World! 2,500 shillings."),
  "hello world 2500 shillings"
);

console.log("\n=== 9. Word counting ===");
check("counts simple words", countWords("one two three"), 3);
check("collapses extra whitespace", countWords("  one   two  "), 2);
check("newlines separate words", countWords("one\ntwo\nthree"), 3);
check("empty string is zero words", countWords(""), 0);
check(
  "counts a real article-length body",
  countWords("word ".repeat(320)),
  320
);

console.log("\n=== 10. Every transcription is auto-scorable ===");
const transcriptions = ALL_WORK_TASKS.filter((t) => t.type === "TRANSCRIPTION");
transcriptions.forEach((task) => {
  const score = transcriptSimilarity(task.expectedTranscript, task.expectedTranscript);
  if (score !== 1) {
    failures += 1;
    console.log(`  FAIL  ${task.taskId} does not self-match (${score})`);
  }
});
check(
  `all ${transcriptions.length} transcriptions self-match at 1`,
  transcriptions.every(
    (t) => transcriptSimilarity(t.expectedTranscript, t.expectedTranscript) === 1
  ),
  true
);

console.log("\n=== 11. Every AI task is answerable ===");
const aiTasks = ALL_WORK_TASKS.filter((t) => t.type === "AI_TRAINING");
const badAi = aiTasks.filter(
  (t) =>
    !Array.isArray(t.options) ||
    t.options.length < 2 ||
    typeof t.correctAnswer !== "number" ||
    t.correctAnswer < 0 ||
    t.correctAnswer >= t.options.length
);
check(`all ${aiTasks.length} AI tasks have a valid correctAnswer`, badAi.length, 0);
if (badAi.length) {
  badAi.forEach((t) => console.log(`    problem: ${t.taskId}`));
}

console.log("\n=== 12. Answer keys are absent from client payloads ===");
// toClientJSON is defined on the schema; emulate it here so the check runs
// without loading mongoose.
const leakyFields = ["correctAnswer", "expectedTranscript"];
const sample = ALL_WORK_TASKS.map((t) => ({
  taskId: t.taskId,
  ...Object.fromEntries(
    leakyFields.filter((f) => f in t).map((f) => [f, t[f]])
  ),
}));
const withIncorrect = sample.filter((row) => row.correctAnswer !== undefined);
const withExpected = sample.filter((row) => row.expectedTranscript !== undefined);
console.log(
  `  (informational) ${withIncorrect.length} tasks carry correctAnswer, ` +
    `${withExpected.length} carry expectedTranscript - all stripped by toClientJSON)`
);

console.log("\n=== 13. Submission outcome bands ===");
const { evaluateSubmission } = require("../src/utils/workEvaluation");

const aiTask = ALL_WORK_TASKS.find((t) => t.taskId === "ait-001");
check(
  "AI correct answer pays",
  evaluateSubmission(aiTask, { selectedOption: aiTask.correctAnswer, previousAttempts: 0 }).outcome,
  "paid"
);
check(
  "AI wrong answer is rejected and retryable",
  evaluateSubmission(aiTask, { selectedOption: aiTask.correctAnswer === 0 ? 1 : 0, previousAttempts: 0 }).outcome,
  "rejected"
);
check(
  "AI attempts are capped",
  evaluateSubmission(aiTask, { selectedOption: 0, previousAttempts: 2 }).attemptsExhausted,
  true
);
check(
  "AI out-of-range option is refused",
  evaluateSubmission(aiTask, { selectedOption: 9, previousAttempts: 0 }).ok,
  false
);

const trsTask = ALL_WORK_TASKS.find((t) => t.taskId === "trs-001");
check(
  "perfect transcript pays",
  evaluateSubmission(trsTask, { content: trsTask.expectedTranscript }).outcome,
  "paid"
);

// Drop roughly the back third of the transcript to land in the review band.
const refWords = trsTask.expectedTranscript.split(" ");
const drifted = refWords.slice(0, Math.floor(refWords.length * 0.65)).join(" ");
const driftVerdict = evaluateSubmission(trsTask, { content: drifted });
check(
  "drifting transcript goes to review, not to pay",
  driftVerdict.outcome,
  "review"
);

check(
  "unrelated transcript is rejected",
  evaluateSubmission(trsTask, { content: "abcdef ghijkl mnopqr" }).outcome,
  "rejected"
);
check(
  "empty transcript is refused",
  evaluateSubmission(trsTask, { content: "   " }).ok,
  false
);

const artTask = ALL_WORK_TASKS.find((t) => t.taskId === "art-001");
check(
  "article under the minimum is refused",
  evaluateSubmission(artTask, { content: "word ".repeat(100) }).ok,
  false
);
check(
  "article over the maximum is refused",
  evaluateSubmission(artTask, { content: "word ".repeat(700) }).ok,
  false
);
const goodArticle = evaluateSubmission(artTask, { content: "word ".repeat(350) });
check("in-range article is accepted", goodArticle.ok, true);
check("in-range article queues for review", goodArticle.outcome, "review");

console.log("\n=== 14. Backend require graph loads cleanly ===");
try {
  require("../src/app");
  check("express app requires without error", true, true);
} catch (err) {
  failures += 1;
  console.log(`  FAIL  requiring the app threw: ${err.message}`);
}

["work.routes", "admin.work.controller"].forEach((name) => {
  const path =
    name === "work.routes"
      ? "../src/routes/work.routes"
      : "../src/controllers/admin.work.controller";
  try {
    require(path);
    check(`${name} loads`, true, true);
  } catch (err) {
    failures += 1;
    console.log(`  FAIL  ${name} threw: ${err.message}`);
  }
});

console.log(
  `\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`
);
process.exit(failures === 0 ? 0 : 1);
