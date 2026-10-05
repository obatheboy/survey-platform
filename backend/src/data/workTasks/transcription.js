const { TASK_TYPES, TASK_PAY } = require("../../config/workTasks");

/* Transcription tasks.

   There is no audio hosting on this platform, so `spokenText` IS the audio:
   the work page reads it aloud with the browser's speech synthesiser and the
   user types what they hear. `expectedTranscript` is the written form the
   submission is scored against.

   `spokenText` and `expectedTranscript` deliberately hold the same words, so
   the only thing separating a good submission from a bad one is how closely
   the user listened and typed. work.controller.js normalises whitespace,
   case, punctuation and number words (300 <-> "three hundred") on both sides
   before comparing, so a correct transcript passes whichever convention the
   user follows.

   Accuracy at or above TRANSCRIPTION_PASS_SIMILARITY (0.85) is credited
   immediately. Anything below is queued for review rather than rejected,
   because accent and punctuation differences are legitimate. */

const CONVENTIONS = [
  "Press play and type exactly what you hear.",
  "Write numbers as digits (for example: 300, not three hundred).",
  "Use normal punctuation and capital letters.",
  "Do not add words that were not spoken and do not leave any out.",
  "Accurate transcripts are paid immediately; unclear ones go to a reviewer.",
];

const TRANSCRIPTION_TASKS = [
  {
    taskId: "trs-001",
    title: "Customer service call - delivery delay",
    category: "Customer Service",
    difficulty: "Easy",
    estimatedTime: "5 min",
    accent: "Kenyan English",
    spokenText:
      "Good afternoon, thank you for calling Swift Deliveries. I can see your order left our warehouse on Tuesday and it is currently held at the depot in Nakuru. The delay was caused by the road closure on the highway. We expect it to reach you by Friday morning at the latest. I am sorry for the inconvenience, and I have added a small credit to your account.",
    speakerNotes: "A calm customer service agent. Numbers and days matter.",
    order: 0,
  },
  {
    taskId: "trs-002",
    title: "Radio weather bulletin",
    category: "News and Media",
    difficulty: "Easy",
    estimatedTime: "5 min",
    accent: "Kenyan English",
    spokenText:
      "Here is your weather update for Wednesday. Nairobi will be cloudy in the morning with a high of 24 degrees and a low of 13. Light showers are expected in the afternoon, mainly on the western side of the city. Mombasa will stay hot and humid, reaching 32 degrees. Farmers in the Rift Valley should expect rain overnight.",
    speakerNotes:
      "A newsreader reading a bulletin. Temperature figures must be exact.",
    order: 1,
  },
  {
    taskId: "trs-003",
    title: "Clinic appointment reminder",
    category: "Health",
    difficulty: "Medium",
    estimatedTime: "6 min",
    accent: "Kenyan English",
    spokenText:
      "Hello, this is a reminder from Amani Medical Centre. Your appointment with Doctor Wanjiru is on Monday the ninth of March at half past ten in the morning. Please arrive fifteen minutes early and bring your insurance card and your previous test results. If you need to reschedule, call us on 0712 445 908 at least 24 hours before your appointment.",
    speakerNotes:
      "A recorded phone reminder. A date, a time and a phone number all appear - get them right.",
    order: 2,
  },
  {
    taskId: "trs-004",
    title: "Football interview - post match",
    category: "Sports",
    difficulty: "Medium",
    estimatedTime: "6 min",
    accent: "Kenyan English",
    spokenText:
      "It was a difficult game, I have to be honest with you. We went one goal down after eight minutes and the boys had to dig deep. In the second half we changed the shape, pushed the wingers higher, and the equaliser came from a set piece. I am proud of the character we showed, but we still gave away too many chances and that is something we must fix before Saturday.",
    speakerNotes:
      "A coach speaking quickly. Expect contractions and a mid-sentence change of direction.",
    order: 3,
  },
  {
    taskId: "trs-005",
    title: "Bank transaction notice",
    category: "Finance",
    difficulty: "Medium",
    estimatedTime: "6 min",
    accent: "Kenyan English",
    spokenText:
      "Your account ending 4417 was debited 2,500 shillings on 14 January at 6:42 in the evening. The transaction reference is QW882104. If you did not authorise this payment, please contact our fraud line immediately on 0800 720 300. Do not share your PIN or your one time password with anyone, including anyone who claims to be calling from the bank.",
    speakerNotes:
      "A bank voice notice. Account digits, amounts and the reference code are all critical.",
    order: 4,
  },
  {
    taskId: "trs-006",
    title: "School announcement - parents meeting",
    category: "Education",
    difficulty: "Easy",
    estimatedTime: "5 min",
    accent: "Kenyan English",
    spokenText:
      "Good morning parents and guardians. This is a reminder that our termly parents meeting will be held on Saturday the twenty second of February starting at nine o'clock in the main hall. Each parent will receive their child's report card and will have ten minutes with the class teacher. Please carry your national identity card for security at the gate.",
    speakerNotes:
      "A school administrator. The date is spoken as words, not digits.",
    order: 5,
  },
  {
    taskId: "trs-007",
    title: "Market vendor hawking fresh produce",
    category: "Everyday Speech",
    difficulty: "Hard",
    estimatedTime: "7 min",
    accent: "Kenyan English",
    spokenText:
      "Come come, fresh tomatoes here, very sweet today. I have got three kilos for 100 shillings, and if you take two kilos I will give you a bunch of dhania for free. The sukuma wiki is also very fresh, I picked it this morning from Limuru. Come and see, come and see, do not pass me by, I will give you a good price because you are my customer.",
    speakerNotes:
      "Fast, repetitive market speech with a lot of natural repetition. This is the hardest clip here.",
    order: 6,
  },
  {
    taskId: "trs-008",
    title: "Technical support call - wifi setup",
    category: "Technology",
    difficulty: "Medium",
    estimatedTime: "6 min",
    accent: "Kenyan English",
    spokenText:
      "Alright, so on the back of the router you will see a small sticker. It has the network name and the password printed on it. The password is case sensitive, so check that the caps lock key is off before you type it. Once you are connected, open your browser and go to 192.168.0.1, and that will take you to the setup page. If that address does not load, unplug the router for 30 seconds and plug it back in.",
    speakerNotes:
      "A support agent giving instructions. The IP address and the 30 second wait must be exact.",
    order: 7,
  },
  {
    taskId: "trs-009",
    title: "Charity appeal radio spot",
    category: "Media",
    difficulty: "Medium",
    estimatedTime: "6 min",
    accent: "Kenyan English",
    spokenText:
      "Every morning, thousands of children in this country walk to school without breakfast. 200 shillings is all it takes to feed one child for a whole week. That is less than the price of a cup of coffee. This month we are aiming to reach 5,000 children across 8 counties. Call 0800 545 212 or send the word MEAL to 22334 to give today. No child should learn on an empty stomach.",
    speakerNotes:
      "An emotional appeal read with deliberate pace. Numbers repeat throughout - keep them straight.",
    order: 8,
  },
  {
    taskId: "trs-010",
    title: "Matatu conductor and passenger exchange",
    category: "Everyday Speech",
    difficulty: "Hard",
    estimatedTime: "7 min",
    accent: "Kenyan English",
    spokenText:
      "Passenger: How much to town? Conductor: Naenda town, it is 50 shillings. Passenger: 50? Yesterday it was 40. Conductor: Yesterday was yesterday, today the fuel went up. Passenger: Okay, 50, but you must drop me at the roundabout, not at the stage. Conductor: I will drop you at the roundabout, sit here near the door, you will be the first one out. Passenger: Give me my change, I am giving you a 200 note. Conductor: 150 change, hold it, hold it, we are moving.",
    speakerNotes:
      "Two speakers in one clip. Use a new line for each speaker exactly as labelled.",
    order: 9,
  },
];

const tasks = TRANSCRIPTION_TASKS.map((task) => ({
  ...task,
  type: TASK_TYPES.TRANSCRIPTION,
  pay: TASK_PAY.TRANSCRIPTION,
  instructions: CONVENTIONS,
  // The spoken text is itself the reference transcript.
  expectedTranscript: task.expectedTranscript || task.spokenText,
  isActive: true,
}));

module.exports = { TRANSCRIPTION_TASKS: tasks };
