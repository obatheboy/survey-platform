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

export function resetSurveyCompletions() {
  localStorage.removeItem(SURVEY_COMPLETION_KEY);
  localStorage.removeItem(SURVEY_DAILY_COUNT_KEY);
  localStorage.removeItem(SURVEY_DAILY_DATE_KEY);
}