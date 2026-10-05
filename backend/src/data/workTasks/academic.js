const { TASK_TYPES, TASK_PAY, WORD_LIMITS } = require("../../config/workTasks");

/* Academic pieces are longer (800-1500 words) and pay the most, because they
   demand structure, sourcing and argument rather than description.

   These are review-mode tasks. To keep the queue honest, every brief states
   the required section structure up front so a reviewer can mark the
   submission against a stated standard rather than a personal preference. */

const BASE_INSTRUCTIONS = [
  "Use a clear structure: introduction, body sections, and a conclusion.",
  "Give each body section a short heading.",
  "Support claims with reasoning or examples. Do not invent statistics or citations.",
  "Write in formal but readable English. Stay within the word count.",
  "A human reviewer reads every submission before it is paid.",
];

const ACADEMIC_TASKS = [
  {
    taskId: "acw-001",
    title: "Mobile Money and Financial Inclusion in East Africa",
    category: "Economics",
    difficulty: "Hard",
    estimatedTime: "90 min",
    brief:
      "Discuss how mobile money has expanded access to financial services in East Africa. Argue a position on whether it has done more to include or to exclude poorer households, and support the argument with reasoning rather than invented data.",
    angles: [
      "Who gained access that banks did not reach",
      "Costs that still shut some people out",
      "What would make inclusion more complete",
    ],
    requiredSections: [
      "Introduction",
      "Evidence and Analysis",
      "Counter-argument",
      "Conclusion",
    ],
    reviewerNotes:
      "Must take a position and defend it. A purely descriptive summary without an argument does not meet the brief.",
    order: 0,
  },
  {
    taskId: "acw-002",
    title: "The Role of Small Businesses in Reducing Youth Unemployment",
    category: "Development Studies",
    difficulty: "Medium",
    estimatedTime: "80 min",
    brief:
      "Examine how small and medium enterprises absorb young workers, and evaluate the main obstacles that stop them from creating more jobs. Conclude with a judgement on which obstacle matters most.",
    angles: [
      "Why young people are hired by small firms",
      "Access to capital and its limits",
      "Skills mismatch between graduates and employers",
    ],
    requiredSections: [
      "Introduction",
      "The Job Creation Case",
      "Obstacles",
      "Conclusion",
    ],
    reviewerNotes:
      "The conclusion must name a single most important obstacle and justify the choice.",
    order: 1,
  },
  {
    taskId: "acw-003",
    title: "Benefits and Risks of Artificial Intelligence in Education",
    category: "Education and Technology",
    difficulty: "Medium",
    estimatedTime: "80 min",
    brief:
      "Analyse how AI tools are being used in schools and universities. Weigh the genuine benefits against the risks, and argue for a specific rule or safeguard you think institutions should adopt.",
    angles: [
      "Personalised practice and feedback",
      "Academic honesty and assessment",
      "Unequal access between schools",
    ],
    requiredSections: [
      "Introduction",
      "Benefits",
      "Risks",
      "Recommendation",
      "Conclusion",
    ],
    reviewerNotes:
      "The recommendation must be specific and implementable, not a call for vague 'awareness'.",
    order: 2,
  },
  {
    taskId: "acw-004",
    title: "Climate Change Adaptation for Smallholder Farmers",
    category: "Environmental Studies",
    difficulty: "Hard",
    estimatedTime: "90 min",
    brief:
      "Discuss the adaptation strategies available to smallholder farmers facing changing rainfall patterns. Evaluate which strategies are most realistic for farmers with limited capital, and explain why.",
    angles: [
      "Changing planting calendars",
      "Water harvesting and irrigation",
      "Why some well-known advice fails in practice",
    ],
    requiredSections: [
      "Introduction",
      "Adaptation Strategies",
      "Evaluation",
      "Conclusion",
    ],
    reviewerNotes:
      "Must weigh cost and feasibility, not just list strategies as though all are available to everyone.",
    order: 3,
  },
  {
    taskId: "acw-005",
    title: "Should Public Healthcare Prioritise Prevention Over Treatment?",
    category: "Public Health",
    difficulty: "Hard",
    estimatedTime: "90 min",
    brief:
      "Argue either for or against shifting a larger share of public health spending towards prevention. Address the strongest objection to your position before concluding.",
    angles: [
      "The long-run case for prevention",
      "Why prevention is politically difficult",
      "The objection that treatment saves lives now",
    ],
    requiredSections: [
      "Introduction",
      "Position",
      "The Case Against",
      "Conclusion",
    ],
    reviewerNotes:
      "The counter-argument section is mandatory and must be argued fairly, not strawmanned.",
    order: 4,
  },
  {
    taskId: "acw-006",
    title: "Remote Work and Its Effect on Productivity and Wellbeing",
    category: "Management Studies",
    difficulty: "Medium",
    estimatedTime: "80 min",
    brief:
      "Evaluate the evidence and reasoning on both sides of the remote work debate. Conclude with a position on which working arrangement suits most knowledge workers, and acknowledge where your conclusion could be wrong.",
    angles: [
      "Focus and deep work",
      "Collaboration and mentorship costs",
      "Isolation and boundaries",
    ],
    requiredSections: [
      "Introduction",
      "The Case for Remote Work",
      "The Case Against",
      "Conclusion",
    ],
    reviewerNotes:
      "The conclusion must include one honest limitation of the author's own position.",
    order: 5,
  },
];

const tasks = ACADEMIC_TASKS.map((task) => ({
  ...task,
  type: TASK_TYPES.ACADEMIC,
  pay: TASK_PAY.ACADEMIC,
  instructions: task.instructions || BASE_INSTRUCTIONS,
  wordLimits: { ...WORD_LIMITS.ACADEMIC },
  isActive: true,
}));

module.exports = { ACADEMIC_TASKS: tasks };
