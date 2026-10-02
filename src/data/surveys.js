// ========================= surveys.js =========================
// Shared hardcoded 60 surveys — always available, no API dependency

import { SURVEY_EARNINGS } from "../constants/fees";
import { SURVEY_QUESTION_BANK } from "./surveyQuestionBank";

export const SURVEY_TITLES_BY_CATEGORY = {
  "Daily Lifestyle": [
    "Morning Routine Habits",
    "Sleep Patterns & Quality",
    "Daily Productivity",
    "Weekend Activities",
    "Home Organization",
    "Personal Care & Grooming",
    "Stress Management",
    "Time Management",
    "Daily Commute Experience",
    "Evening Relaxation Habits",
  ],
  "Food": [
    "Breakfast Habits Survey",
    "Fast Food Preferences",
    "Healthy Eating Patterns",
    "Restaurant Dining Experience",
    "Cooking Habits & Skills",
    "Dietary Restrictions",
    "Snacking Patterns",
    "Daily Water Intake",
    "Coffee & Tea Consumption",
    "Dining Out Preferences",
  ],
  "Football": [
    "Premier League Fan Survey",
    "Fan Engagement & Passion",
    "Match Viewing Habits",
    "Fantasy Football Experience",
    "Football Memorabilia Collection",
    "Game Day Experience",
    "Youth Football Participation",
    "Women's Football Interest",
    "Football Streaming Habits",
    "Stadium Visit Experience",
  ],
  "Safaricom": [
    "M-Pesa Usage Survey",
    "Network Quality & Coverage",
    "Customer Service Experience",
    "Safaricom App Usage",
    "Data Bundle Preferences",
    "Roaming Services Survey",
    "Bill Payments via Mobile",
    "Till Number Usage",
    "M-Shwari & Savings",
    "Safaricom Boda Service",
  ],
  "Equity Bank": [
    "Banking App Usage Survey",
    "Account Types & Usage",
    "Loan Services Experience",
    "Equity Agent Usage",
    "Mobile Banking Habits",
    "Savings & Investment",
    "Insurance Products Interest",
    "Remittance Services",
    "Equity Card Survey",
    "Branch Visit Experience",
  ],
  "Communication": [
    "WhatsApp Usage Patterns",
    "Voice & Video Call Habits",
    "Social Media Platforms",
    "Email Communication",
    "Messaging App Preferences",
    "Video Streaming Habits",
    "SMS Usage Trends",
    "Phone Call Duration",
    "Group Chat Participation",
    "Digital Communication",
  ],
};

export const CATEGORY_ICONS = {
  "daily lifestyle": "🏠",
  "food": "🍽️",
  "football": "⚽",
  "safaricom": "📶",
  "equity bank": "🏦",
  "communication": "💬",
};

// Every survey gets its own hand-written question set from
// surveyQuestionBank.js. This used to splice a survey title into 10 generic
// template stems, which made all 60 surveys ask the same questions.
function getQuestionsFor(title) {
  const bank = SURVEY_QUESTION_BANK[title];
  if (!bank) {
    // Throw rather than fall back to generic questions: a typo in the bank
    // key should break loudly at load, not silently ship filler to users.
    throw new Error(
      `Missing question bank entry for survey: "${title}". ` +
        `Add it to src/data/surveyQuestionBank.js.`
    );
  }
  return bank.map((item, i) => ({
    id: `q${i + 1}`,
    question: item.question,
    options: [...item.options],
  }));
}

let _built = null;

export function getHardcodedSurveys() {
  if (_built) return _built;
  const surveys = [];
  let id = 1;
  for (const [category, titles] of Object.entries(SURVEY_TITLES_BY_CATEGORY)) {
    for (const title of titles) {
      surveys.push({
        _id: `survey-${String(id).padStart(3, "0")}`,
        title,
        category,
        earnings: SURVEY_EARNINGS,
        estimatedTime: "5-10 min",
        totalQuestions: 10,
        questions: getQuestionsFor(title),
        isCompleted: false,
      });
      id++;
    }
  }
  _built = surveys;
  return surveys;
}

export const HARDCODED_SURVEYS = getHardcodedSurveys();