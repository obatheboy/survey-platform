// ========================= surveyQuestionBank.js =========================
// Real question banks for every hardcoded survey, keyed by exact survey title.
//
// WHY THIS FILE EXISTS
// The previous implementation generated questions from 10 generic templates
// and spliced the survey title into the stem, e.g.
//   "How often do you engage with this topic about morning routine habits
//    in the mobile money & payments space?"
// That meant all 60 surveys asked the identical 10 questions, and several
// paired a title with an unrelated EXTRA_TOPICS word. Users saw the same
// survey no matter which task they tapped.
//
// These questions are written per survey so each task is genuinely distinct
// and relevant to its own title. Options are Kenya-specific where it matters
// (M-Pesa, matatu, boda, county, etc.) because the audience is Kenyan.
//
// RULES FOR EDITING
// 1. The key MUST match a title in SURVEY_TITLES_BY_CATEGORY (surveys.js)
//    exactly, including punctuation. surveys.js throws on a missing key so a
//    typo fails loudly at load instead of silently falling back.
// 2. Keep exactly 10 questions per survey (SURVEYS_PER_USER * style rules).
// 3. IDs are positional (q1..q10) and are generated in getQuestionsFor().
//    Do not hand-write them here.
//
// Option counts may vary (3-5). Multiple choice is enough; there is no scale,
// ranking or free-text question type in the take UI.

const q = (question, options) => ({ question, options });

export const SURVEY_QUESTION_BANK = {
  // ------------------------------------------------------------------
  // Daily Lifestyle
  // ------------------------------------------------------------------
  "Morning Routine Habits": [
    q("What time do you usually wake up on a normal weekday?", ["Before 5:00 AM", "5:00 - 6:30 AM", "6:30 - 8:00 AM", "After 8:00 AM"]),
    q("How long does it take you to get ready before leaving the house?", ["Under 15 minutes", "15 - 30 minutes", "30 - 60 minutes", "More than an hour"]),
    q("Which activity takes up most of your first hour of the day?", ["Checking my phone", "Household chores", "Taking care of children", "Commuting to work or school", "Working out"]),
    q("Do you eat breakfast on most weekdays?", ["Every weekday", "Most weekdays", "Rarely", "Never"]),
    q("What do you usually have for breakfast?", ["Tea or coffee only", "Bread and eggs", "Ugali with tea", "Porridge", "I skip breakfast"]),
    q("How do you feel about your morning routine overall?", ["It works well for me", "It is mostly fine", "I find it rushed", "I struggle every morning"]),
    q("How much of your morning is spent on your phone?", ["Less than 15 minutes", "15 - 30 minutes", "30 - 60 minutes", "More than an hour"]),
    q("Do you make a to-do list for the day?", ["Every day", "Some days", "Rarely", "Never"]),
    q("What usually disrupts your morning the most?", ["Traffic", "Family demands", "Work or school deadlines", "Power or water interruptions", "Nothing in particular"]),
    q("Would you trade a later start for one less task in the morning?", ["Definitely", "Probably", "Not sure", "No, I need the early start"]),
  ],

  "Sleep Patterns & Quality": [
    q("How many hours of sleep do you get on a typical night?", ["Under 5 hours", "5 - 6 hours", "6 - 7 hours", "7 - 8 hours", "More than 8 hours"]),
    q("How often do you feel fully rested when you wake up?", ["Almost every morning", "Most mornings", "Some mornings", "Rarely"]),
    q("What usually keeps you awake at night?", ["Noise", "Worry or stress", "Using my phone", "Neighbours or family", "Nothing keeps me awake"]),
    q("How often do you take a short nap during the day?", ["Daily", "A few times a week", "Rarely", "Never"]),
    q("How late do you usually use your phone before sleeping?", ["Before 9:00 PM", "9:00 - 10:30 PM", "10:30 PM - midnight", "After midnight"]),
    q("Do you feel you get enough sleep on school or work nights?", ["Always", "Usually", "Often not", "Never"]),
    q("Where do you usually sleep?", ["Own bed", "Floor mat", "Sofa or chair", "Shifting between places"]),
    q("How would you rate the quality of your sleep overall?", ["Excellent", "Good", "Average", "Poor", "Very poor"]),
    q("Do you take anything to help you sleep?", ["Never", "Occasionally", "Often", "Regularly"]),
    q("Has your sleep pattern changed over the past year?", ["Much better", "Slightly better", "Stayed the same", "Slightly worse", "Much worse"]),
  ],

  "Daily Productivity": [
    q("How many hours a day do you spend on paid or school work?", ["Under 2 hours", "2 - 4 hours", "4 - 6 hours", "6 - 8 hours", "More than 8 hours"]),
    q("Which best describes how your day is structured?", ["Fixed schedule", "Task-based", "Follows what others decide", "No real structure"]),
    q("How do you usually decide what to do first each day?", ["I write a list", "I pick the most urgent task", "Whatever comes first", "Someone else tells me"]),
    q("How often do you get interrupted during your main task?", ["Constantly", "Often", "Sometimes", "Rarely"]),
    q("How many tasks do you typically finish in a day?", ["None", "One", "Two or three", "Four or five", "More than five"]),
    q("How do you track what you have completed?", ["Written list", "Phone or laptop app", "Calendar", "In my head"]),
    q("When you hit a task you dislike, what do you do?", ["Push through it", "Do something easier first", "Take a break", "Leave it for later"]),
    q("How productive do you feel on an average day?", ["Very productive", "Productive", "About average", "Not very productive", "Not productive at all"]),
    q("Do you work better in the morning or evening?", ["Morning", "Afternoon", "Evening", "It varies"]),
    q("What would most improve your productivity?", ["Fewer distractions", "Better tools", "Clearer instructions", "More training", "Longer hours"]),
  ],

  "Weekend Activities": [
    q("How do you usually spend your Saturday?", ["Relaxing at home", "Family or church", "Sport or exercise", "Errands and shopping", "Work"]),
    q("How much do you spend on weekends in a typical month?", ["Under KES 1,000", "KES 1,000 - 3,000", "KES 3,000 - 6,000", "More than KES 6,000"]),
    q("How often do you go out on weekends?", ["Every weekend", "Most weekends", "Some weekends", "Rarely"]),
    q("What is your main reason for spending time with others?", ["Socialising", "Family duties", "Relaxing", "Making money", "Religious or community"]),
    q("How much rest do you actually get on weekends?", ["A lot more than weekdays", "A little more", "About the same", "Less than weekdays"]),
    q("Do you do household or family errands on weekends?", ["A lot", "Some", "Very few", "None"]),
    q("How do you usually get around on weekends?", ["Walking", "Matatu or bus", "Boda boda or tuk-tuk", "Bicycle", "Car"]),
    q("Which weekend activity would you most like to do more often?", ["Travelling", "Sport", "Social events", "Reading", "Resting"]),
    q("Do you plan your weekends ahead of time?", ["Always", "Sometimes", "Rarely", "Never"]),
    q("How satisfied are you with how you spend your weekends?", ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied"]),
  ],

  "Home Organization": [
    q("How would you rate the general tidiness of your home?", ["Very tidy", "Tidy", "Manageable", "Messy", "Very messy"]),
    q("Do you have a specific place for everything you own?", ["Yes, everywhere", "Most things", "Some things", "No, things are scattered"]),
    q("How often do you clean your house?", ["Every day", "A few times a week", "Weekly", "Monthly", "When it gets bad"]),
    q("What is the hardest room in your home to keep organised?", ["Kitchen", "Bedroom", "Living room", "Bathroom", "No room is hard"]),
    q("How much storage space do you have?", ["Plenty", "Enough", "Just barely", "Not enough", "I am storing outside"]),
    q("Do you label or mark your storage boxes and containers?", ["Always", "Often", "Rarely", "Never"]),
    q("How long does it take you to find something you have misplaced?", ["Under a minute", "A few minutes", "About half an hour", "I often give up"]),
    q("Who is mainly responsible for organising your home?", ["I am", "I share it equally", "Another family member", "A hired cleaner"]),
    q("Which organising task would save you the most time?", ["Laundry", "Dishes", "Laundry folding and ironing", "Storage and labelling"]),
    q("Has your home organisation improved over the past year?", ["A lot", "A little", "No change", "It got worse"]),
  ],

  "Personal Care & Grooming": [
    q("How much do you spend on grooming products in a month?", ["Nothing", "Under KES 500", "KES 500 - 1,500", "KES 1,500 - 3,000", "More than KES 3,000"]),
    q("How often do you visit a barber or salon?", ["Weekly", "Monthly", "Every few months", "Once or twice a year", "Never"]),
    q("Which do you spend the most on for grooming?", ["Hair", "Skin", "Deodorant and fragrance", "Nails", "Nothing in particular"]),
    q("How satisfied are you with your current grooming routine?", ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied"]),
    q("Do you follow a skincare or grooming routine daily?", ["Yes, consistently", "Some days", "Rarely", "No"]),
    q("Where do you buy most grooming products?", ["Supermarket", "Pharmacy", "Online", "Local shop or kiosk", "Salon"]),
    q("How important is your appearance to you?", ["Very important", "Somewhat important", "Not important", "It depends on the occasion"]),
    q("What would most improve your grooming routine?", ["Better products", "Less time needed", "Professional help", "More money", "Nothing"]),
    q("Do weather or climate affect your grooming choices?", ["Yes, constantly", "Sometimes", "Rarely", "Not at all"]),
    q("Have you ever tried a grooming product because of an advert or influencer?", ["Yes, often", "Once or twice", "No"]),
  ],

  "Stress Management": [
    q("How often do you feel stressed or overwhelmed?", ["Daily", "Most days", "A few times a week", "Rarely", "Never"]),
    q("What is your main source of stress right now?", ["Money", "Family responsibilities", "Work or school", "Health worries", "Unemployment or idle time"]),
    q("What do you do when you feel stressed?", ["Sleep or rest", "Talk to someone", "Exercise", "Watch TV or scroll my phone", "Pray or worship", "Nothing"]),
    q("Do you feel you have anyone to talk to when things get hard?", ["Yes, several people", "Yes, one or two", "Not really", "No one"]),
    q("How much do stress and worry affect your sleep?", ["Not at all", "A little", "Quite a bit", "A great deal"]),
    q("Do you exercise to manage stress?", ["Regularly", "Sometimes", "Not really"]),
    q("How would you rate your overall stress levels this month?", ["Very high", "High", "Moderate", "Low", "Very low"]),
    q("Have you ever felt that you needed help with your mental health?", ["Yes, and I got it", "Yes, but never got help", "No"]),
    q("Do you talk to anyone about money stress specifically?", ["Often", "Sometimes", "Rarely", "Never"]),
    q("What would help you most right now?", ["A steady income", "Support from family", "Professional help", "Time to rest", "Nothing specific"]),
  ],

  "Time Management": [
    q("How do you usually estimate how long a task will take?", ["Accurately", "Slightly under", "Slightly over", "I have no idea"]),
    q("Are you usually late for appointments?", ["Never", "Rarely", "Sometimes", "Often", "Almost always"]),
    q("How do you keep track of your tasks and deadlines?", ["Phone calendar", "Written diary", "Notes app", "Sticky notes around the house", "I do not track them"]),
    q("How often do you overestimate or underestimate how long something takes?", ["Always underestimate", "Usually underestimate", "Usually overestimate", "Usually accurate"]),
    q("What takes up the most unplanned time in your day?", ["Family interruptions", "Transport", "Phone use", "Household chores", "Work or school tasks"]),
    q("How often do you multitask during the day?", ["Constantly", "Often", "Sometimes", "Rarely"]),
    q("Do you set yourself deadlines for tasks?", ["Always", "Often", "Sometimes", "Never"]),
    q("How much free time do you have on a normal weekday?", ["None", "Under an hour", "1 - 2 hours", "More than 2 hours"]),
    q("How would you rate your time management skills?", ["Excellent", "Good", "Fair", "Poor", "Very poor"]),
    q("What time management method would help you most?", ["A planner or diary", "Reminders on my phone", "A daily routine", "Less multitasking", "Support from others"]),
  ],

  "Daily Commute Experience": [
    q("How do you travel to work or school most often?", ["Walking", "Matatu or bus", "Boda boda or tuk-tuk", "Bicycle", "Car", "Motorcycle"]),
    q("How long is your usual one-way trip?", ["Under 15 minutes", "15 - 30 minutes", "30 - 60 minutes", "1 - 2 hours", "More than 2 hours"]),
    q("How much do you spend on transport in a week?", ["Nothing", "Under KES 200", "KES 200 - 500", "KES 500 - 1,000", "More than KES 1,000"]),
    q("How crowded is the transport you normally use?", ["Always crowded", "Often crowded", "Sometimes crowded", "Rarely crowded"]),
    q("How reliable is the transport you use?", ["Very reliable", "Mostly reliable", "Unpredictable", "Rarely reliable"]),
    q("Have you ever been stranded waiting for transport for over an hour?", ["Yes, often", "Yes, a few times", "Once", "Never"]),
    q("What is the worst part of your commute?", ["Waiting", "Crowding", "Fares", "Delays and breakdowns", "Safety concerns", "Long distance"]),
    q("How safe do you feel travelling alone, especially at night?", ["Very safe", "Mostly safe", "Not very safe", "Not safe at all"]),
    q("Would you take a different job for a shorter commute?", ["Yes, immediately", "Maybe", "Only if pay improved too", "No"]),
    q("What would most improve your daily commute?", ["Better roads", "More vehicles", "Lower fares", "Reliable schedules", "Safer routes"]),
  ],

  "Evening Relaxation Habits": [
    q("What time do you usually finish your last task of the day?", ["Before 6:00 PM", "6:00 - 8:00 PM", "8:00 - 10:00 PM", "After 10:00 PM"]),
    q("How do you usually relax in the evening?", ["Watch TV", "Scroll my phone", "Listen to music", "Talk to family", "Read", "Do nothing"]),
    q("How long do you relax before sleeping?", ["Under 20 minutes", "20 - 45 minutes", "1 - 2 hours", "More than 2 hours"]),
    q("Do you watch series or films in the evening?", ["Every night", "A few nights a week", "Weekends only", "Rarely"]),
    q("How often do you take a proper evening walk?", ["Most evenings", "A few times a week", "Rarely", "Never"]),
    q("Do you feel tired by the time you get a chance to rest?", ["Always exhausted", "Usually tired", "A little tired", "Not tired"]),
    q("What would make your evenings better?", ["Less evening work", "Cheaper food", "Company", "Free time", "Earlier nights"]),
    q("Do you talk about your day with someone in the evening?", ["Yes, most days", "Sometimes", "Rarely", "Never"]),
    q("How would you rate how well you switch off after work or school?", ["Very well", "Well", "Not really", "I struggle to switch off"]),
    q("How often do you fall asleep while scrolling your phone?", ["Almost nightly", "Often", "Sometimes", "Never"]),
  ],

  // ------------------------------------------------------------------
  // Food
  // ------------------------------------------------------------------
  "Breakfast Habits Survey": [
    q("What time do you usually eat breakfast?", ["Before 7:00 AM", "7:00 - 9:00 AM", "9:00 - 11:00 AM", "I skip breakfast"]),
    q("How often do you eat breakfast?", ["Every day", "5 - 6 days a week", "2 - 4 days a week", "Rarely"]),
    q("Where do you usually eat breakfast?", ["At home", "At a roadside stall", "At work or school", "At a cafe", "Varies"]),
    q("What is your most common breakfast?", ["Tea and bread", "Tea and mandazi or chapati", "Porridge", "Eggs and sausage", "Leftovers from the previous night", "Nothing"]),
    q("Do you drink anything with breakfast?", ["Tea", "Coffee", "Milk", "Juice", "Water only"]),
    q("How much does breakfast usually cost you?", ["Nothing, I cook", "Under KES 50", "KES 50 - 150", "KES 150 - 300", "More than KES 300"]),
    q("How important is breakfast to your daily energy?", ["Essential", "Important", "Nice to have", "Not important"]),
    q("Do you prepare breakfast the night before?", ["Always", "Often", "Sometimes", "Never"]),
    q("Would you eat a healthier breakfast if it were affordable and nearby?", ["Definitely", "Probably", "Not sure", "No"]),
    q("What stops you eating breakfast?", ["I am not hungry", "No time", "No money", "Nothing stops me"]),
  ],

  "Fast Food Preferences": [
    q("How often do you eat fast food?", ["Several times a week", "About once a week", "Once or twice a month", "Rarely", "Never"]),
    q("Which fast food do you prefer most?", ["Chicken and chips", "Pizza", "Burgers", "Sausage rolls", "Local street food"]),
    q("What do you usually order with your fast food?", ["Chips", "Cold drink", "Coleslaw", "Nothing extra", "A full meal"]),
    q("How much do you spend on fast food in a month?", ["Nothing", "Under KES 500", "KES 500 - 1,500", "KES 1,500 - 3,000", "More than KES 3,000"]),
    q("Who usually decides what you eat when you buy fast food?", ["I decide", "My family", "Friends", "The seller recommends"]),
    q("What matters most when you choose fast food?", ["Taste", "Price", "Speed", "Cleanliness", "Portion size"]),
    q("Do you ever regret eating fast food afterwards?", ["Often", "Sometimes", "Rarely", "Never"]),
    q("How do you feel about roadside food stalls?", ["I trust them completely", "Some I trust", "I prefer packaged food", "I avoid them"]),
    q("Would you buy a healthier fast food option if it cost a bit more?", ["Yes, regularly", "Sometimes", "No"]),
    q("How healthy do you consider fast food to be?", ["Very healthy", "Somewhat healthy", "Neutral", "Unhealthy", "Very unhealthy"]),
  ],

  "Healthy Eating Patterns": [
    q("How many portions of vegetables do you eat in a day?", ["None", "One", "Two or three", "Four or more"]),
    q("How often do you eat fruit?", ["Daily", "A few times a week", "Once or twice a month", "Rarely"]),
    q("How many days a week do you eat a balanced meal with vegetables?", ["Every day", "5 - 6 days", "3 - 4 days", "1 - 2 days", "Rarely"]),
    q("Do you eat breakfast as your main meal of the day?", ["Yes, usually", "No, I eat lunch", "It depends", "I skip meals"]),
    q("How much fried food do you eat in a week?", ["None", "Once", "2 - 3 times", "4 - 5 times", "Almost daily"]),
    q("How often do you eat food that is high in salt or fat?", ["Daily", "A few times a week", "Rarely", "Never"]),
    q("Do you read food labels when shopping?", ["Always", "Often", "Sometimes", "Never"]),
    q("How would you rate the healthiness of your current diet?", ["Very healthy", "Mostly healthy", "Mixed", "Mostly unhealthy", "Very unhealthy"]),
    q("What is the biggest obstacle to eating healthier?", ["Cost", "Availability", "Time", "Family or culture", "I do not know what is healthy"]),
    q("Would you pay more for healthier food if you could afford it?", ["Yes, always", "Sometimes", "No"]),
  ],

  "Restaurant Dining Experience": [
    q("How often do you eat at a restaurant?", ["Several times a month", "About once a month", "A few times a year", "Never"]),
    q("What type of restaurant do you visit most?", ["Fast food", "Local restaurant", "Hotel or buffet", "Coffee shop", "Street food stall"]),
    q("How much do you spend on a restaurant meal for yourself?", ["Under KES 300", "KES 300 - 700", "KES 700 - 1,500", "KES 1,500 - 3,000", "More than KES 3,000"]),
    q("Who pays when you eat out with friends?", ["I split my own", "I treat everyone", "We take turns", "It is always free for me"]),
    q("How do you rate the cleanliness of restaurants you visit?", ["Excellent", "Good", "Fair", "Poor", "Very poor"]),
    q("How important is a restaurant's ambience to you?", ["Very important", "Somewhat important", "Not important", "I only care about the food"]),
    q("Do you check reviews before trying a new place?", ["Always", "Often", "Sometimes", "Never"]),
    q("How long do you usually stay at a restaurant?", ["Under an hour", "1 - 2 hours", "2 - 4 hours", "Most of the day"]),
    q("Do you leave a tip?", ["Always", "When I can afford to", "Rarely", "Never"]),
    q("What would make you visit restaurants more often?", ["Lower prices", "Better service", "Cleaner venues", "More variety", "Nothing"]),
  ],

  "Cooking Habits & Skills": [
    q("How often do you cook at home?", ["Every day", "Most days", "A few times a week", "Once a week", "Never"]),
    q("What is the dish you cook most often?", ["Ugali", "Rice", "Chapati", "Beans and rice", "Stew", "I do not cook"]),
    q("Who does most of the cooking at home?", ["I do", "My spouse or partner", "Another family member", "A hired cook", "We buy ready food"]),
    q("How confident are you in your cooking skills?", ["Very confident", "Confident", "Learning still", "Not confident", "I cannot cook"]),
    q("How do you usually decide what to cook?", ["Whatever is in the cupboard", "A set meal plan", "A recipe I saw online", "Someone else decides"]),
    q("How much do you spend on groceries in a week?", ["Under KES 500", "KES 500 - 1,000", "KES 1,000 - 2,500", "KES 2,500 - 5,000", "More than KES 5,000"]),
    q("Do you use a recipe or a phone app to guide you?", ["Always", "Often", "Sometimes", "Never"]),
    q("How much time do you spend cooking on a typical day?", ["Under 30 minutes", "30 - 60 minutes", "1 - 2 hours", "More than 2 hours"]),
    q("Would you cook more if you had better equipment or a kitchen?", ["Definitely", "Yes", "Maybe", "No"]),
    q("What new dish would you like to learn to cook?", ["Chicken stew", "Pilau", "Samosas", "Fish tilapia", "Vegetarian meals", "I do not know"]),
  ],

  "Dietary Restrictions": [
    q("Do you have any dietary restriction?", ["No restrictions", "Vegetarian", "Vegan", "Gluten or wheat free", "Lactose intolerant", "Halal", "Other"]),
    q("How seriously do you take your restriction?", ["Strictly", "Mostly", "Only when convenient", "I am not strict"]),
    q("How often do you accidentally eat food you should avoid?", ["Never", "Rarely", "Sometimes", "Often"]),
    q("How easy is it to find suitable food where you live?", ["Very easy", "Fairly easy", "Difficult", "Very difficult", "I have not looked"]),
    q("Who cooks meals for you?", ["I cook", "Family cooks", "A hired cook", "I buy ready meals"]),
    q("Do you read ingredients labels?", ["Always", "Often", "Sometimes", "Never"]),
    q("How much extra do you spend because of your restriction?", ["Nothing", "Under KES 200", "KES 200 - 500", "More than KES 500 a week"]),
    q("Do restaurants cater for your restriction?", ["Most do", "Some do", "Very few do", "None that I know"]),
    q("Has your restriction improved your health?", ["Yes, significantly", "A little", "No change", "It has made things harder"]),
    q("Would you like to see more options for your restriction?", ["Definitely", "Yes", "Not particularly"]),
  ],

  "Snacking Patterns": [
    q("How often do you eat between meals?", ["Several times a day", "Once or twice a day", "Rarely", "Never"]),
    q("What do you usually snack on?", ["Fruits", "Samosas or chips", "Biscuits and cookies", "Nuts", "Sugary drinks", "I do not snack"]),
    q("At what time do you snack most?", ["Morning", "Mid-morning", "Afternoon", "Evening", "Late night"]),
    q("How much do you spend on snacks in a month?", ["Nothing", "Under KES 300", "KES 300 - 800", "KES 800 - 2,000", "More than KES 2,000"]),
    q("Do you snack because you are hungry or bored?", ["Mostly hunger", "Mostly boredom", "Both equally", "Other reasons"]),
    q("Where do you buy snacks most often?", ["Supermarket", "Roadside vendor", "Shop or kiosk", "At home only", "School or work"]),
    q("How healthy are the snacks you usually choose?", ["Very healthy", "Mostly healthy", "Mixed", "Mostly unhealthy", "Very unhealthy"]),
    q("Do you drink soft drinks or sweetened drinks?", ["Daily", "A few times a week", "Rarely", "Never"]),
    q("Would you eat healthier snacks if they were cheaper?", ["Yes, often", "Sometimes", "No"]),
    q("How do snacks affect your weight or health?", ["They have helped", "No effect", "They have caused problems", "I have not noticed"]),
  ],

  "Daily Water Intake": [
    q("How many glasses of water do you drink in a day?", ["Under 2", "2 - 4", "5 - 7", "More than 7"]),
    q("Do you drink water mostly before or after meals?", ["Before", "After", "With meals", "It varies"]),
    q("Where do you usually get your drinking water?", ["Tap at home", "Borehole", "Bottled water", "Fetched from a source", "Well"]),
    q("How much water do you drink during work or school hours?", ["A lot", "Some", "Very little", "I avoid drinking during the day"]),
    q("Do you carry a bottle or jerrycan of water with you?", ["Always", "Often", "Sometimes", "Never"]),
    q("Do you use water while cooking at home?", ["Every meal", "Most meals", "Rarely", "Never"]),
    q("Do you drink water when you are not thirsty?", ["Regularly", "Sometimes", "Rarely"]),
    q("Is clean drinking water easily available where you live?", ["Yes, easily", "It takes effort", "No, it is scarce", "No"]),
    q("How much do you spend on drinking water in a month?", ["Nothing", "Under KES 200", "KES 200 - 500", "KES 500 - 1,000", "More than KES 1,000"]),
    q("Would you drink more water if it were cheaper?", ["Yes, definitely", "Yes, a bit", "No"]),
  ],

  "Coffee & Tea Consumption": [
    q("How many cups of tea or coffee do you drink in a day?", ["None", "1 - 2", "3 - 4", "5 or more"]),
    q("Which do you drink most often?", ["Black tea", "Tea with milk", "Tea with sugar", "Coffee", "I drink both"]),
    q("Do you add sugar to your tea or coffee?", ["Always", "Usually", "Sometimes", "Never"]),
    q("Where do you usually buy your tea or coffee?", ["At home", "Roadside vendor", "Restaurant", "Office or school", "Supermarket"]),
    q("How much do you spend on tea or coffee in a week?", ["Under KES 50", "KES 50 - 150", "KES 150 - 300", "More than KES 300"]),
    q("At what time do you drink your first cup?", ["Early morning", "Mid-morning", "Afternoon", "Evening"]),
    q("Does caffeine affect your sleep?", ["Yes, strongly", "A little", "Not at all", "I do not drink caffeine"]),
    q("What kind of tea do you drink at home?", ["Rift Valley black", "Kenyan purple", "Spiced tea with masala", "Flavoured or herbal", "I do not drink tea at home"]),
    q("Do you drink tea or coffee during meals?", ["Often", "Sometimes", "Rarely", "Never"]),
    q("Would you pay more for higher quality tea or coffee?", ["Yes", "Only occasionally", "No", "Only if I could afford it"]),
  ],

  "Dining Out Preferences": [
    q("How often do you eat food prepared outside your home?", ["Several times a week", "About once a week", "A few times a month", "Rarely", "Never"]),
    q("What is your usual choice when you eat out?", ["Local dish", "Fast food", "Street food", "Restaurant meal", "I eat at home mostly"]),
    q("How much does a typical meal out cost you?", ["Under KES 200", "KES 200 - 500", "KES 500 - 1,000", "KES 1,000 - 2,500", "More than KES 2,500"]),
    q("Who do you usually eat out with?", ["Family", "Friends", "Alone", "Colleagues", "Partners"]),
    q("What matters most when you pick a place to eat?", ["Taste", "Price", "Cleanliness", "Speed", "Proximity"]),
    q("How do you find places to eat?", ["Recommendations", "Social media", "Walking past", "Location search", "I stick to known places"]),
    q("Do you prefer a place with a varied menu or a specialist place?", ["Varied menu", "Specialist", "Whatever is available"]),
    q("How do you feel about food hygiene at roadside places?", ["Good, I trust them", "Mixed", "I am careful about which ones", "I avoid them entirely"]),
    q("Would you dine out more if your income were higher?", ["Yes, much more", "A little", "No"]),
    q("What kind of dining out do you enjoy most?", ["Family meals out", "Eating with friends", "Treating myself", "Business meals", "I do not enjoy it"]),
  ],

  // ------------------------------------------------------------------
  // Football
  // ------------------------------------------------------------------
  "Premier League Fan Survey": [
    q("Do you follow the Premier League?", ["Every match", "Most weeks", "Occasionally", "Rarely", "Not at all"]),
    q("Which Premier League club do you support?", ["Manchester United", "Liverpool", "Arsenal", "Chelsea", "Manchester City", "Tottenham", "I do not follow a club"]),
    q("How do you watch Premier League matches?", ["TV", "Streaming app", "Highlights only", "Radio or commentary", "I do not watch"]),
    q("How long have you supported your club?", ["Less than a year", "1 - 5 years", "5 - 10 years", "More than 10 years", "Since I was a child"]),
    q("Who do you usually watch matches with?", ["Alone", "Friends", "Family", "At a viewing centre", "I do not watch"]),
    q("How much do you spend on football in a month?", ["Nothing", "Under KES 500", "KES 500 - 2,000", "KES 2,000 - 5,000", "More than KES 5,000"]),
    q("Do you follow any club outside the Premier League?", ["Yes, one or more", "No", "Only national league", "Only local club"]),
    q("What attracts you to the Premier League most?", ["Quality of football", "Star players", "Competition", "History and tradition", "Money in the league"]),
    q("How important is a club's history to you?", ["Very important", "Somewhat important", "Not important", "I prefer the current team"]),
    q("Would you watch more matches if broadcasts were cheaper?", ["Yes", "Maybe", "No"]),
  ],

  "Fan Engagement & Passion": [
    q("How would you describe your passion for football?", ["Very passionate", "Passionate", "Casual interest", "I only follow big events"]),
    q("What does being a fan mean to you?", ["Identity and pride", "Entertainment", "Social life", "Following family tradition", "Just interest in the game"]),
    q("How do you show your support for your team?", ["Wear colours", "Attend matches", "Follow news", "Play or organise games", "I follow quietly"]),
    q("How often do you check football news?", ["Several times a day", "Daily", "A few times a week", "Rarely"]),
    q("Which platform do you get your football news from?", ["TV", "Newspaper", "Social media", "Sports websites", "Friends"]),
    q("Has football ever caused an argument at home?", ["Yes, often", "Sometimes", "Once", "Never"]),
    q("Do you play football yourself?", ["Yes, regularly", "Occasionally", "I used to", "No"]),
    q("Which player do you admire most, past or present?", ["A current player", "A past player", "A local player", "A manager", "I am not sure"]),
    q("How much does football affect your other activities?", ["It dominates my free time", "It takes some time", "Only on match days", "Very little"]),
    q("Would you travel to watch a match live?", ["Yes, any distance", "Within my county", "Only nearby", "No"]),
  ],

  "Match Viewing Habits": [
    q("How often do you watch a full match?", ["Every week", "2 - 3 times a week", "Once a month", "Only big matches", "Never"]),
    q("How long are the matches you watch most often?", ["Full 90 minutes", "Second half only", "Highlights only", "Any length"]),
    q("Where do you usually watch?", ["At home", "At a bar or viewing centre", "At a friend's place", "On the phone", "At a stadium"]),
    q("Do you watch with the sound on?", ["Always", "Usually", "Only highlights", "Never"]),
    q("How do you get the broadcast?", ["Paid TV", "Free-to-air TV", "Streaming subscription", "Someone sends it to me", "Free streaming site"]),
    q("How much do you spend on football broadcasts in a month?", ["Nothing", "Under KES 300", "KES 300 - 700", "KES 700 - 1,500", "More than KES 1,500"]),
    q("What do you do during a match besides watch?", ["Nothing, I focus", "Use my phone", "Talk to others", "Do chores", "I leave the room"]),
    q("Which match types do you never miss?", ["Derby", "Cup finals", "European matches", "Matches involving my club", "None"]),
    q("How do you feel while watching a match?", ["Very excited", "Engaged", "Tense or nervous", "Relaxed"]),
    q("Do you watch live or replays?", ["Always live", "Live when I can", "Mostly replays", "Only highlights"]),
  ],

  "Fantasy Football Experience": [
    q("Do you play fantasy football?", ["Yes, every week", "Yes, occasionally", "I used to", "No"]),
    q("Which fantasy platform do you use?", ["Premier League fantasy", "Other leagues or games", "I do not use one"]),
    q("How do you pick your team each week?", ["Stats and research", "Following club news", "Gut feeling", "My friends' advice", "I copy others"]),
    q("How do you rank in your league?", ["Top of the table", "Upper half", "Lower half", "Bottom", "I do not track my rank"]),
    q("How much do you spend on fantasy football in a season?", ["Nothing", "Under KES 500", "KES 500 - 2,000", "More than KES 2,000"]),
    q("Do you manage more than one fantasy team?", ["Yes, several", "One", "No"]),
    q("Which position do you enjoy picking most?", ["Goalkeeper", "Defence", "Midfield", "Attack"]),
    q("Has fantasy football changed how you watch football?", ["Yes, completely", "A little", "No change", "I do not watch football"]),
    q("How much time do you spend on fantasy each week?", ["Under 30 minutes", "30 - 60 minutes", "1 - 2 hours", "More than 2 hours"]),
    q("Would you play if entry were completely free?", ["Yes, definitely", "Yes, a bit", "Probably not"]),
  ],

  "Football Memorabilia Collection": [
    q("Do you collect football merchandise?", ["Yes, a lot", "A few items", "Only the shirt", "No"]),
    q("What have you collected most?", ["Jerseys", "Scarves", "Caps", "Boots", "Programmes or stickers", "Nothing yet"]),
    q("How many shirts do you own?", ["None", "One", "Two to four", "Five or more"]),
    q("How much have you spent on football items in total?", ["Nothing", "Under KES 2,000", "KES 2,000 - 10,000", "KES 10,000 - 30,000", "More than KES 30,000"]),
    q("Where do you buy football items?", ["Official shops", "Online stores", "Roadside vendors", "From friends", "Second-hand markets"]),
    q("Why do you collect these items?", ["Love of the club", "Collecting habit", "Investment", "Gifts", "Nostalgia"]),
    q("Do you display your football items?", ["Proudly at home", "In a cupboard", "Mostly stored", "No"]),
    q("Which team or player has the best memorabilia?", ["A national team", "A local club", "A European club", "I have no favourites"]),
    q("Have you ever bought a fake or unofficial item?", ["Yes, knowingly", "Yes, unknowingly", "No"]),
    q("Would you buy a signed item if you could afford it?", ["Yes", "Only if very affordable", "No"]),
  ],

  "Game Day Experience": [
    q("Have you ever attended a match in a stadium?", ["Many times", "Once or twice", "Never"]),
    q("Which stadium do you visit or prefer?", ["Nyayo National Stadium", "Uhuru Park", "Moi International Sports Centre", "A local stadium", "I have not been"]),
    q("What do you take with you to a match?", ["Flag and colours", "Food and drinks", "Nothing", "Camera", "Money for transport"]),
    q("How do you travel to the stadium?", ["Walking", "Matatu", "Boda boda", "Car", "Cycle"]),
    q("How much do you spend on match day in total?", ["Nothing", "Under KES 500", "KES 500 - 1,500", "KES 1,500 - 3,000", "More than KES 3,000"]),
    q("How do you get your match ticket?", ["Online", "At the gate", "From a tout", "From a friend", "I have not been"]),
    q("How early do you arrive before a match?", ["Hours in advance", "An hour or two", "Just before kickoff", "After the match has started"]),
    q("How is the crowd where you watch?", ["Loud and organised", "Loud but chaotic", "Quiet", "I watch alone"]),
    q("Have you ever had problems at a stadium?", ["Yes, serious ones", "Minor ones", "No", "I have not been"]),
    q("Would you go to more matches if transport were easier?", ["Definitely", "Yes", "No"]),
  ],

  "Youth Football Participation": [
    q("Have you played organised football as a child?", ["Yes, for years", "Yes, briefly", "No"]),
    q("Which position did you play?", ["Goalkeeper", "Defender", "Midfielder", "Forward", "Several positions"]),
    q("Why did you stop playing if you did?", ["Work or school", "Lack of teams or coaches", "Injury", "Lost interest", "I did not stop"]),
    q("Are you involved in youth football now?", ["As a player", "As a coach", "As a parent", "I am not involved"]),
    q("How many youth teams are in your area?", ["Many", "A few", "One", "None that I know"]),
    q("What stops children from playing football in your area?", ["No teams", "Cost", "Safety", "Lack of time", "Parents prefer other activities", "Nothing"]),
    q("Would you pay for your child to join a football team?", ["Yes, gladly", "Yes, if affordable", "Only for tournaments", "No"]),
    q("How much can a family afford per month for youth sport?", ["Nothing", "Under KES 500", "KES 500 - 1,500", "KES 1,500 - 3,000", "More than KES 3,000"]),
    q("Which age group needs more support locally?", ["Under 10", "Under 14", "Under 18", "All ages equally"]),
    q("Are girls' football teams available where you live?", ["Yes, several", "A few", "Only boys' teams", "No girls' football at all"]),
  ],

  "Women's Football Interest": [
    q("Do you follow women's football?", ["Regularly", "Occasionally", "I am aware of it", "Not at all"]),
    q("Where do you usually watch or read about it?", ["TV", "Streaming", "Social media", "Newspapers", "I do not follow it"]),
    q("Do you think women's football is improving in Kenya?", ["Yes, quickly", "Yes, slowly", "Staying the same", "It is getting worse"]),
    q("What stops people from following women's football?", ["Lack of broadcasts", "Not knowing it exists", "Perception it is not a serious sport", "Cost", "Nothing"]),
    q("Have you attended a women's match?", ["Yes, recently", "Yes, long ago", "No"]),
    q("Would you watch women's football if it were shown more?", ["Yes, regularly", "Occasionally", "No"]),
    q("Which women's competitions do you know of?", ["Football Kenya Cup", "Women's Champions League", "International tournaments", "None"]),
    q("Do you support women's football on social media?", ["Often", "Sometimes", "Never"]),
    q("Should women and men be paid equally in football?", ["Definitely", "I think so but not yet", "No", "I am not sure"]),
    q("Who should invest most in growing women's football?", ["Football federations", "Clubs", "Media companies", "Government", "Sponsors"]),
  ],

  "Football Streaming Habits": [
    q("How do you watch football on a streaming service?", ["Paid subscription", "Free trial", "Free streaming sites", "Someone shares a link", "I do not stream"]),
    q("Which streaming platform do you use?", ["Showmax", "Netflix", "YouTube", "A free site", "I do not stream"]),
    q("How much do you pay for streaming in a month?", ["Nothing", "Under KES 300", "KES 300 - 700", "KES 700 - 1,500", "More than KES 1,500"]),
    q("How good is your internet for streaming video?", ["Excellent", "Good", "Struggles with buffering", "Very poor", "I have no internet"]),
    q("Which device do you watch football on most?", ["Phone", "Laptop", "Television", "Tablet", "Shared device"]),
    q("Do you stream live matches or watch replays?", ["Always live", "Live when possible", "Only replays", "Only highlights"]),
    q("How much data does watching football use?", ["A lot, I have struggled", "A moderate amount", "I do not track it", "I have unlimited data"]),
    q("Have you ever missed a match because of poor internet?", ["Often", "Sometimes", "Once", "Never"]),
    q("Would you pay more for full match coverage?", ["Yes", "Only if it included everything", "No"]),
    q("How do you hear about fixtures and kickoff times?", ["Social media", "TV", "A club's app", "Friends", "News sites"]),
  ],

  "Stadium Visit Experience": [
    q("How many times have you been to a football stadium in your life?", ["Once", "A few times", "Many times", "Never"]),
    q("Which stadium have you been to?", ["Nyayo National Stadium", "Uhuru Park", "Moi International Sports Centre", "A county or local stadium", "I have not been"]),
    q("What did you enjoy most about the experience?", ["The atmosphere", "Seeing live sport", "Meeting friends", "The food", "I did not enjoy it"]),
    q("How were the facilities where you went?", ["Very good", "Good", "Basic", "Poor", "I have not been"]),
    q("How easy is it to travel to a stadium from where you live?", ["Easy", "Manageable", "Difficult", "Very difficult"]),
    q("How much would a return trip and entry cost you?", ["Under KES 500", "KES 500 - 1,000", "KES 1,000 - 2,500", "More than KES 2,500", "I could not afford it"]),
    q("Have you ever had trouble getting a ticket?", ["Yes, many times", "Yes, once", "No", "I have not been"]),
    q("How would you rate safety at the stadium?", ["Very safe", "Fairly safe", "Not very safe", "Unsafe", "I have not been"]),
    q("What would stop you going to a match?", ["Cost", "Distance", "Safety", "No team I support", "Nothing"]),
    q("Would you like stadium football to be more affordable?", ["Definitely", "Yes, a little", "No"]),
  ],

  // ------------------------------------------------------------------
  // Safaricom
  // ------------------------------------------------------------------
  "M-Pesa Usage Survey": [
    q("How long have you used M-Pesa?", ["Less than a year", "1 - 3 years", "3 - 7 years", "More than 7 years", "I do not use it"]),
    q("What do you mainly use M-Pesa for?", ["Sending money", "Buying goods", "Paying bills", "Airtime and data", "Saving and borrowing", "Several of these"]),
    q("How many transactions do you make in a week?", ["1 - 2", "3 - 5", "6 - 10", "More than 10"]),
    q("Do you have a dedicated M-Pesa shop near where you live?", ["Yes, within walking distance", "Yes, but far", "No", "I use an agent only"]),
    q("Which M-Pesa feature do you use most?", ["Send money", "Withdraw cash", "Buy goods", "Paybill", "M-PESA GO", "Lipa na M-PESA"]),
    q("How do you usually withdraw money?", ["At an agent", "ATM", "Till", "Mobile money to bank", "I do not withdraw"]),
    q("How do you feel about M-Pesa charges?", ["Very fair", "Fair", "Too high", "I avoid using it because of charges", "I have not noticed"]),
    q("Have you ever been overcharged at an agent?", ["Yes, more than once", "Once", "No", "I do not use agents"]),
    q("How often do you check your M-Pesa balance?", ["Every day", "A few times a week", "When I need to", "Rarely"]),
    q("Would you use M-Pesa more if fees were lower?", ["Yes", "Only for large amounts", "No, the charges are fine"]),
  ],

  "Network Quality & Coverage": [
    q("How good is your Safaricom network where you live?", ["Excellent", "Good", "Fair", "Poor", "Very poor"]),
    q("How often do you lose signal during a call?", ["Never", "Rarely", "Sometimes", "Often", "Constantly"]),
    q("Where do you lose signal most?", ["At home", "On the road", "At work", "In the market or shops", "I do not lose signal"]),
    q("How good is your mobile data connection for internet?", ["Excellent", "Good", "Slow sometimes", "Very slow", "Not usable"]),
    q("How often do you have no network at all?", ["Daily", "Several times a week", "Once or twice a month", "Rarely", "Never"]),
    q("Has your network quality changed this year?", ["Much better", "A little better", "No change", "Worse", "Much worse"]),
    q("Which problem bothers you most?", ["Calls dropping", "Slow internet", "No signal", "Poor coverage indoors", "Network congestion in busy areas"]),
    q("Do you have another network provider you can switch to?", ["Yes, and I compare", "Yes, but rarely", "No, I am Safaricom only", "No"]),
    q("How would you rate Safaricom coverage in your county?", ["Excellent", "Good", "Fair", "Poor", "Very poor"]),
    q("Would you pay more for better coverage?", ["Yes, gladly", "Only a little", "No"]),
  ],

  "Customer Service Experience": [
    q("How often do you contact Safaricom customer service?", ["Weekly", "Monthly", "A few times a year", "Rarely", "Never"]),
    q("How do you usually contact them?", ["Call centre", "USSD", "WhatsApp", "In a shop", "Social media", "Online"]),
    q("How long do you wait before reaching someone?", ["Under 5 minutes", "5 - 15 minutes", "15 - 30 minutes", "More than 30 minutes", "I could not reach anyone"]),
    q("How satisfied are you with the service you received?", ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very dissatisfied"]),
    q("Was your issue resolved on the first contact?", ["Yes, fully", "Yes, partly", "No", "I gave up"]),
    q("How well do staff treat you on the phone?", ["Very well", "Well", "Poorly", "Very poorly"]),
    q("Would you use the self-service options instead of calling?", ["Yes, they work well", "If they were simpler", "No", "I have not tried"]),
    q("How easy is it to reach a human agent?", ["Very easy", "Easy", "Difficult", "Very difficult"]),
    q("Which service do you need most help with?", ["M-Pesa", "Data and airtime", "Network issues", "Bill payments", "Account and SIM", "Other"]),
    q("What would improve customer service for you?", ["Faster waiting", "Better trained staff", "Clearer information", "A callback option", "Physical shops"]),
  ],

  "Safaricom App Usage": [
    q("Do you use the MySafaricom app?", ["Every day", "A few times a week", "Rarely", "I have it but never use it", "I do not have it"]),
    q("What do you use the app for most?", ["Checking balance", "Buying bundles", "Paying bills", "Data usage", "Airtime top-up", "Customer support"]),
    q("How easy is the app to use?", ["Very easy", "Easy", "Somewhat difficult", "Very difficult", "I cannot use it"]),
    q("Does the app work well on your phone?", ["Always", "Usually", "It often crashes", "It rarely works", "I do not have internet"]),
    q("Which app version do you use?", ["Latest version", "An older one I did not update", "I do not know"]),
    q("Have you ever failed to complete a transaction in the app?", ["Yes, often", "Yes, once or twice", "No"]),
    q("How do you prefer to buy bundles?", ["USSD", "The app", "At a shop", "Online banking", "By SMS"]),
    q("Would you use the app more if it were smaller in size?", ["Yes", "No, it is fine", "I do not know"]),
    q("What feature do you wish the app had?", ["Lower data use", "Better notifications", "Simpler menus", "Works without internet", "More languages"]),
    q("How would you rate the MySafaricom app overall?", ["Excellent", "Good", "Fair", "Poor", "Very poor"]),
  ],

  "Data Bundle Preferences": [
    q("How much data do you use in a month?", ["Under 1 GB", "1 - 3 GB", "3 - 6 GB", "6 - 10 GB", "More than 10 GB"]),
    q("How much do you spend on data in a month?", ["Under KES 500", "KES 500 - 1,500", "KES 1,500 - 3,000", "KES 3,000 - 5,000", "More than KES 5,000"]),
    q("Which data bundle do you buy most often?", ["Daily bundle", "Weekly bundle", "Monthly bundle", "Unlimited at night", "I use Wi-Fi instead"]),
    q("Which times do you use data most?", ["Early morning", "Working hours", "Evening", "Late night", "It is even"]),
    q("Do you bundle data or buy it as you go?", ["Bundle", "Pay per megabyte", "Pay per call or SMS", "My plan includes data"]),
    q("Do you buy an unlimited night bundle?", ["Yes, every month", "Sometimes", "No"]),
    q("How do you usually top up data?", ["M-Pesa", "Bank transfer", "USSD", "The app", "Airtime scratch card"]),
    q("Do you run out of data before it expires?", ["Often", "Sometimes", "Rarely", "Never"]),
    q("What would you like your provider to improve most?", ["Better coverage", "More data for less", "Longer validity", "Fewer expiry days", "Easier bundles"]),
    q("Would you pay more for data that never expires?", ["Yes", "Only a little", "No"]),
  ],

  "Roaming Services Survey": [
    q("Have you ever used your Kenyan SIM outside Kenya?", ["Yes, often", "Yes, once or twice", "No", "I do not travel abroad"]),
    q("How much do you usually spend on roaming per trip?", ["Nothing", "Under KES 1,000", "KES 1,000 - 5,000", "KES 5,000 - 15,000", "More than KES 15,000"]),
    q("Was roaming expensive compared to local prices?", ["Yes, far more expensive", "A bit more", "About the same", "It was cheaper"]),
    q("How did you manage data while abroad?", ["Bought a local SIM", "Used roaming", "Used Wi-Fi", "Bought a travel bundle", "Did not need data"]),
    q("Which countries do you travel to most?", ["Neighbouring countries", "East Africa", "Europe", "North America", "Asia", "I do not travel"]),
    q("How clear were Safaricom roaming charges before you travelled?", ["Very clear", "Fairly clear", "Confusing", "I only found out after"]),
    q("How well did Safaricom roaming work where you were?", ["Excellent", "Good", "Patchy", "It did not work", "I did not use it"]),
    q("Which roaming service do you value most?", ["International calls", "Data", "Receiving calls", "SMS", "None"]),
    q("Would you travel more if roaming were cheaper?", ["Yes, definitely", "A little", "No"]),
    q("Have you ever been surprised by a roaming bill?", ["Yes, badly", "Slightly", "No", "I have not travelled"]),
  ],

  "Bill Payments via Mobile": [
    q("Which bills do you pay on your phone?", ["Water", "Electricity", "TV", "Internet", "School fees", "Several of these", "None"]),
    q("How do you pay your bills?", ["M-Pesa paybill", "USSD", "The Safaricom app", "At a shop", "Bank transfer", "Cash"]),
    q("How much do you spend on bills in a month?", ["Under KES 500", "KES 500 - 2,000", "KES 2,000 - 5,000", "KES 5,000 - 10,000", "More than KES 10,000"]),
    q("Do you ever forget to pay a bill?", ["Often", "Sometimes", "Rarely", "Never"]),
    q("Do you receive a confirmation after paying?", ["Always", "Usually", "Sometimes", "No"]),
    q("How long does a bill payment take to reflect?", ["Immediately", "Within an hour", "Same day", "A day or more", "I have never checked"]),
    q("Would an automatic bill payment help you?", ["Yes, very much", "Yes, a little", "No", "I prefer to pay manually"]),
    q("How do you track what you owe?", ["I remember", "A note or paper", "The app", "A family member handles it", "I do not track it"]),
    q("Have you ever paid a bill twice by accident?", ["Yes", "No", "I was told I had"]),
    q("Which bill would you most like to pay with one button?", ["Water", "Electricity", "TV and internet", "School fees", "All of them"]),
  ],

  "Till Number Usage": [
    q("Have you used a Safaricom till?", ["Yes, often", "Yes, a few times", "Once", "Never", "I do not know what a till is"]),
    q("What do you use tills for most?", ["Cash deposits", "Cash withdrawals", "M-Pesa transactions", "Paying bills", "Airtime and data"]),
    q("How far is the nearest till from where you are?", ["Walking distance", "Under 1 km", "1 - 5 km", "More than 5 km", "I do not know"]),
    q("How quick are the tills when it is busy?", ["Very quick", "Fairly quick", "Slow", "Very slow", "I have not used one"]),
    q("How much do you withdraw from tills in a month?", ["Nothing", "Under KES 5,000", "KES 5,000 - 20,000", "KES 20,000 - 50,000", "More than KES 50,000"]),
    q("Why do you choose tills over agents?", ["Better rates", "Longer hours", "Shorter queues", "Faster service", "I do not use tills"]),
    q("Do tills run out of cash often?", ["Often", "Sometimes", "Rarely", "Never", "I have not used one"]),
    q("How secure do you feel using a till?", ["Very secure", "Fairly secure", "Not very secure", "Not secure at all", "I have not used one"]),
    q("Have you ever had a problem at a till?", ["Yes, a transaction failed", "Yes, I was charged wrongly", "No", "I have not used one"]),
    q("Would you use tills more if there were more of them?", ["Yes", "No", "I do not know"]),
  ],

  "M-Shwari & Savings": [
    q("Do you use M-Shwari?", ["Yes, actively", "Yes, but rarely", "I have used it before", "No"]),
    q("What do you mainly use it for?", ["Saving", "Borrowing", "Both", "Checking my balance", "I do not use it"]),
    q("How much do you usually save in a month?", ["Nothing", "Under KES 500", "KES 500 - 2,000", "KES 2,000 - 5,000", "More than KES 5,000"]),
    q("Have you ever borrowed from M-Shwari?", ["Yes, and repaid on time", "Yes, and repaid late", "Yes, and repaid partly", "No"]),
    q("How easy was it to get a loan?", ["Very easy", "Easy", "Difficult", "Very difficult"]),
    q("Do you save automatically or by choice?", ["Automatically", "By choice when I can", "I do not save"]),
    q("How easy is it to withdraw your savings?", ["Very easy", "Easy", "Difficult", "I have never tried"]),
    q("Has M-Shwari helped you in an emergency?", ["Yes, a lot", "A little", "Not at all", "I have not used it"]),
    q("What do you save for most?", ["School fees", "Bills and emergencies", "Business", "A large purchase", "I do not have a goal"]),
    q("Would you save more if the interest were higher?", ["Yes", "Only if I could afford it", "No"]),
  ],

  "Safaricom Boda Service": [
    q("Have you used the Safaricom Boda ride service?", ["Yes, often", "Yes, occasionally", "No", "I am not sure what it is"]),
    q("How often do you use it?", ["Daily", "A few times a week", "Once or twice a month", "Never"]),
    q("What do you mostly use it for?", ["Getting to work or school", "Business errands", "Sending goods", "Transporting passengers", "Personal trips"]),
    q("How easy is it to book a Safaricom Boda?", ["Very easy", "Easy", "Somewhat difficult", "Very difficult"]),
    q("How is the fare compared to a regular boda boda?", ["Cheaper", "About the same", "More expensive", "I have not compared"]),
    q("How long do you wait for a rider?", ["Under 3 minutes", "3 - 6 minutes", "6 - 10 minutes", "More than 10 minutes", "I do not use it"]),
    q("How safe do you feel using it?", ["Very safe", "Fairly safe", "Not very safe", "Not safe at all", "I do not use it"]),
    q("Do you ever carry goods with you?", ["Regularly", "Sometimes", "Rarely", "Never"]),
    q("What would improve the service most?", ["More riders", "Faster booking", "Lower fares", "Better phone network", "Cashless payment", "Nothing"]),
    q("Would you use it more often if it were cheaper?", ["Yes, much more", "A little", "No"]),
  ],

  // ------------------------------------------------------------------
  // Equity Bank
  // ------------------------------------------------------------------
  "Banking App Usage Survey": [
    q("Do you use the Equity Bank mobile app?", ["Every day", "A few times a week", "Rarely", "I have it but never use it", "I do not use it"]),
    q("How do you open the app most often?", ["Face ID or fingerprint", "PIN", "Password", "Biometrics on, PIN as backup"]),
    q("How quickly can you find a payee you have paid before?", ["Immediately", "A few seconds", "I scroll through a long list", "I cannot find them", "I do not use the app"]),
    q("Have you ever sent money to the wrong person or number?", ["Yes", "No", "I nearly did"]),
    q("Does the app show you spending by category?", ["Yes, clearly", "Yes, but it is confusing", "No", "I have not looked"]),
    q("How would you rate the app's speed?", ["Fast", "Acceptable", "Slow", "Very slow", "I do not use it"]),
    q("Which app feature do you use most often?", ["Balance enquiry", "Fund transfer", "Bill payment", "Loan repayment", "Airtime purchase"]),
    q("Have you had the app crash or freeze mid-transaction?", ["Yes, repeatedly", "Yes, once", "No"]),
    q("What would improve the app most?", ["Faster loading", "Clearer menus", "Lower data use", "Better security", "More languages", "Nothing"]),
    q("Do you feel your money is safe in the app?", ["Very safe", "Fairly safe", "Not very safe", "Not safe at all"]),
  ],

  "Account Types & Usage": [
    q("How many bank accounts do you currently hold?", ["None", "One", "Two", "Three or more"]),
    q("What type of account is your main one?", ["Current account", "Savings account", "Business account", "Student account", "Mobile money wallet"]),
    q("How often do you use your main account?", ["Daily", "A few times a week", "Once or twice a month", "Rarely"]),
    q("What do you use your main account for most?", ["Salary or income", "School fees", "Business", "Saving", "Day-to-day spending"]),
    q("Do you pay any monthly account fee?", ["Yes", "No", "I have not checked"]),
    q("How did you open your account?", ["At a branch", "Online", "Through an agent", "Through someone else", "I do not remember"]),
    q("How easy is it to check your balance without the app?", ["Very easy", "Easy", "Difficult", "I rely on the app"]),
    q("Would you switch bank if another offered better service?", ["Yes", "Maybe", "No, I am loyal", "I would switch for fees"]),
    q("Do you bank in more than one institution?", ["Yes, several", "Yes, one other", "No"]),
    q("What matters most when you choose a bank?", ["Low fees", "Proximity", "Mobile money integration", "Interest rates", "Customer service"]),
  ],

  "Loan Services Experience": [
    q("Have you ever taken a loan from Equity Bank?", ["Yes, and repaid in full", "Yes, and I am still repaying", "Yes, but it was difficult", "Never"]),
    q("What did you use the loan for?", ["Business", "School fees", "Medical or emergency", "Home improvement", "To buy goods", "I have not taken one"]),
    q("How long did the approval process take?", ["Same day", "1 - 3 days", "4 - 7 days", "More than a week", "It was not approved"]),
    q("How clear were the total fees and interest before you signed?", ["Very clear", "Fairly clear", "Confusing", "I did not read them"]),
    q("How would you rate the interest rate you were offered?", ["Good", "Fair", "High", "Too high", "I have not borrowed"]),
    q("Did anyone explain the repayment schedule to you?", ["Yes, clearly", "Yes, briefly", "No", "I did not ask"]),
    q("What would have made the loan experience better?", ["Lower interest", "Clearer terms", "Faster approval", "Less paperwork", "Better customer service"]),
    q("Would you borrow from Equity again?", ["Yes", "Maybe", "No", "I have not borrowed"]),
    q("How easy was it to ask for help when you struggled?", ["Very easy", "Easy", "Difficult", "I did not ask", "I have not borrowed"]),
    q("How did you hear about the loan?", ["Equity agent", "Branch", "App", "Friend or family", "Radio", "Social media"]),
  ],

  "Equity Agent Usage": [
    q("Do you use an Equity Bank agent?", ["Yes, regularly", "Yes, occasionally", "I have used one before", "No"]),
    q("What do you mainly do at an Equity agent?", ["Deposits and withdrawals", "Checking balance", "Buying airtime or data", "Bill payments", "Money transfers", "Loan queries"]),
    q("How far is the nearest Equity agent from you?", ["Walking distance", "Under 1 km", "1 - 5 km", "More than 5 km", "I do not know"]),
    q("How long do you usually spend at the agent?", ["Under 5 minutes", "5 - 10 minutes", "10 - 20 minutes", "More than 20 minutes", "I do not use agents"]),
    q("How are you treated by the agent staff?", ["Very well", "Well", "Poorly", "Very poorly"]),
    q("Do agents have better or worse rates than a branch?", ["Better", "The same", "Worse", "I have not compared"]),
    q("Does the agent have your card accepted for card payments?", ["Yes, always", "Sometimes", "No", "I do not know"]),
    q("How long do agents keep your transaction records?", ["Only briefly", "Long enough to explain charges", "They tell me nothing", "I have not used an agent"]),
    q("What would make agents better?", ["More agents", "Shorter queues", "Clearer charge receipts", "Cash availability", "Better opening hours"]),
    q("Would you use an agent instead of a branch if one opened closer to you?", ["Yes", "Only if it were cheaper", "No", "I prefer a branch"]),
  ],

  "Mobile Banking Habits": [
    q("How do you access your bank account most often?", ["Mobile app", "USSD", "Internet banking", "Branch", "Agent", "Phone call"]),
    q("How many banking transactions do you make in a week?", ["1 - 3", "4 - 7", "8 - 15", "More than 15"]),
    q("Which transactions do you do on your phone?", ["Checking balance", "Transfers", "Bill payments", "Airtime and data", "Loan repayment", "Standing orders"]),
    q("Do you use USSD codes for banking?", ["Yes, often", "Yes, sometimes", "No", "I do not know how"]),
    q("How do you receive an alert for a transaction?", ["SMS", "App notification", "Email", "I do not get alerts"]),
    q("Do you ever need airtime to make a mobile transaction?", ["Yes, always", "Sometimes", "No, I have bundles", "I have not done it"]),
    q("How quick do mobile transactions complete?", ["Immediately", "Within a minute", "Several minutes", "Sometimes fail", "I do not use them"]),
    q("Have you ever been locked out of mobile banking?", ["Yes, recently", "Yes, long ago", "No"]),
    q("Who taught you to use mobile banking?", ["The bank", "A friend or family member", "I learned it myself", "An agent", "Nobody taught me"]),
    q("Would you bank more if it required less airtime?", ["Yes", "Only slightly", "No"]),
  ],

  "Savings & Investment": [
    q("Do you save any money formally?", ["Yes, every month", "Yes, when I can", "Not yet", "No"]),
    q("Where do you keep your savings?", ["Bank account", "Mobile money", "SACCO", "At home", "I do not save"]),
    q("How much do you save in a normal month?", ["Nothing", "Under KES 1,000", "KES 1,000 - 5,000", "KES 5,000 - 20,000", "More than KES 20,000"]),
    q("What interest do you earn on your savings?", ["Good rate", "Average rate", "Low rate", "None", "I do not know"]),
    q("Why do you save?", ["Emergencies", "School fees", "A large purchase", "Retirement", "No income to spare"]),
    q("Have you invested in anything beyond savings?", ["Yes, shares or bonds", "Yes, a business", "SACCO shares", "Property", "No", "I would like to"]),
    q("What stops you saving or investing more?", ["No spare income", "Unclear options", "Fees or charges", "Distrust", "I spend it instead"]),
    q("Has inflation affected your savings?", ["Yes, significantly", "A little", "Not yet", "I do not know what inflation is"]),
    q("Who do you trust with your savings?", ["Banks", "SACCOs", "Mobile money", "Shylocks", "No one"]),
    q("Would you invest if you understood the options?", ["Definitely", "Probably", "No"]),
  ],

  "Insurance Products Interest": [
    q("Do you have any insurance?", ["Yes, health", "Yes, car", "Yes, multiple types", "Yes, life", "No"]),
    q("Who do you pay your premiums to?", ["Insurance company", "Broker", "Agent", "Bank or SACCO", "I do not pay premiums"]),
    q("How much do you pay in premiums in a year?", ["Nothing", "Under KES 10,000", "KES 10,000 - 30,000", "KES 30,000 - 100,000", "More than KES 100,000"]),
    q("Why did you take insurance?", ["It was required", "To protect my family", "For the car or business", "My employer required it", "To be safe", "I do not know"]),
    q("Which cover would you buy first if you had money?", ["Health", "Car", "Life", "Home", "Business", "Education"]),
    q("How would you pay a premium of KES 5,000 in one go?", ["Comfortable", "Possible but difficult", "Very difficult", "Not at all possible"]),
    q("Have you ever claimed on a policy?", ["Yes, successfully", "Yes, with difficulty", "No", "My claim was rejected"]),
    q("What stops most people in Kenya from insuring?", ["Cost", "Not knowing the products", "Distrust", "No income", "Thinking it is for rich people"]),
    q("Have you heard of micro-insurance or affordable cover?", ["Yes, and I use it", "Yes, but never used it", "No"]),
    q("Would you buy a low-cost policy you could afford monthly?", ["Yes, immediately", "Maybe", "No"]),
  ],

  "Remittance Services": [
    q("Has anyone ever sent you money from outside Kenya?", ["Yes, often", "Yes, once or twice", "No"]),
    q("How did you receive it?", ["Mobile money", "Bank account", "Cash in person", "Cheque", "I have not received any"]),
    q("From which country do most of your remittances come?", ["Uganda", "Tanzania", "Somalia", "UK", "US", "South Africa", "No remittances"]),
    q("How long does it take to receive the money?", ["Under an hour", "Same day", "1 - 3 days", "More than 3 days", "I have not received any"]),
    q("How much do you usually receive?", ["Under KES 10,000", "KES 10,000 - 50,000", "KES 50,000 - 150,000", "More than KES 150,000", "I have not received any"]),
    q("How much do you charge or are charged in fees?", ["I do not know", "Nothing", "Under KES 200", "KES 200 - 1,000", "More than KES 1,000"]),
    q("Have you ever lost money because of a fake remittance offer?", ["Yes", "A friend has", "No"]),
    q("What do you do with the money you receive?", ["School fees", "Food and bills", "Business", "Household and family", "Saving"]),
    q("How do you receive news about money being sent to you?", ["SMS alert", "The sender tells me", "I check my balance", "A family member tells me", "I do not receive any"]),
    q("Which remittance service do you use most?", ["Mobile money", "Bank transfer", "Money transfer company", "Relatives in person", "I have not received any"]),
  ],

  "Equity Card Survey": [
    q("Do you have an Equity credit or debit card?", ["Yes, credit card", "Yes, debit card", "Yes, both", "No"]),
    q("How often do you use your card?", ["Daily", "A few times a week", "Once or twice a month", "Rarely", "I do not have one"]),
    q("Where do you use your card most?", ["Supermarkets", "Fuel stations", "Online shopping", "Restaurants", "School fees", "I do not have one"]),
    q("Is your card accepted everywhere you shop?", ["Always", "Usually", "Often declined", "Rarely", "I do not have one"]),
    q("How do you pay your card bill?", ["Full amount every month", "A fixed percentage", "Minimum payment only", "I pay late", "I do not have a card"]),
    q("Do you pay extra to clear your card early?", ["Yes, every month", "Sometimes", "No", "I do not have a card"]),
    q("Do you know your credit limit?", ["Yes, exactly", "Roughly", "No", "I do not have a card"]),
    q("Has your card been declined at a point of sale?", ["Often", "Sometimes", "Once", "Never", "I do not have a card"]),
    q("How easy is it to check your card balance?", ["Very easy", "Easy", "Difficult", "I do not have a card"]),
    q("What benefit matters most from your card?", ["Cashback", "Lower fees", "Travel rewards", "No interest on purchases", "Airport lounge", "I do not have a card"]),
  ],

  "Branch Visit Experience": [
    q("How often do you visit a bank branch?", ["Weekly", "Monthly", "A few times a year", "Rarely", "Never"]),
    q("What do you usually go to a branch for?", ["Depositing cash", "Withdrawing cash", "Cash transactions", "Getting help", "Opening an account", "I use agents instead"]),
    q("How long do you wait at the branch?", ["Under 15 minutes", "15 - 30 minutes", "30 - 60 minutes", "Over an hour", "I do not visit"]),
    q("Are the staff helpful?", ["Very helpful", "Helpful", "Neutral", "Unhelpful", "I do not visit"]),
    q("How would you rate your branch overall?", ["Excellent", "Good", "Fair", "Poor", "Very poor", "I do not visit"]),
    q("How far is your nearest branch?", ["Walking distance", "Under 1 km", "1 - 5 km", "More than 5 km", "I use agents"]),
    q("How clean and organised is your branch?", ["Very clean", "Clean", "Average", "Poor", "Very poor", "I do not visit"]),
    q("Would you rather visit a branch or use your phone?", ["Phone, always", "Phone mostly", "Branch mostly", "Both equally"]),
    q("What would make you visit less often?", ["A working app", "More agents", "Lower fees", "Longer opening hours", "Better ATMs", "Nothing"]),
    q("Have you ever had a problem the branch did not resolve?", ["Yes, once", "Yes, several times", "No"]),
  ],

  // ------------------------------------------------------------------
  // Communication
  // ------------------------------------------------------------------
  "WhatsApp Usage Patterns": [
    q("How often do you use WhatsApp?", ["Every day", "Most days", "A few times a week", "Rarely", "I do not use it"]),
    q("How long do you spend on WhatsApp in a day?", ["Under 1 hour", "1 - 3 hours", "3 - 6 hours", "More than 6 hours", "I do not use it"]),
    q("What do you use WhatsApp for most?", ["Chatting", "Voice and video calls", "Groups", "Sharing news", "Business or work", "Several of these"]),
    q("How many WhatsApp groups are you in?", ["None", "1 - 3", "4 - 10", "More than 10", "I do not use it"]),
    q("Do you mute notifications during the day?", ["Always", "Often", "Sometimes", "Never", "I do not use it"]),
    q("How much do you spend on WhatsApp data in a month?", ["Nothing", "Under KES 300", "KES 300 - 1,000", "KES 1,000 - 3,000", "More than KES 3,000"]),
    q("Who do you chat with most?", ["Family", "Friends", "Work or business", "Groups", "I do not use it"]),
    q("Do you use WhatsApp Status?", ["Often", "Sometimes", "Never", "I do not use it"]),
    q("Has WhatsApp replaced your other chat apps?", ["Yes, completely", "Mostly", "No", "I do not use it"]),
    q("Would you pay for extra features on WhatsApp?", ["Yes", "Only a little", "No", "I do not use it"]),
  ],

  "Voice & Video Call Habits": [
    q("How often do you make voice or video calls?", ["Daily", "A few times a week", "Once or twice a month", "Rarely", "Never"]),
    q("Which do you use most?", ["Regular calls", "WhatsApp calls", "Video calls", "Both voice and video", "I do not make calls"]),
    q("How long is your average call?", ["Under 2 minutes", "2 - 5 minutes", "5 - 15 minutes", "15 - 30 minutes", "Over 30 minutes", "I do not make calls"]),
    q("How clear is your voice during calls?", ["Very clear", "Clear", "Breaks up often", "Very poor", "I do not make calls"]),
    q("What is the biggest problem with your calls?", ["Poor network", "Background noise", "Battery", "No credit or data", "Nothing"]),
    q("Do you make video calls regularly?", ["Yes, weekly", "Yes, occasionally", "Never", "I do not do video calls"]),
    q("Who do you call most often?", ["Family", "Friends", "Work or business", "Customer service", "I do not make calls"]),
    q("How much do you spend on calls in a month?", ["Nothing", "Under KES 100", "KES 100 - 300", "KES 300 - 700", "More than KES 700", "I do not make calls"]),
    q("Do you call while walking or travelling?", ["Often", "Sometimes", "Never", "I do not make calls"]),
    q("Would better network coverage change how often you call?", ["Yes", "No, I would call the same", "I do not make calls"]),
  ],

  "Social Media Platforms": [
    q("Which platform do you use most?", ["Facebook", "TikTok", "Instagram", "X (Twitter)", "WhatsApp channels", "LinkedIn", "I do not use social media"]),
    q("How many hours a day do you spend on social media?", ["Under 1 hour", "1 - 3 hours", "3 - 5 hours", "More than 5 hours", "I do not use it"]),
    q("Why do you use social media?", ["Entertainment", "Keeping in touch", "News and information", "Business or work", "Learning", "Several of these"]),
    q("Which platform are you most influenced by?", ["Facebook", "TikTok", "Instagram", "X (Twitter)", "WhatsApp channels", "I am not influenced by any"]),
    q("How much do you pay for data to use these platforms?", ["Nothing", "Under KES 300", "KES 300 - 800", "KES 800 - 2,000", "More than KES 2,000", "I do not use it"]),
    q("Have you ever posted something you regretted?", ["Often", "Once or twice", "Never", "I do not post"]),
    q("Do you follow or interact with people you do not know offline?", ["Often", "Sometimes", "Rarely", "Never", "I do not use it"]),
    q("How much of what you see online do you believe?", ["Almost all", "Some of it", "Very little", "None", "I do not use it"]),
    q("Would you delete a social media account?", ["Yes, gladly", "Maybe", "No", "I do not have one"]),
    q("Do you know how to adjust your privacy settings?", ["Yes, fully", "Partly", "No", "I do not use social media"]),
  ],

  "Email Communication": [
    q("Do you have an email address you use regularly?", ["Yes, several", "Yes, one", "Rarely", "No"]),
    q("What do you use email for most?", ["Work", "Personal communication", "Applying for jobs", "Newsletters", "School", "I do not use email"]),
    q("How many emails do you receive in a day?", ["Under 10", "10 - 30", "30 - 100", "More than 100", "I do not use email"]),
    q("How many do you reply to?", ["Most of them", "About half", "Few", "None", "I do not use email"]),
    q("Do you check email on your phone?", ["Yes, constantly", "A few times a day", "Only on a computer", "Rarely", "I do not use email"]),
    q("How long does it take you to write a reply?", ["Under 5 minutes", "5 - 30 minutes", "30 minutes to 2 hours", "I leave it for days", "I do not use email"]),
    q("Do you ever use email for job applications?", ["Often", "Sometimes", "Never"]),
    q("How many email addresses do you have?", ["One", "Two", "Three or more", "None", "I do not remember"]),
    q("Is your email secure with a strong password?", ["Yes", "No", "I do not know"]),
    q("Would you prefer to communicate by email or phone?", ["Email", "Phone", "Whichever is faster", "Messaging apps"]),
  ],

  "Messaging App Preferences": [
    q("Which messaging app do you use most?", ["WhatsApp", "Facebook Messenger", "Telegram", "SMS", "WeChat", "I do not use messaging apps"]),
    q("How many messaging apps do you have installed?", ["One", "Two", "Three", "Four or more", "None"]),
    q("Why do you use more than one app?", ["Different groups use different apps", "I want to separate work and family", "One app has better features", "I did not choose", "I use only one"]),
    q("How often do you use SMS?", ["Daily", "A few times a week", "Once or twice a month", "Rarely", "Never"]),
    q("What do you use SMS for most?", ["Person to person", "Marketing messages", "OTPs and alerts", "Airtime", "I do not use SMS"]),
    q("How much do you spend on SMS in a month?", ["Nothing", "Under KES 100", "KES 100 - 300", "KES 300 - 700", "More than KES 700", "I do not use SMS"]),
    q("Do you prefer messages you can send without credit?", ["Yes", "No", "It does not matter"]),
    q("How do you feel about marketing messages you did not ask for?", ["Very annoyed", "Annoyed", "I ignore them", "I find them useful", "I do not receive them"]),
    q("Have you ever been scammed through a messaging app?", ["Yes", "Someone I know has", "No", "I do not know anyone"]),
    q("Which app would you most want to delete?", ["WhatsApp", "Facebook Messenger", "Telegram", "SMS", "None of them"]),
  ],

  "Video Streaming Habits": [
    q("Which streaming service do you use most?", ["Showmax", "Netflix", "YouTube", "Amlash", "Prime Video", "I do not stream", "Another service"]),
    q("What does your streaming subscription give you that free video does not?", ["More content", "Better quality", "Fewer ads", "Offline downloads", "Nothing, I would not pay", "I do not stream"]),
    q("What do you watch most?", ["Movies", "Series", "News", "Documentaries", "Music videos", "Sports", "I do not stream"]),
    q("What device do you watch on most?", ["Phone", "Laptop", "Television", "Tablet", "I do not stream"]),
    q("How often do you watch?", ["Daily", "A few times a week", "Once or twice a month", "Rarely", "Never"]),
    q("How much data does streaming use for you?", ["A lot, I often run out", "A moderate amount", "I have unlimited data", "I do not know", "I do not stream"]),
    q("Do you watch with subtitles?", ["Always", "When needed", "Never", "I do not stream"]),
    q("Have you ever shared a streaming account?", ["Yes", "No", "I do not stream"]),
    q("How good is your internet for streaming?", ["Excellent", "Good", "It buffers often", "Very poor", "I do not stream"]),
    q("Would you stream more if data were cheaper?", ["Yes", "A little", "No"]),
  ],

  "SMS Usage Trends": [
    q("How many SMS do you send in a month?", ["None", "Under 20", "20 - 50", "51 - 100", "More than 100"]),
    q("Who do you text most?", ["Family", "Friends", "Work or business", "Services and banks", "Groups", "I do not text"]),
    q("Have you stopped texting in favour of messaging apps?", ["Yes, completely", "Partly", "No", "I use both equally"]),
    q("How many SMS do you receive in a day?", ["None", "1 - 3", "4 - 10", "More than 10"]),
    q("Which type of SMS do you reply to most?", ["Person to person", "Business and services", "Banks and OTPs", "Marketing messages", "I reply to none"]),
    q("How often do you receive marketing SMS?", ["Daily", "A few times a week", "Rarely", "Never", "I do not get them"]),
    q("Have you ever been annoyed by SMS charges you did not expect?", ["Yes", "No", "I do not text"]),
    q("Which type of SMS do you find most useful?", ["Bank alerts", "Transport updates", "Work messages", "Family messages", "Marketing offers", "None"]),
    q("Has SMS become less useful to you?", ["Yes, much less", "A little less", "No change", "More useful"]),
    q("Would you like a way to block unwanted SMS?", ["Yes, definitely", "Maybe", "No"]),
  ],

  "Phone Call Duration": [
    q("How many phone calls do you make in a day?", ["None", "1 - 3", "4 - 7", "8 - 15", "More than 15"]),
    q("What is the usual reason you call?", ["Speaking to family", "Business or work", "Customer service", "Arranging something", "Emergency", "I do not make calls"]),
    q("Do you make more calls to mobile or landline numbers?", ["All mobile", "Mostly mobile", "Mostly landline", "A mix", "I do not make calls"]),
    q("Which time of day do you make most calls?", ["Morning", "Midday", "Afternoon", "Evening", "It varies", "I do not make calls"]),
    q("How clear is your voice during a call?", ["Very clear", "Clear", "It breaks up", "Very poor", "I do not make calls"]),
    q("Do you call or text more?", ["Much more calling", "Slightly more calling", "About equal", "I text more", "I do not make calls"]),
    q("Do you make business or work calls?", ["Yes, regularly", "Yes, occasionally", "No", "I do not make calls"]),
    q("Have you missed a call you wanted to return?", ["Often", "Sometimes", "Rarely", "Never", "I do not make calls"]),
    q("Would cheaper call rates make you call more?", ["Yes", "Only a little", "No", "I do not make calls"]),
    q("Do you use a phone log or call history to check calls?", ["Regularly", "Sometimes", "Never", "I do not make calls"]),
  ],

  "Group Chat Participation": [
    q("How many group chats are you in?", ["None", "1 - 3", "4 - 10", "More than 10", "I do not use group chats"]),
    q("Which groups are you most active in?", ["Family", "Religious", "Work or business", "Neighbourhood", "School", "Fun or social", "I am in none"]),
    q("How many messages does a typical group send in a day?", ["Under 10", "10 - 50", "50 - 200", "More than 200", "I do not use group chats"]),
    q("Do you mute most groups?", ["Yes, all of them", "Yes, most", "A few", "No", "I do not use group chats"]),
    q("Have you ever left a group?", ["Yes, several", "Yes, once", "No", "I do not use group chats"]),
    q("How do groups help you most?", ["Getting information", "Family coordination", "Work or business", "Emergency help", "Socialising", "They do not help"]),
    q("Have you received anything useful from a group?", ["Often", "Sometimes", "Rarely", "Never", "I do not use group chats"]),
    q("How much do you contribute to the groups you are in?", ["A lot", "Moderately", "Rarely", "I only read", "I do not use group chats"]),
    q("Have you ever received scams or spam in a group?", ["Yes, often", "Once", "No", "I do not use group chats"]),
    q("Would you be in fewer groups if you could?", ["Definitely", "Yes", "No, they are useful"]),
  ],

  "Digital Communication": [
    q("How do you prefer to communicate important things?", ["In person", "Phone call", "WhatsApp or SMS", "Email", "Social media"]),
    q("How comfortable are you with video calls?", ["Very comfortable", "Comfortable", "Not comfortable", "Very uncomfortable", "I have never been on one"]),
    q("How many people can you message at once easily?", ["One", "Up to five", "Up to twenty", "A large group", "I do not message"]),
    q("Do you use any digital tools for your work or business?", ["Yes, several", "Yes, one", "No", "I do not work digitally"]),
    q("How reliable is your internet for communication?", ["Excellent", "Good", "It drops often", "Very unreliable", "I have no internet"]),
    q("Do you prefer messages you can reply to later?", ["Yes, definitely", "Yes, sometimes", "No, I want replies now"]),
    q("How much time do you spend on communication apps daily?", ["Under 1 hour", "1 - 3 hours", "3 - 6 hours", "More than 6 hours", "I do not use them"]),
    q("Have you had a misunderstanding because of a message?", ["Yes, often", "Yes, once", "No", "I do not use messages"]),
    q("Which communication method would you like to improve at most?", ["Texting", "Email", "Video calls", "Social media", "None", "I do not communicate digitally"]),
    q("Do you feel disconnected from people who do not use these apps?", ["Yes, strongly", "A little", "Not at all", "I do not use them"]),
  ],
};