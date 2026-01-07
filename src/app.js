const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const surveyRoutes = require("./routes/survey.routes");
const activationRoutes = require("./routes/activation.routes");
const withdrawRoutes = require("./routes/withdraw.routes");
const adminRoutes = require("./routes/admin.routes");
const adminActivationRoutes = require("./routes/admin.activation.routes");

const app = express();

/* ===============================
   CORS (RENDER + VERCEL SAFE)
================================ */
app.use(
  cors({
    origin: process.env.FRONTEND_URL, // 🔐 controlled via env
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
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminActivationRoutes);

/* ===============================
   HEALTH CHECK (RENDER USES THIS)
================================ */
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "Survey Platform API",
  });
});

module.exports = app;
