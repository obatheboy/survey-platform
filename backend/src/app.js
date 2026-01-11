const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const surveyRoutes = require("./routes/survey.routes");
const activationRoutes = require("./routes/activation.routes");
const withdrawRoutes = require("./routes/withdraw.routes");

const adminRoutes = require("./routes/admin.routes");
const adminActivationRoutes = require("./routes/admin.activation.routes");
const adminAuthRoutes = require("./routes/admin.auth.routes");

const app = express();

/* ===============================
   🔥 TRUST PROXY (CRITICAL FOR VERCEL/RENDER)
================================ */
app.set("trust proxy", 1);

/* ===============================
   🌍 CORS (DEV + LIVE + POSTMAN SAFE)
================================ */
const allowedOrigins = [
  "http://localhost:5173", // local dev
  "https://survey-platform-three.vercel.app", // live frontend
  "https://www.survey-platform-three.vercel.app", // optional www
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      console.warn("Blocked by CORS:", origin);
      return callback(new Error(`CORS not allowed for ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

/* ===============================
   🧩 MIDDLEWARE
================================ */
app.use(express.json());
app.use(cookieParser());

/* ===============================
   🩺 HEALTH CHECK (RENDER WAKE-UP)
   MUST BE /api/health
================================ */
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "awake" });
});

/* ===============================
   🏠 ROOT INFO
================================ */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "Survey Platform API",
  });
});

/* ===============================
   👤 USER ROUTES
================================ */
app.use("/api/auth", authRoutes);
app.use("/api/surveys", surveyRoutes);
app.use("/api/activation", activationRoutes);
app.use("/api/withdraw", withdrawRoutes);

/* ===============================
   🛡 ADMIN ROUTES
================================ */
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminActivationRoutes);

/* ===============================
   ❌ GLOBAL ERROR HANDLER
================================ */
app.use((err, req, res, next) => {
  console.error("Global error:", err.message || err);
  res.status(500).json({ message: err.message || "Server error" });
});

module.exports = app;
