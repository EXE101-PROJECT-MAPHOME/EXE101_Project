const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const path = require("path");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { initCronJobs } = require("./utils/cronJobs");
const errorHandler = require("./middleware/errorMiddleware");

// Load env vars
dotenv.config();

// Override configuration if USE_LOCAL_BACKEND is set to true
if (process.env.USE_LOCAL_BACKEND === "true") {
  process.env.BACKEND_URL = `http://localhost:${process.env.PORT || 5000}`;
  process.env.FRONTEND_URL = "http://localhost:5173";
  process.env.VNP_RETURN_URL = `http://localhost:${process.env.PORT || 5000}/api/payments/callback`;
  console.log("⚠️ Running Backend in LOCAL override mode:");
  console.log(`- BACKEND_URL: ${process.env.BACKEND_URL}`);
  console.log(`- FRONTEND_URL: ${process.env.FRONTEND_URL}`);
}
// Connect to database and then start server
const app = express();

// Middleware
// CORS config: allow configured web origins plus localhost (any port), and
// allow non-browser clients (no Origin header) so mobile/native apps can call the API.
// Configure additional allowed origins with ALLOWED_ORIGINS (comma-separated).
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools or native clients that do not set Origin
      if (!origin) return callback(null, true);

      const envList = (process.env.ALLOWED_ORIGINS || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const allowedOrigins = Array.from(
        new Set([process.env.FRONTEND_URL, ...envList].filter(Boolean)),
      );

      // Cho phép các môi trường local
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      // Cho phép BẤT KỲ tên miền nào kết thúc bằng .vercel.app (rất tiện khi Vercel tự sinh link Preview)
      const isVercel = /^https?:\/\/.*\.vercel\.app$/.test(origin);

      // Cho phép BẤT KỲ tên miền nào kết thúc bằng .onrender.com
      const isRender = /^https?:\/\/.*\.onrender\.com$/.test(origin);

      if (allowedOrigins.includes(origin) || isLocalhost || isVercel || isRender) {
        return callback(null, true);
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    optionsSuccessStatus: 204,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Intercept JSON parse errors for PayOS webhook ONLY — PayOS test requests
// may have unexpected body format, so we must always return 200
app.use((err, req, res, next) => {
  if (req.path && req.path.includes('/payments/webhook')) {
    return res.status(200).json({ success: true });
  }
  next(err);
});



// Cloudinary is now used for all images, no local /uploads static serving needed.

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/api/properties", require("./routes/propertyRoutes"));
app.use("/api/landlords", require("./routes/landlordRoutes"));
app.use("/api/landlord", require("./routes/landlordDashboardRoutes"));
app.use("/api/broker", require("./routes/brokerDashboardRoutes"));
app.use("/api/verifications", require("./routes/verificationRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/user", require("./routes/userRoutes")); // alias for singular
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/uploads", require("./routes/uploadRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes")); // alias for singular
app.use("/api/settings", require("./routes/settingRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/subscriptions", require("./routes/subscriptionRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/blogs", require("./routes/blogRoutes"));
app.use("/api/contacts", require("./routes/contactRoutes"));

app.use("/api/map", require("./routes/mapRoutes"));
app.use("/api/vouchers", require("./routes/voucherRoutes"));
app.use("/api/locations", require("./routes/locationRoutes"));
app.use("/api/ai", require("./routes/ai.routes"));
app.use("/api/chat", require("./routes/chatRoutes"));

app.get("/", (req, res) => res.send("API is running..."));

// Health check (includes MongoDB connection status)
const mongoose = require("mongoose");

app.get("/health", (req, res) => {
  const state = mongoose.connection.readyState; // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
  const stateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const dbStatus = stateMap[state] || "unknown";
  const ok = state === 1;
  res.status(ok ? 200 : 503).json({ ok, dbStatus });
});

// 404 handler
app.use((req, res) => res.status(404).json({ message: "Not Found" }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

(async function start() {
  try {
    await connectDB();

    // Initialize scheduled tasks
    initCronJobs();

    const http = require("http");
    const server = http.createServer(app);

    // initialize socket.io
    try {
      const { initSocket } = require("./utils/socket");
      initSocket(server);
      console.log("Socket.IO initialized");
    } catch (err) {
      console.warn("Failed to initialize Socket.IO:", err.message);
    }

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`📚 Swagger API Docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error && error.stack ? error.stack : error,
    );
    process.exit(1);
  }
})();
