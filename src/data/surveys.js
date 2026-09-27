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

const QUESTION_TEMPLATES = [
  {
    q: "How often do you engage with this topic?",
    opts: ["Daily", "Weekly", "Monthly", "Rarely", "Never"]
  },
  {
    q: "How satisfied are you with your current experience?",
    opts: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]
  },
  {
    q: "Would you recommend this to a friend?",
    opts: ["Yes", "No", "Maybe"]
  },
  {
    q: "How much time do you spend on this daily?",
    opts: ["< 30 min", "30-60 min", "1-2 hrs", "2-4 hrs", "> 4 hrs"]
  },
  {
    q: "What is your primary reason for engaging with this?",
    opts: ["Convenience", "Cost", "Quality", "Social influence", "Other"]
  },
  {
    q: "How has this improved your daily life?",
    opts: ["Significantly", "Moderately", "Slightly", "Not at all", "Made it worse"]
  },
  {
    q: "Which aspect do you value most?",
    opts: ["Affordability", "Speed", "Reliability", "Customer support", "Innovation"]
  },
  {
    q: "How easy is it to get started?",
    opts: ["Very Easy", "Easy", "Neutral", "Difficult", "Very Difficult"]
  },
  {
    q: "Would you pay more for premium features?",
    opts: ["Definitely", "Maybe", "Not sure", "Probably not", "Definitely not"]
  },
  {
    q: "How does this compare to alternatives?",
    opts: ["Much better", "Better", "About the same", "Worse", "Much worse"]
  },
];

const EXTRA_TOPICS = [
  "Mobile Money & Payments",
  "Online Shopping",
  "Food Delivery",
  "Streaming & Entertainment",
  "Gaming & Esports",
  "Travel & Tourism",
  "Health & Fitness",
  "Education & Learning",
  "News & Media",
  "Social Networking",
  "Cryptocurrency",
  "Insurance & Investments",
  "Agriculture & Farming",
  "Real Estate",
  "Beauty & Cosmetics",
  "Fashion & Clothing",
  "Sports & Recreation",
  "Music & Audio",
  "Photography & Video",
  "Books & Reading",
  "Pets & Animals",
  "Home Improvement",
  "Automotive",
  "Events & Concerts",
  "Volunteering & Charity",
  "Language Learning",
  "Cooking & Recipes",
  "Parenting & Family",
  "Mental Health",
  "Productivity Tools",
  "Cybersecurity",
  "Cloud Storage",
  "Video Conferencing",
  "E-Learning Platforms",
  "Job Search",
  "Freelancing",
  "Side Hustles",
  "Budgeting & Finance",
  "Banking Services",
  "Telecom & Data",
  "Smart Home",
  "Wearable Tech",
  "Drones & Robotics",
  "Electric Vehicles",
  "Renewable Energy",
  "Space Technology",
  "Biotechnology",
  "Virtual Reality",
  "Artificial Intelligence",
  "Robotics",
  "3D Printing",
  "Nanotechnology",
  "Quantum Computing",
  "Blockchain",
  "Internet of Things",
  "5G Networks",
  "Satellite Internet",
  "Digital Identity",
  "E-Government",
  "Smart Cities",
  "Urban Planning",
  "Climate Change",
  "Disaster Management",
  "Public Health",
  "Mental Wellness",
  "Nutrition Science",
  "Alternative Medicine",
  "Medical Devices",
  "Telemedicine",
  "Health Tech",
  "Fitness Trackers",
  "Wearable Health",
  "Sleep Science",
  "Circadian Rhythms",
  "Mindfulness",
  "Meditation Apps",
  "Therapy Online",
  "Support Groups",
  "Community Health",
  "Epidemiology",
  "Vaccination",
  "Preventive Care",
  "Personalized Medicine",
  "Genomics",
  "Digital Health Records",
  "AI Diagnostics",
  "Robot-Assisted Surgery",
  "Gene Editing",
  "Stem Cell Therapy",
  "Organ Regeneration",
  "Drug Discovery",
  "Clinical Trials",
  "Pharmacovigilance",
  "Precision Medicine",
  "Population Health",
  "Health Equity",
  "Global Health",
  "Pandemic Response",
  "One Health",
  "Planetary Health",
];

function buildQuestions(surveyIndex, category, title) {
  const questions = [];
  const topic = EXTRA_TOPICS[surveyIndex % EXTRA_TOPICS.length];
  for (let i = 0; i < 10; i++) {
    const tpl = QUESTION_TEMPLATES[i];
    questions.push({
      id: `q${i + 1}`,
      question: `${tpl.q} about ${title.toLowerCase()} in the ${topic} space?`,
      options: [...tpl.opts],
    });
  }
  return questions;
}

let _built = null;

export function getHardcodedSurveys() {
  if (_built) return _built;
  const surveys = [];
  let id = 1;
  for (const [category, titles] of Object.entries(SURVEY_TITLES_BY_CATEGORY)) {
    for (const title of titles) {
      const idx = id - 1;
      surveys.push({
        _id: `survey-${String(id).padStart(3, "0")}`,
        title,
        category,
        earnings: 97,
        estimatedTime: "5-10 min",
        totalQuestions: 10,
        questions: buildQuestions(idx, category, title),
        isCompleted: false,
      });
      id++;
    }
  }
  _built = surveys;
  return surveys;
}

export const HARDCODED_SURVEYS = getHardcodedSurveys();