const { TASK_TYPES, TASK_PAY, WORD_LIMITS } = require("../../config/workTasks");

/* Articles are short written pieces (300-600 words) written from a brief.

   These are review-mode tasks: a human judges the writing, so the payout is
   credited when an admin approves the submission, not when it is sent. Each
   brief therefore states exactly what the reviewer will look for, so a user
   is never guessing at the standard they are being held to. */

const BASE_INSTRUCTIONS = [
  "Write in your own words. Do not copy text from other websites.",
  "Follow the brief and stay inside the word count shown.",
  "Use short paragraphs. Plain English is better than jargon.",
  "A human reviewer reads every submission before it is paid.",
];

const ARTICLE_TASKS = [
  {
    taskId: "art-001",
    title: "Why Mobile Money Changed Small Business in Kenya",
    category: "Business",
    difficulty: "Easy",
    estimatedTime: "30 min",
    brief:
      "Explain how mobile money such as M-Pesa changed the way small businesses in Kenya handle payments. Cover at least one practical benefit for the shop owner and at least one challenge.",
    angles: [
      "A shop owner's daily routine before and after mobile money",
      "Why cash handling was expensive and risky",
      "What still does not work well",
    ],
    reviewerNotes:
      "Look for concrete, specific examples rather than general praise for technology.",
    order: 0,
  },
  {
    taskId: "art-002",
    title: "A Beginner's Guide to Saving Your First KES 10,000",
    category: "Personal Finance",
    difficulty: "Easy",
    estimatedTime: "30 min",
    brief:
      "Write a practical, non-judgemental guide for someone who has never saved before and wants to reach their first KES 10,000. Include at least three concrete steps and one realistic setback a reader should expect.",
    angles: [
      "Choosing a savings target that is actually reachable",
      "Separating savings from spending money",
      "What to do when an emergency eats the savings",
    ],
    reviewerNotes:
      "Advice must be actionable and must not promise guaranteed returns or specific interest rates.",
    order: 1,
  },
  {
    taskId: "art-003",
    title: "How to Prepare for a Job Interview With No Experience",
    category: "Careers",
    difficulty: "Medium",
    estimatedTime: "35 min",
    brief:
      "Write for a first-time job seeker with no formal work history. Explain how to answer the experience question honestly and how to present school, volunteer or family work as evidence of ability.",
    angles: [
      "Answering 'tell me about yourself' without experience",
      "Turning unpaid work into a real example",
      "Questions to ask the interviewer",
    ],
    reviewerNotes:
      "Must avoid cliches like 'just be confident' without explaining how.",
    order: 2,
  },
  {
    taskId: "art-004",
    title: "Understanding Your Electricity Bill",
    category: "Everyday Life",
    difficulty: "Medium",
    estimatedTime: "35 min",
    brief:
      "Explain the main line items on a typical Kenyan household electricity bill in plain language, and give the reader three realistic ways to reduce what they pay each month.",
    angles: [
      "What each charge on the bill actually means",
      "Which appliances cost the most to run",
      "Cheap changes that add up",
    ],
    reviewerNotes:
      "Do not quote exact tariff figures; explain the structure instead.",
    order: 3,
  },
  {
    taskId: "art-005",
    title: "Why Your Phone Gets Slow, and What Actually Helps",
    category: "Technology",
    difficulty: "Easy",
    estimatedTime: "30 min",
    brief:
      "Explain in everyday language the common reasons a mid-range Android phone slows down, then give three fixes that genuinely help and two 'fixes' that are a waste of time.",
    angles: [
      "Storage, not memory, is usually the problem",
      "Why clearing the cache rarely helps",
      "When a phone is simply finished",
    ],
    reviewerNotes:
      "Must distinguish real fixes from superstition, and must not recommend anything that voids a warranty.",
    order: 4,
  },
  {
    taskId: "art-006",
    title: "Starting a Small Vegetable Garden on a Small Plot",
    category: "Food and Farming",
    difficulty: "Medium",
    estimatedTime: "35 min",
    brief:
      "Write a starter guide for someone with very little space - a balcony, a courtyard, or a small plot. Cover soil, water, sunlight and three crops that are hard to fail with.",
    angles: [
      "Working out how much sun you actually get",
      "Containers versus open ground",
      "Crops that forgive mistakes",
    ],
    reviewerNotes:
      "Advice must be realistic for a small urban space, not a farm.",
    order: 5,
  },
  {
    taskId: "art-007",
    title: "How to Check Whether News Online Is Real",
    category: "Media Literacy",
    difficulty: "Medium",
    estimatedTime: "35 min",
    brief:
      "Give the reader a short, repeatable routine for testing whether a story they saw on WhatsApp or social media is genuine. Explain three warning signs in detail.",
    angles: [
      "Reading past the headline",
      "Checking who else is reporting it",
      "Why a screenshot is not evidence",
    ],
    reviewerNotes:
      "Steps must be things a reader can do in under five minutes on a phone.",
    order: 6,
  },
  {
    taskId: "art-008",
    title: "What a First-Time Landlord Should Know",
    category: "Property",
    difficulty: "Hard",
    estimatedTime: "40 min",
    brief:
      "Write for someone about to rent out a single house or plot for the first time. Explain the practical steps before advertising, what belongs in a written agreement, and one mistake that costs landlords the most money.",
    angles: [
      "Screening a tenant before handing over keys",
      "What the agreement must state in writing",
      "Handling repairs and deposits fairly",
    ],
    reviewerNotes:
      "Must stay general and must not give legal advice or claim to.",
    order: 7,
  },
  {
    taskId: "art-009",
    title: "The Case for Walking to Work",
    category: "Health",
    difficulty: "Easy",
    estimatedTime: "30 min",
    brief:
      "Write a persuasive but honest piece encouraging readers to walk part of their commute. Acknowledge the real barriers - distance, heat, safety, time - and answer them.",
    angles: [
      "What thirty minutes of walking actually does",
      "Not everyone can walk; be honest about that",
      "Making it fit around a real working day",
    ],
    reviewerNotes:
      "Must avoid claiming health outcomes beyond general wellbeing and fitness.",
    order: 8,
  },
  {
    taskId: "art-010",
    title: "How Small Shops Can Sell Online Without a Big Budget",
    category: "Business",
    difficulty: "Medium",
    estimatedTime: "35 min",
    brief:
      "Explain how a single-location shop can start taking orders online using tools that cost little or nothing, and what part of the process usually breaks first.",
    angles: [
      "What to sell online first, and what not to",
      "Delivery: the part most shops underestimate",
      "Handling payment without a card machine",
    ],
    reviewerNotes:
      "Must name the tradeoffs of each tool honestly instead of presenting one as perfect.",
    order: 9,
  },
];

const tasks = ARTICLE_TASKS.map((task) => ({
  ...task,
  type: TASK_TYPES.ARTICLE,
  pay: TASK_PAY.ARTICLE,
  instructions: task.instructions || BASE_INSTRUCTIONS,
  wordLimits: { ...WORD_LIMITS.ARTICLE },
  isActive: true,
}));

module.exports = { ARTICLE_TASKS: tasks };
