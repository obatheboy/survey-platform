const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const surveyRoutes = require("./routes/survey.routes");
const activationRoutes = require("./routes/activation.routes");
const withdrawRoutes = require("./routes/withdraw.routes");
const affiliateRoutes = require("./routes/affiliate.routes");
const gamificationRoutes = require("./routes/gamification.routes");

const adminRoutes = require("./routes/admin.routes");
const adminActivationRoutes = require("./routes/admin.activation.routes");
const adminAuthRoutes = require("./routes/admin.auth.routes");
const notificationRoutes = require("./routes/notification.routes");

const app = express();

/* ===============================
   🔥 TRUST PROXY (CRITICAL FOR VERCEL/RENDER)
================================ */
app.set("trust proxy", 1);

/* ===============================
   🌍 CORS (DEV + LIVE + POSTMAN SAFE)
   ✅ Supports any Vercel subdomain
================================ */
const allowedOrigins = [
  "http://localhost:5173", // local dev
  "https://survey-platform-three.vercel.app", // old live frontend
  "https://www.survey-platform-three.vercel.app", // old www
  /\.vercel\.app$/, // matches any vercel deployment automatically
  "https://survey-platform-h4o7mczvu-obatheboys-projects.vercel.app", // new frontend
  "https://survey-platform-h4o7mczvu-obatheboys-projects.vercel.app/", // with trailing slash
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman / server-to-server

      const cleanOrigin = origin.replace(/\/$/, "");

      // Allow if in array OR matches regex
      if (
        allowedOrigins.some((o) =>
          o instanceof RegExp ? o.test(cleanOrigin) : o === cleanOrigin
        )
      ) {
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
app.use("/api/affiliate", affiliateRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/notifications", notificationRoutes); // ✅ USER NOTIFICATIONS HERE

/* ===============================
   🛡 ADMIN ROUTES
================================ */
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes); // ✅ ADMIN NOTIFICATION SENDING IS IN HERE
app.use("/api/admin", adminActivationRoutes);

/* ===============================
   ❌ GLOBAL ERROR HANDLER
================================ */
app.use((err, req, res, next) => {
  console.error("Global error:", err.message || err);
  res.status(500).json({ message: err.message || "Server error" });
});

module.exports = app;