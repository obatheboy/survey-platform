require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const { Profile, seedProfiles } = require("../src/models/Profile");
    await seedProfiles();

    const count = await Profile.estimatedDocumentCount();
    console.log(`Total profiles in DB: ${count}`);

    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
}

main();
