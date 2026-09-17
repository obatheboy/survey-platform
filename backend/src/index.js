const path = require("path");

// 🔐 Force dotenv to load backend/.env explicitly
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const app = require("./app");
require("./config/db");
const mongoose = require("mongoose");

app.get("/ping", (req, res) => {
  res.status(200).send("ok");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  mongoose.connection.once("connected", async () => {
    console.log("MongoDB connected — seeding profiles...");
    const { seedProfiles } = require("./models/Profile");
    await seedProfiles();
  });
});
