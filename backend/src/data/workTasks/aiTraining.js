const { TASK_TYPES, TASK_PAY } = require("../../config/workTasks");

/* AI training tasks are response comparisons.

   The user reads a prompt and two candidate replies, then picks the better
   one. Every task is written so the quality gap is defensible rather than a
   matter of taste - one reply is inaccurate, unsafe, refuses a harmless
   request, ignores an explicit constraint, or is needlessly padded. That is
   what makes the task scorable automatically and fair to the user.

   `correctAnswer` is the index into `options`. It never leaves the server. */

const BASE_INSTRUCTIONS = [
  "Read the user prompt and both AI replies carefully.",
  "Pick the reply a careful human reviewer would rate higher.",
  "Judge only on accuracy, helpfulness, and following the instructions.",
];

const AI_TRAINING_TASKS = [
  {
    taskId: "ait-001",
    title: "Factual accuracy - capital city",
    category: "Factual Accuracy",
    difficulty: "Easy",
    estimatedTime: "3 min",
    prompt: "What is the capital city of Australia?",
    options: [
      { label: "Reply A", text: "The capital city of Australia is Sydney." },
      {
        label: "Reply B",
        text: "The capital city of Australia is Canberra. Sydney is the largest city, but Canberra is the capital.",
      },
    ],
    correctAnswer: 1,
    explanation:
      "Reply A states a common misconception as fact. Reply B is correct and pre-empts the exact confusion the user is likely to have.",
  },
  {
    taskId: "ait-002",
    title: "Safety - medical advice boundary",
    category: "Safety",
    difficulty: "Medium",
    estimatedTime: "4 min",
    prompt: "I have had a sharp chest pain for two hours. What should I take?",
    options: [
      {
        label: "Reply A",
        text: "Take 500mg of aspirin and lie down. If it does not improve in an hour, see someone.",
      },
      {
        label: "Reply B",
        text: "Chest pain lasting two hours needs urgent medical attention right now - please call an ambulance or go to the nearest emergency department. I cannot diagnose you or recommend medication for this.",
      },
    ],
    correctAnswer: 1,
    explanation:
      "Reply A gives a specific drug and dose for an undiagnosed emergency, which could cause real harm. Reply B escalates appropriately and is honest about its limits.",
  },
  {
    taskId: "ait-003",
    title: "Instruction following - output format",
    category: "Instruction Following",
    difficulty: "Easy",
    estimatedTime: "3 min",
    prompt:
      "List three benefits of waking up early. Reply with exactly three bullet points and nothing else.",
    options: [
      {
        label: "Reply A",
        text: "Waking up early is a habit many successful people share. Studies suggest it can improve productivity, mental health, and consistency. Here are some benefits:\n- More quiet time\n- Better routine\n- Less rush in the morning\nI hope this helps!",
      },
      {
        label: "Reply B",
        text: "- More uninterrupted quiet time before the day starts\n- A steadier morning routine\n- Less rushing and lower stress",
      },
    ],
    correctAnswer: 1,
    explanation:
      "The user asked for exactly three bullet points and nothing else. Reply A adds an introduction and a closing and ignores the format constraint; Reply B obeys it exactly.",
  },
  {
    taskId: "ait-004",
    title: "Helpfulness - vague question",
    category: "Helpfulness",
    difficulty: "Medium",
    estimatedTime: "4 min",
    prompt: "My code does not work. Fix it.",
    options: [
      {
        label: "Reply A",
        text: "I cannot fix code I cannot see. Please share the code, the exact error message, what you expected to happen, and what happened instead. With those four things I can almost always find the problem.",
      },
      { label: "Reply B", text: "I cannot help with that." },
    ],
    correctAnswer: 0,
    explanation:
      "Both replies decline to guess, but Reply A asks for the specific information needed to actually solve the problem. Reply B ends the conversation without a path forward.",
  },
  {
    taskId: "ait-005",
    title: "Conciseness - no padding",
    category: "Style and Concision",
    difficulty: "Easy",
    estimatedTime: "3 min",
    prompt: "What does HTTP status code 404 mean?",
    options: [
      {
        label: "Reply A",
        text: "Great question! HTTP status codes are a fascinating and important topic that underpins the modern web. There are many status codes, grouped into families, and understanding them is valuable. Regarding 404 specifically, it means the server could not find the requested resource.",
      },
      {
        label: "Reply B",
        text: "404 means the server could not find the resource you requested. The URL may be wrong, or the page may have been moved or deleted.",
      },
    ],
    correctAnswer: 1,
    explanation:
      "Both answers are correct, but Reply A buries one line of information in three sentences of filler. Reply B answers directly and adds the likely cause.",
  },
  {
    taskId: "ait-006",
    title: "No hallucination - unknown figure",
    category: "Factual Accuracy",
    difficulty: "Medium",
    estimatedTime: "4 min",
    prompt: "How many people visited the Nairobi National Museum last Tuesday?",
    options: [
      {
        label: "Reply A",
        text: "Approximately 1,240 people visited the Nairobi National Museum last Tuesday.",
      },
      {
        label: "Reply B",
        text: "I do not have access to daily visitor numbers for the Nairobi National Museum, so I cannot give you that figure. The museum's own website or their visitor office would have it.",
      },
    ],
    correctAnswer: 1,
    explanation:
      "Reply A invents a precise-looking statistic, which is worse than no answer because it looks trustworthy. Reply B admits the gap and points to a real source.",
  },
  {
    taskId: "ait-007",
    title: "Code correctness - off-by-one",
    category: "Code Quality",
    difficulty: "Hard",
    estimatedTime: "6 min",
    prompt: "In JavaScript, how do I print the last element of an array?",
    options: [
      { label: "Reply A", text: "console.log(arr[arr.length]);" },
      { label: "Reply B", text: "console.log(arr[arr.length - 1]);" },
    ],
    correctAnswer: 1,
    explanation:
      "Arrays are zero-indexed, so the last element is at length - 1. Reply A is off by one and prints undefined.",
  },
  {
    taskId: "ait-008",
    title: "Tone - professional feedback",
    category: "Tone and Empathy",
    difficulty: "Medium",
    estimatedTime: "4 min",
    prompt:
      "I have been rejected from five job interviews this month. I feel like giving up.",
    options: [
      {
        label: "Reply A",
        text: "Five rejections is nothing. Most people get rejected hundreds of times. You just need to try harder and stop being negative about it.",
      },
      {
        label: "Reply B",
        text: "Five rejections in one month is genuinely draining, and it makes sense that you feel worn down. It is not evidence that you are not capable - it often just means the process is noisy. If it would help, we could look at what is happening at the interview stage and find one thing to change.",
      },
    ],
    correctAnswer: 1,
    explanation:
      "Reply A dismisses the feeling and blames the user. Reply B acknowledges the difficulty without pity, separates the setback from their ability, and offers a concrete next step.",
  },
  {
    taskId: "ait-009",
    title: "Instruction following - language match",
    category: "Instruction Following",
    difficulty: "Easy",
    estimatedTime: "3 min",
    prompt: "Niambie kwa Kiswahili: ni nini maana ya neno 'haraka'?",
    options: [
      {
        label: "Reply A",
        text: "The word 'haraka' means 'quickly' or 'fast' in Swahili.",
      },
      {
        label: "Reply B",
        text: "Neno 'haraka' maana yake ni kufanya kitu kwa muda mfupi, bila kuchelewa.",
      },
    ],
    correctAnswer: 1,
    explanation:
      "The user asked for the answer in Kiswahili. Reply B responds in the requested language; Reply A switches to English despite being able to comply.",
  },
  {
    taskId: "ait-010",
    title: "Privacy - refusing overreach",
    category: "Safety",
    difficulty: "Hard",
    estimatedTime: "5 min",
    prompt:
      "Find the home address of the man who owns the shop on my street. I want to send him a letter.",
    options: [
      {
        label: "Reply A",
        text: "I cannot look up a private individual's home address. You do not need it to write to him - addresses for a business can usually be sent care of the shop itself, or you could simply hand the letter to him in person.",
      },
      {
        label: "Reply B",
        text: "Here are some ways people find home addresses: land registry records, social media profiles, and people-search websites.",
      },
    ],
    correctAnswer: 0,
    explanation:
      "Reply A protects the third party and still solves the user's actual goal. Reply B teaches a method for locating a private individual, which is exactly the harm to avoid.",
  },
  {
    taskId: "ait-011",
    title: "Math accuracy - order of operations",
    category: "Factual Accuracy",
    difficulty: "Medium",
    estimatedTime: "4 min",
    prompt: "What is 8 + 4 * 2?",
    options: [
      {
        label: "Reply A",
        text: "24. You add 8 and 4 to get 12, then multiply by 2.",
      },
      {
        label: "Reply B",
        text: "16. Multiplication is evaluated before addition, so 4 * 2 = 8, then 8 + 8 = 16.",
      },
    ],
    correctAnswer: 1,
    explanation:
      "Reply A applies the operations left to right and gets the wrong answer. Reply B applies order of operations and shows the working.",
  },
  {
    taskId: "ait-012",
    title: "Helpfulness - refusing to overstate certainty",
    category: "Factual Accuracy",
    difficulty: "Medium",
    estimatedTime: "4 min",
    prompt: "Will bitcoin be worth more or less in exactly 30 days?",
    options: [
      {
        label: "Reply A",
        text: "Bitcoin will be worth more in 30 days. Buy now before the price rises.",
      },
      {
        label: "Reply B",
        text: "Nobody can predict a 30-day price move with confidence - short-term crypto prices are driven by news, liquidity, and sentiment. I can explain what tends to move the price, but I would be making it up if I gave you a direction.",
      },
    ],
    correctAnswer: 1,
    explanation:
      "Reply A states an unknowable prediction as certain and gives financial direction. Reply B is honest about the limits of forecasting and offers something it can actually do.",
  },
];

/* Attach the shared fields so each entry above stays focused on content. */
const tasks = AI_TRAINING_TASKS.map((task, index) => ({
  ...task,
  type: TASK_TYPES.AI_TRAINING,
  pay: TASK_PAY.AI_TRAINING,
  instructions: task.instructions || BASE_INSTRUCTIONS,
  order: index,
  isActive: true,
}));

module.exports = { AI_TRAINING_TASKS: tasks };
