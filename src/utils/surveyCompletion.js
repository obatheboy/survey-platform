// ========================= surveyCompletion.js =========================
// Shared survey completion tracking via localStorage
// Used by SurveyTake (to record) and Dashboard (to read)

const SURVEY_COMPLETION_KEY = "survey_completions";
const SURVEY_DAILY_COUNT_KEY = "survey_daily_count";
const SURVEY_DAILY_DATE_KEY = "survey_daily_date";

export function getCompletedSurveys() {
  try {
    const raw = localStorage.getItem(SURVEY_COMPLETION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isSurveyCompleted(surveyId) {
  return !!getCompletedSurveys()[surveyId];
}

export function clearSurveyCompletions() {
  localStorage.removeItem(SURVEY_COMPLETION_KEY);
  localStorage.removeItem(SURVEY_DAILY_COUNT_KEY);
  localStorage.removeItem(SURVEY_DAILY_DATE_KEY);
}

export function markSurveyCompleted(surveyId) {
  const completed = getCompletedSurveys();
  completed[surveyId] = true;
  localStorage.setItem(SURVEY_COMPLETION_KEY, JSON.stringify(completed));

  // Track daily count (5/day limit)
  const today = new Date().toISOString().split("T")[0];
  const storedDate = localStorage.getItem(SURVEY_DAILY_DATE_KEY);
  let dailyCount = parseInt(localStorage.getItem(SURVEY_DAILY_COUNT_KEY) || "0", 10);
  if (storedDate !== today) {
    dailyCount = 0;
  }
  dailyCount += 1;
  localStorage.setItem(SURVEY_DAILY_COUNT_KEY, String(dailyCount));
  localStorage.setItem(SURVEY_DAILY_DATE_KEY, today);

  // Dispatch custom event for same-document updates
  window.dispatchEvent(new CustomEvent("survey-completed", { detail: { surveyId, dailyCount } }));
  // Also dispatch storage event for cross-tab
  window.dispatchEvent(new StorageEvent("storage", { key: SURVEY_COMPLETION_KEY }));
}

export function getDailySurveyCount() {
  const today = new Date().toISOString().split("T")[0];
  const storedDate = localStorage.getItem(SURVEY_DAILY_DATE_KEY);
  if (storedDate !== today) return 0;
  return parseInt(localStorage.getItem(SURVEY_DAILY_COUNT_KEY) || "0", 10);
}

export function getCompletedSurveyCount() {
  return Object.keys(getCompletedSurveys()).length;
}

/**
 * Merge the server's authoritative completion list into localStorage.
 *
 * The server is the source of truth for what a user has actually completed
 * (and what they were paid for). localStorage is only a cache for rendering.
 * Union-ing the two means a completion is never lost when the browser clears
 * storage or the user moves to another device, and a survey already recorded
 * on the server can never be paid out twice.
 *
 * Returns the merged completion map.
 */
export function syncCompletedSurveys(serverCompletedIds) {
  if (!Array.isArray(serverCompletedIds)) return getCompletedSurveys();

  const local = getCompletedSurveys();
  let changed = false;

  serverCompletedIds.forEach((id) => {
    if (id && !local[id]) {
      local[id] = true;
      changed = true;
    }
  });

  if (changed) {
    localStorage.setItem(SURVEY_COMPLETION_KEY, JSON.stringify(local));
  }

  return local;
}

/**
 * Adopt the server's daily count for the 5/day limit so the browser and server
 * cannot disagree after a cache clear or a device change.
 */
export function syncDailySurveyCount(serverCount, serverDate) {
  const today = new Date().toISOString().split("T")[0];
  if (serverDate !== today) return 0;

  const count = parseInt(serverCount || "0", 10);
  localStorage.setItem(SURVEY_DAILY_COUNT_KEY, String(count));
  localStorage.setItem(SURVEY_DAILY_DATE_KEY, today);
  return count;
}

export function resetSurveyCompletions() {
  localStorage.removeItem(SURVEY_COMPLETION_KEY);
  localStorage.removeItem(SURVEY_DAILY_COUNT_KEY);
  localStorage.removeItem(SURVEY_DAILY_DATE_KEY);
}