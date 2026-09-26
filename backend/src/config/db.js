require("dotenv").config();
const mongoose = require("mongoose");

// MongoDB Connection
const connectDB = async () => {
  try {
    console.log("🔌 Connecting to MongoDB Atlas...");
    
    // Check if MONGODB_URI is set
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not set in environment variables");
      console.error("💡 Add MONGODB_URI to your Render environment variables");
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log("✅ MongoDB Atlas connected successfully!");
    console.log("📊 Database:", mongoose.connection.name);
    console.log("🏠 Host:", mongoose.connection.host);
    
    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
    });
    
    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected. Attempting to reconnect...");
    });
    
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    
    // Provide helpful error messages
    if (error.message.includes("Authentication failed")) {
      console.error("💡 Check your MongoDB Atlas username and password");
      console.error("💡 Make sure database user 'zyron' exists with password 'obatheboy'");
    } else if (error.message.includes("getaddrinfo ENOTFOUND")) {
      console.error("💡 Check network access in MongoDB Atlas");
      console.error("💡 Ensure 'Allow Access from Anywhere' (0.0.0.0/0) is added");
    } else if (error.message.includes("bad auth")) {
      console.error("💡 Password might contain special characters that need URL encoding");
    }
    
    process.exit(1);
  }
};

// Test connection immediately
(async () => {
  try {
    await connectDB();
    
    // Test with a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Available collections: ${collections.length > 0 ? collections.map(c => c.name).join(', ') : 'None yet'}`);
    
  } catch (error) {
    // Error already handled in connectDB
  }
})();

module.exports = mongoose;