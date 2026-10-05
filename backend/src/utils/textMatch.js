/* Text utilities for scoring work submissions.

   TWO JOBS
   --------
   1. countWords()          - how long a written submission is (article and
                              academic tasks are gated on a word window).
   2. transcriptSimilarity() - how close a typed transcript is to the stored
                              reference (transcription tasks are auto-paid
                              above a threshold).

   NUMBER HANDLING
   ---------------
   A transcriber who hears "three hundred shillings" may reasonably type
   either "300 shillings" or "three hundred shillings". Both are correct
   transcripts of the same speech, so scoring them differently would fail a
   user for doing nothing wrong. numberWordsToDigits() normalises both sides
   to digits before anything is compared, which makes the check convention
   independent. Without this, a task whose reference reads "100 shillings"
   would score a user who typed "one hundred shillings" as wrong. */

const SMALL_NUMBERS = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19,
};

const TENS = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90,
};

const SCALES = { hundred: 100, thousand: 1000, million: 1000000 };

/* Ordinals appear constantly in dictation ("Monday the ninth of March",
   "the twenty second of February"). Each maps to the same value its cardinal
   form would produce, so a user may type the digit instead. */
const ORDINALS = {
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7,
  eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13,
  fourteenth: 14, fifteenth: 15, sixteenth: 16, seventeenth: 17,
  eighteenth: 18, nineteenth: 19, twentieth: 20, thirtieth: 30,
  fortieth: 40, fiftieth: 50, sixtieth: 60, seventieth: 70, eightieth: 80,
  ninetieth: 90,
};

const NUMBER_WORD_TOKENS = new Set([
  ...Object.keys(SMALL_NUMBERS),
  ...Object.keys(TENS),
  ...Object.keys(SCALES),
  ...Object.keys(ORDINALS),
  "and",
]);

/** Convert a run of number words into its numeric value, or null. */
function parseNumberRun(words) {
  let total = 0;
  let current = 0;
  let matched = false;

  words.forEach((word) => {
    if (word === "and") return;
    if (word in SMALL_NUMBERS) {
      current += SMALL_NUMBERS[word];
      matched = true;
    } else if (word in ORDINALS) {
      current += ORDINALS[word];
      matched = true;
    } else if (word in TENS) {
      current += TENS[word];
      matched = true;
    } else if (word in SCALES) {
      const scale = SCALES[word];
      if (scale === 100) {
        current = (current || 1) * 100;
      } else {
        total += (current || 1) * scale;
        current = 0;
      }
      matched = true;
    }
  });

  if (!matched) return null;
  const value = total + current;
  return Number.isFinite(value) ? value : null;
}

/** Rewrite spelled-out numbers as digits: "fifty" -> "50", "two thousand" -> "2000". */
function numberWordsToDigits(text) {
  const tokens = String(text || "").split(/\s+/);
  const output = [];
  let buffer = [];

  const flush = () => {
    if (buffer.length === 0) return;
    // A run holding nothing but "and" is not a number; keep it as written.
    const value =
      buffer.every((token) => token === "and") ? null : parseNumberRun(buffer);
    if (value === null) {
      output.push(...buffer);
    } else {
      output.push(String(value));
    }
    buffer = [];
  };

  tokens.forEach((token) => {
    const bare = token.toLowerCase().replace(/[^a-z]/g, "");
    if (NUMBER_WORD_TOKENS.has(bare) && bare !== "") {
      buffer.push(bare);
    } else {
      flush();
      output.push(token);
    }
  });
  flush();

  return output.join(" ");
}

/** Lowercase, digits, no punctuation, single spaces. */
function normalizeTranscript(text) {
  const withDigits = numberWordsToDigits(text);
  return withDigits
    .toLowerCase()
    // Strip thousands separators inside numbers first ("2,500" -> "2500").
    .replace(/(\d),(?=\d{3}\b)/g, "$1")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const tokenize = (text) => (text ? text.split(" ").filter(Boolean) : []);

/** Word-level edit distance (insertions, deletions and substitutions). */
function editDistance(source, target) {
  const a = source;
  const b = target;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const grid = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) grid[i][0] = i;
  for (let j = 0; j < cols; j += 1) grid[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      grid[i][j] = Math.min(
        grid[i - 1][j] + 1,
        grid[i][j - 1] + 1,
        grid[i - 1][j - 1] + cost
      );
    }
  }

  return grid[rows - 1][cols - 1];
}

/**
 * Similarity between a submitted transcript and the reference, 0 to 1.
 * 1 means word-for-word identical after normalisation. Compared word by word,
 * so punctuation and number conventions never affect the score.
 */
function transcriptSimilarity(submitted, reference) {
  const referenceTokens = tokenize(normalizeTranscript(reference));
  const submittedTokens = tokenize(normalizeTranscript(submitted));

  if (referenceTokens.length === 0 && submittedTokens.length === 0) return 1;
  if (referenceTokens.length === 0 || submittedTokens.length === 0) return 0;

  const distance = editDistance(referenceTokens, submittedTokens);
  const longest = Math.max(referenceTokens.length, submittedTokens.length);
  return Math.max(0, 1 - distance / longest);
}

/** Whitespace-delimited word count, used to gate article and academic work. */
function countWords(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

module.exports = {
  numberWordsToDigits,
  normalizeTranscript,
  transcriptSimilarity,
  countWords,
};
