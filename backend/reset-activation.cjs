require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error("MONGODB_URI not in backend/.env"); process.exit(1); }
  mongoose.set("strictQuery", false);
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log("Connected to:", mongoose.connection.name);

  // Reset ONLY the stale flags back to false — keep plans_paid untouched
  const res = await mongoose.connection.db.collection("users").updateMany(
    {},
    {
      $set: {
        "plans.$[elem].is_activated": false,
        "plans.$[elem].activated_at": null,
      },
    },
    { arrayFilters: [{ "elem.is_activated": true }] }
  );

  console.log("Reset plans.is_activated results:", JSON.stringify(res.modifiedCount) + " users updated");

  // Also ensure top-level activation flags are false for everyone
  const reset = await mongoose.connection.db.collection("users").updateMany(
    {},
    {
      $set: {
        account_activated: false,
        all_plans_completed: false,
        is_activated: false,
      },
    }
  );
  console.log("Reset top-level flags:", JSON.stringify(reset.modifiedCount) + " users updated");

  await mongoose.disconnect();
  console.log("Done.");
})();
