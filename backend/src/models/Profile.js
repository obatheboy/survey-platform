const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  interests: [{
    type: String
  }],
  avatar: {
    type: String,
    default: ''
  },
  personality: {
    type: String,
    enum: ['friendly', 'shy', 'outgoing', 'intellectual', 'adventurous', 'romantic', 'funny'],
    default: 'friendly'
  },
  is_locked: {
    type: Boolean,
    default: true
  },
  unlock_price: {
    type: Number,
    default: 99
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const PROFILE_TEMPLATES = [
  { age: 24, location: "New York, USA", description: "Loves exploring new cafes and trying different cuisines. I'm always up for a good conversation about life and dreams.", interests: ["Food", "Travel", "Photography"], personality: "friendly" },
  { age: 28, location: "Los Angeles, USA", description: "Beach lover and marine biologist. I enjoy long walks by the ocean and deep conversations about the universe.", interests: ["Nature", "Science", "Swimming"], personality: "intellectual" },
  { age: 22, location: "Miami, USA", description: "University student studying business. I love music, fashion, and meeting new people. Always smiling!", interests: ["Music", "Fashion", "Dancing"], personality: "outgoing" },
  { age: 31, location: "London, UK", description: "Teacher by day, bookworm by night. I enjoy reading novels and discussing philosophy over coffee.", interests: ["Books", "Coffee", "Philosophy"], personality: "intellectual" },
  { age: 25, location: "Toronto, Canada", description: "Fitness enthusiast and nutrition student. I'm passionate about healthy living and helping others achieve their goals.", interests: ["Fitness", "Cooking", "Health"], personality: "friendly" },
  { age: 27, location: "Berlin, Germany", description: "Creative graphic designer who loves art, music, and late-night conversations about everything and nothing.", interests: ["Art", "Design", "Music"], personality: "shy" },
  { age: 29, location: "Sydney, Australia", description: "Adventure seeker and tour guide. I love the outdoors, hiking, and sharing stories about nature.", interests: ["Travel", "Hiking", "Adventure"], personality: "adventurous" },
  { age: 23, location: "San Francisco, USA", description: "Tech startup founder. Coffee addict and midnight coder. Let's talk about the future of tech.", interests: ["Technology", "Startups", "Coffee"], personality: "intellectual" },
  { age: 26, location: "Chicago, USA", description: "Nurse at the local hospital. Compassionate and caring. I love helping people and enjoy quiet evenings.", interests: ["Healthcare", "Reading", "Volunteer work"], personality: "friendly" },
  { age: 30, location: "Paris, France", description: "Journalist and storyteller. I'm always chasing the next big story and love discussing current events.", interests: ["News", "Writing", "Current events"], personality: "outgoing" },
  { age: 24, location: "Amsterdam, Netherlands", description: "Artist and painter. I find inspiration in the beauty of different cultures and the city life.", interests: ["Art", "Culture", "Painting"], personality: "shy" },
  { age: 27, location: "Dublin, Ireland", description: "Engineer working on infrastructure projects. I enjoy solving problems and discussing innovative solutions.", interests: ["Engineering", "Problem-solving", "Innovation"], personality: "intellectual" },
  { age: 21, location: "Stockholm, Sweden", description: "Student studying environmental science. Love nature, music, and exploring the city on weekends.", interests: ["Environment", "Music", "Fashion"], personality: "outgoing" },
  { age: 32, location: "Barcelona, Spain", description: "Chef at a luxury hotel. I love cooking and experimenting with fusion recipes. Food is my love language.", interests: ["Cooking", "Food", "Fine dining"], personality: "romantic" },
  { age: 25, location: "Seoul, South Korea", description: "Marketing professional who loves K-pop, good food, and late-night conversations.", interests: ["Marketing", "Music", "K-pop"], personality: "friendly" },
  { age: 26, location: "Singapore", description: "Finance professional who enjoys hiking, trying new restaurants, and deep philosophical talks.", interests: ["Finance", "Travel", "Philosophy"], personality: "friendly" },
  { age: 30, location: "Tokyo, Japan", description: "English teacher and blogger. I love exploring Tokyo's cafes and discussing Japanese culture.", interests: ["Teaching", "Writing", "Culture"], personality: "intellectual" },
  { age: 23, location: "Madrid, Spain", description: "Football coach by day, music enthusiast by night. Always upbeat and love making people laugh.", interests: ["Sports", "Music", "Coaching"], personality: "funny" },
  { age: 29, location: "Rome, Italy", description: "Architect who loves good food, history, and planning my next travel adventure.", interests: ["Architecture", "History", "Travel"], personality: "romantic" },
  { age: 28, location: "Vancouver, Canada", description: "Software developer who enjoys hiking, indie films, and meaningful conversations.", interests: ["Coding", "Hiking", "Films"], personality: "intellectual" }
];

const FIRST_NAMES = [
  "Emma", "Liam", "Olivia", "Noah", "Ava", "William", "Sophia", "James", "Isabella", "Oliver",
  "Charlotte", "Elijah", "Amelia", "Lucas", "Mia", "Mason", "Evelyn", "Logan", "Harper", "Ethan",
  "Abigail", "Oliver", "Emily", "Alice", "Isla", "Mason", "Olivia", "Noah", "Ava", "Elijah",
  "Sophia", "James", "Isabella", "Liam", "Emma", "Oliver", "Charlotte", "Lucas", "Mia", "Ethan",
  "Amelia", "Mason", "Harper", "Noah", "Ava", "Elijah", "Sophia", "James", "Isabella", "Olivia",
  "William", "Sophia", "James", "Isabella", "Mia", "Charlotte", "Elijah", "Oliver", "Ava", "Lucas",
  "Emma", "Noah", "Olivia", "James", "Ava", "Lucas", "Mia", "Ethan", "Amelia", "Mason",
  "Harper", "Logan", "Evelyn", "Abigail", "Sophia", "Alice", "Isla", "Mason", "Olivia", "James",
  "Emma", "Noah", "Olivia", "James", "Ava", "Lucas", "Mia", "Ethan", "Amelia", "Charlotte",
  "Harper", "Logan", "Evelyn", "Abigail", "Sophia", "Alice", "Isla", "Mason", "Olivia", "Noah"
];

const SECOND_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
  "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes",
  "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper",
  "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward", "Richardson",
  "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz", "Hernandez"
];

const generateProfiles = () => {
  const profiles = [];
  const totalProfiles = 200;

  for (let i = 0; i < totalProfiles; i++) {
    const template = PROFILE_TEMPLATES[i % PROFILE_TEMPLATES.length];
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const secondName = SECOND_NAMES[Math.floor(Math.random() * SECOND_NAMES.length)];
    const displayName = `${firstName} ${secondName}`;
    const age = template.age + (Math.floor(Math.random() * 6) - 3);

    profiles.push({
      name: displayName,
      age: Math.max(18, Math.min(35, age)),
      location: template.location,
      description: template.description,
      interests: template.interests,
      personality: template.personality,
      is_locked: true,
      unlock_price: 99,
      avatar: `https://i.pravatar.cc/150?img=${i + 1}`
    });
  }

  return profiles;
};

const ProfileModel = mongoose.model('Profile', profileSchema);

const seedProfiles = async () => {
  try {
    console.log('🔄 Clearing existing profiles...');
    await ProfileModel.deleteMany({});
    
    const profiles = generateProfiles();
    await ProfileModel.insertMany(profiles);
    console.log(`✅ Seeded ${profiles.length} profiles`);
  } catch (error) {
    console.error('❌ Error seeding profiles:', error.message);
  }
};

module.exports = {
  Profile: ProfileModel,
  generateProfiles,
  seedProfiles
};
