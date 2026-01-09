const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const surveyRoutes = require("./routes/survey.routes");
const activationRoutes = require("./routes/activation.routes");
const withdrawRoutes = require("./routes/withdraw.routes");
const adminRoutes = require("./routes/admin.routes");
const adminActivationRoutes = require("./routes/admin.activation.routes");
const adminAuthRoutes = require("./routes/admin.auth.routes"); // ✅ ADDED

const app = express();

/* ===============================
   🔥 TRUST PROXY (CRITICAL FIX)
================================ */
app.set("trust proxy", 1);

/* ===============================
   CORS (VERCEL + RENDER SAFE)
================================ */
const allowedOrigins = [
  "http://localhost:5173",
  "https://survey-platform-three.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

/* ===============================
   MIDDLEWARE
================================ */
app.use(express.json());
app.use(cookieParser());

/* ===============================
   USER ROUTES
================================ */
app.use("/api/auth", authRoutes);
app.use("/api/surveys", surveyRoutes);
app.use("/api/activation", activationRoutes);
app.use("/api/withdraw", withdrawRoutes);

/* ===============================
   ADMIN ROUTES
================================ */
app.use("/api/admin/auth", adminAuthRoutes); // ✅ ADMIN LOGIN
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminActivationRoutes);

/* ===============================
   HEALTH CHECK
================================ */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "Survey Platform API",
  });
});

module.exports = app;
