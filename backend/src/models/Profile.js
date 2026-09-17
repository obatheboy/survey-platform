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
  { age: 24, location: "Nairobi, Kenya", description: "Loves exploring new cafes and trying different cuisines. I'm always up for a good conversation about life and dreams.", interests: ["Food", "Travel", "Photography"], personality: "friendly" },
  { age: 28, location: "Mombasa, Kenya", description: "Beach lover and marine biologist. I enjoy long walks by the ocean and deep conversations about the universe.", interests: ["Nature", "Science", "Swimming"], personality: "intellectual" },
  { age: 22, location: "Kisumu, Kenya", description: "University student studying business. I love music, fashion, and meeting new people. Always smiling!", interests: ["Music", "Fashion", "Dancing"], personality: "outgoing" },
  { age: 31, location: "Nakuru, Kenya", description: "Teacher by day, bookworm by night. I enjoy reading novels and discussing philosophy over coffee.", interests: ["Books", "Coffee", "Philosophy"], personality: "intellectual" },
  { age: 25, location: "Eldoret, Kenya", description: "Fitness enthusiast and nutrition student. I'm passionate about healthy living and helping others achieve their goals.", interests: ["Fitness", "Cooking", "Health"], personality: "friendly" },
  { age: 27, location: "Kisii, Kenya", description: "Creative graphic designer who loves art, music, and late-night conversations about everything and nothing.", interests: ["Art", "Design", "Music"], personality: "shy" },
  { age: 29, location: "Malindi, Kenya", description: "Adventure seeker and tour guide. I love the outdoors, safari tours, and sharing stories about wildlife.", interests: ["Travel", "Wildlife", "Adventure"], personality: "adventurous" },
  { age: 23, location: "Thika, Kenya", description: "Tech startup founder. Coffee addict and midnight coder. Let's talk about the future of tech in Africa.", interests: ["Technology", "Startups", "Coffee"], personality: "intellectual" },
  { age: 26, location: "Machakos, Kenya", description: "Nurse at the local hospital. Compassionate and caring. I love helping people and enjoy quiet evenings.", interests: ["Healthcare", "Reading", "Volunteer work"], personality: "friendly" },
  { age: 30, location: "Kakamega, Kenya", description: "Journalist and storyteller. I'm always chasing the next big story and love discussing current events.", interests: ["News", "Writing", "Current events"], personality: "outgoing" },
  { age: 24, location: "Embu, Kenya", description: "Agricultural researcher working on sustainable farming. Nature is my happy place. Let's chat about life.", interests: ["Farming", "Nature", "Sustainability"], personality: "friendly" },
  { age: 27, location: "Nyeri, Kenya", description: "Lawyer with a passion for justice. I enjoy debating and can discuss anything from law to the latest Netflix show.", interests: ["Law", "Debate", "Entertainment"], personality: "intellectual" },
  { age: 21, location: "Kericho, Kenya", description: "Tea farmer's daughter studying modeling. Love fashion, beauty, and all things glamorous. Always upbeat!", interests: ["Fashion", "Beauty", "Modeling"], personality: "outgoing" },
  { age: 32, location: "Garissa, Kenya", description: "Veterinary doctor. Animal lover and nature enthusiast. I'm passionate about wildlife conservation.", interests: ["Animals", "Conservation", "Travel"], personality: "adventurous" },
  { age: 25, location: "Wajir, Kenya", description: "Engineer working on infrastructure projects. I enjoy solving problems and discussing innovative solutions.", interests: ["Engineering", "Problem-solving", "Innovation"], personality: "intellectual" },
  { age: 28, location: "Lamu, Kenya", description: "Artist and painter. I find inspiration in the beauty of Swahili culture and the Indian Ocean.", interests: ["Art", "Culture", "Painting"], personality: "shy" },
  { age: 26, location: "Isiolo, Kenya", description: "Tourism coordinator. I love organizing safaris and sharing the beauty of Kenya with visitors.", interests: ["Tourism", "Hospitality", "Travel"], personality: "friendly" },
  { age: 30, location: "Marsabit, Kenya", description: "Diplomat and international relations expert. I enjoy discussing global politics and different cultures.", interests: ["Politics", "International relations", "Languages"], personality: "intellectual" },
  { age: 23, location: "Voi, Kenya", description: "Veterinary student with a passion for animals and country music. I'm easy-going and love to laugh.", interests: ["Animals", "Music", "Country music"], personality: "funny" },
  { age: 29, location: "Mombasa, Kenya", description: "Chef at a luxury hotel. I love cooking and experimenting with fusion recipes. Food is my love language.", interests: ["Cooking", "Food", "Fine dining"], personality: "romantic" }
];

const FIRST_NAMES = [
  "Sarah", "Amina", "Fatima", "Grace", "Mary", "Esther", "Ruth", "Naomi", "Leah", "Miriam",
  "Diana", "Jane", "Susan", "Cynthia", "Sharon", "Helen", "Rebecca", "Rachel", "Victoria", "Patricia",
  "Linda", "Barbara", "Susan", "Deborah", "Amy", "Angela", "Anna", "Betty", "Carol", "Debra",
  "Michelle", "Sandra", "Kimberly", "Emily", "Donna", "Kathleen", "Lisa", "Brenda", "Karen", "Nancy",
  "Ashley", "Emily", "Michelle", "Laura", "Sarah", "Amy", "Rachel", "Anna", "Melissa", "Tiffany"
];

const SECOND_NAMES = [
  "Wanjiru", "Omondi", "Kariuki", "Onyango", "Mwangi", "Kamau", "Ochieng", "Odhiambo", "Mutua", "Kiprop",
  "Njeru", "Katongo", "Adebayo", "Mensah", "Osei", "Boateng", "Asante", "Ofori", "Appiah", "Badu",
  "Chepkirui", "Kiprono", "Cheruiyot", "Tum", "Kipchoge", "Kiptoo", "Kosgei", "Jelangat", "Kemei", "Ruto",
  "Mugisha", "Mubiru", "Ssonko", "Kintu", "Nalwanga", "Kasekende", "Wasswa", "Muwanga", "Sserwadda", "Kato"
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
    const count = await ProfileModel.estimatedDocumentCount();
    if (count === 0) {
      const profiles = generateProfiles();
      await ProfileModel.insertMany(profiles);
      console.log(`✅ Seeded ${profiles.length} profiles`);
    } else {
      console.log(`ℹ️  Profiles already exist: ${count}`);
    }
  } catch (error) {
    console.error('❌ Error seeding profiles:', error.message);
  }
};

module.exports = {
  Profile: ProfileModel,
  generateProfiles,
  seedProfiles
};
