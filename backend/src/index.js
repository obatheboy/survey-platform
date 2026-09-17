const path = require("path");

// 🔐 Force dotenv to load backend/.env explicitly
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const app = require("./app");
const mongoose = require("./config/db");
const { seedProfiles } = require("./models/Profile");

app.get("/ping", (req, res) => {
  res.status(200).send("ok");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  setTimeout(async () => {
    const Profile = require("./models/Profile").Profile;
    await seedProfiles();
  }, 2000);
});
