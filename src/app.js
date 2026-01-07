/* ===============================
   CORS (RENDER + VERCEL SAFE)
================================ */
const allowedOrigins = [
  "http://localhost:5173",
  "https://survey-platform-three.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow server-to-server & curl
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
