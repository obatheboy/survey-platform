const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, default: 0 }
}, { _id: false });

const surveySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  earnings: { type: Number, default: 450, min: 450, max: 450 },
  estimatedTime: { type: String, default: "5-10 min" },
  questions: [questionSchema],
  totalQuestions: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// 60 surveys across 6 categories, 10 per category, each earning KES 450
const CATEGORIES = [
  "Daily Lifestyle",
  "Food and Eating Preferences",
  "Football and Games",
  "Safaricom Network Experience",
  "Equity Bank",
  "Communication Habits"
];

const TITLES = {
  "Daily Lifestyle": [
    "Morning Routine Habits", "Sleep Patterns & Quality", "Daily Productivity",
    "Weekend Activities", "Home Organization", "Personal Care & Grooming",
    "Stress Management", "Time Management", "Daily Commute Experience", "Evening Relaxation Habits"
  ],
  "Food and Eating Preferences": [
    "Breakfast Habits Survey", "Fast Food Preferences", "Healthy Eating Patterns",
    "Restaurant Dining Experience", "Cooking Habits & Skills", "Dietary Restrictions",
    "Snacking Patterns", "Daily Water Intake", "Coffee & Tea Consumption", "Dining Out Preferences"
  ],
  "Football and Games": [
    "Premier League Fan Survey", "Fan Engagement & Passion", "Match Viewing Habits",
    "Fantasy Football Experience", "Football Memorabilia Collection", "Game Day Experience",
    "Youth Football Participation", "Women's Football Interest", "Football Streaming Habits", "Stadium Visit Experience"
  ],
  "Safaricom Network Experience": [
    "M-Pesa Usage Survey", "Network Quality & Coverage", "Customer Service Experience",
    "Safaricom App Usage", "Data Bundle Preferences", "Roaming Services Survey",
    "Bill Payments via Mobile", "Till Number Usage", "M-Shwari & Savings", "Safaricom Boda Service"
  ],
  "Equity Bank": [
    "Banking App Usage Survey", "Account Types & Usage", "Loan Services Experience",
    "Equity Agent Usage", "Mobile Banking Habits", "Savings & Investment",
    "Insurance Products Interest", "Remittance Services", "Equity Card Survey", "Branch Visit Experience"
  ],
  "Communication Habits": [
    "WhatsApp Usage Patterns", "Voice & Video Call Habits", "Social Media Platforms",
    "Email Communication", "Messaging App Preferences", "Video Streaming Habits",
    "SMS Usage Trends", "Phone Call Duration", "Group Chat Participation", "Digital Communication"
  ]
};

const QUESTIONS_POOL = [
  { question: "How frequently do you use this service?", options: ["Daily", "Weekly", "Monthly", "Rarely", "Never"], correctAnswer: 0 },
  { question: "How would you rate your overall satisfaction?", options: ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"], correctAnswer: 0 },
  { question: "Would you recommend this to a friend?", options: ["Yes", "No", "Maybe"], correctAnswer: 0 },
  { question: "What is your primary reason for using this?", options: ["Convenience", "Cost", "Quality", "Necessity", "Other"], correctAnswer: 0 },
  { question: "How likely are you to continue using this?", options: ["Very Likely", "Likely", "Unlikely", "Very Unlikely"], correctAnswer: 0 },
  { question: "How much time do you spend on this daily?", options: ["< 30 min", "30 min - 1 hr", "1-2 hrs", "2-4 hrs", "> 4 hrs"], correctAnswer: 0 },
  { question: "Which age group do you belong to?", options: ["18-24", "25-34", "35-44", "45-54", "55+"], correctAnswer: 0 },
  { question: "What is your gender?", options: ["Male", "Female", "Prefer not to say"], correctAnswer: 0 },
  { question: "Have you used this service in the past week?", options: ["Yes", "No"], correctAnswer: 0 },
  { question: "How did you hear about this service?", options: ["Friend", "Social Media", "TV/Radio", "Online Ad", "Other"], correctAnswer: 0 }
];

surveySchema.statics.seedSurveys = async function () {
  const count = await this.countDocuments();
  if (count > 0) return count;

  const surveys = [];
  CATEGORIES.forEach(category => {
    const titles = TITLES[category];
    titles.forEach(title => {
      // 10 questions per survey
      const questions = QUESTIONS_POOL.slice(0, 10).map(q => ({ ...q }));
      surveys.push({
        title,
        category,
        description: `Share your experience with ${title.toLowerCase()}.`,
        earnings: 450,
        estimatedTime: "5-10 min",
        questions,
        totalQuestions: 10,
        isActive: true
      });
    });
  });

  await this.insertMany(surveys);
  return surveys.length;
};

surveySchema.statics.getCategories = function () {
  return CATEGORIES;
};

module.exports = mongoose.model("Survey", surveySchema);