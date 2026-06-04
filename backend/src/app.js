const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const surveyRoutes = require("./routes/survey.routes");
const activationRoutes = require("./routes/activation.routes");
const withdrawRoutes = require("./routes/withdraw.routes");
const affiliateRoutes = require("./routes/affiliate.routes");
const gamificationRoutes = require("./routes/gamification.routes");
const loginFeeRoutes = require("./routes/loginFee.routes");
const megapayRoutes = require("./routes/megapay.routes");
const planPaymentRoutes = require("./routes/planPayment.routes");

const adminRoutes = require("./routes/admin.routes");
const adminActivationRoutes = require("./routes/admin.activation.routes");
const adminAuthRoutes = require("./routes/admin.auth.routes");
const notificationRoutes = require("./routes/notification.routes");

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://survey-platform-three.vercel.app"
];

const allowedOriginPatterns = [
  /\.vercel\.app$/,
  /\.onrender\.com$/
];

const corsMiddleware = cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.includes(cleanOrigin)) {
      return callback(null, true);
    }
    const matchesPattern = allowedOriginPatterns.some((pattern) =>
      pattern.test(cleanOrigin)
    );
    if (matchesPattern) {
      return callback(null, true);
    }
    console.warn("Blocked by CORS:", origin);
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  exposedHeaders: ["Content-Length", "X-Requested-With"]
});

app.use(corsMiddleware);

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

app.options("*", corsMiddleware);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "awake" });
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "Survey Platform API"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/surveys", surveyRoutes);
app.use("/api/activation", activationRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/affiliate", affiliateRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/login-fee", loginFeeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/megapay", megapayRoutes);
app.use("/api/plans", planPaymentRoutes);

app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminActivationRoutes);

app.use((err, req, res, next) => {
  console.error("Global error:", err.message || err);
  res.status(500).json({ message: err.message || "Server error" });
});

module.exports = app;
