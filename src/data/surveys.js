// ========================= surveys.js =========================
// Shared hardcoded 60 surveys — always available, no API dependency

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

const DUMMY_QUESTIONS = [
  { question: "How often do you use this service?", options: ["Daily", "Weekly", "Monthly", "Rarely", "Never"] },
  { question: "How satisfied are you with the experience?", options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"] },
  { question: "Would you recommend this to a friend?", options: ["Yes", "No", "Maybe"] },
  { question: "How much time do you spend on this daily?", options: ["< 30 min", "30-60 min", "1-2 hrs", "2-4 hrs", "> 4 hrs"] },
  { question: "What is your primary reason for using this?", options: ["Convenience", "Cost", "Quality", "Social", "Other"] },
  { question: "How has this improved your daily life?", options: ["Significantly", "Moderately", "Slightly", "Not at all", "Made it worse"] },
  { question: "Which feature do you use most?", options: ["Feature A", "Feature B", "Feature C", "Feature D", "All of them"] },
  { question: "How easy is it to use?", options: ["Very Easy", "Easy", "Neutral", "Difficult", "Very Difficult"] },
  { question: "Would you pay for a premium version?", options: ["Definitely", "Maybe", "Not sure", "Probably not", "Definitely not"] },
  { question: "How does this compare to alternatives?", options: ["Much better", "Better", "About the same", "Worse", "Much worse"] },
];

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
        earnings: 97,
        estimatedTime: "5-10 min",
        totalQuestions: 10,
        questions: DUMMY_QUESTIONS.map(q => ({ ...q })),
        isCompleted: false,
      });
      id++;
    }
  }
  _built = surveys;
  return surveys;
}

export const HARDCODED_SURVEYS = getHardcodedSurveys();