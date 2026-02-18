const http = require("node:http");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const gameRoutes = require("./routes/games");
const communityRoutes = require("./routes/community");
const { initializeSocket } = require("./socket");
const { scheduleExpiredMatchCleanup } = require("./utils/cleanupExpiredMatches");

const PORT = Number(process.env.SPORTS_PORT || process.env.PORT || 5001);
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is required to start sportsServer.js");
}

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is required to start sportsServer.js");
}

const allowedOrigins = String(process.env.SPORTS_CORS_ORIGIN || "http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin is not allowed"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  return res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/community", communityRoutes);

app.use((_req, res) => {
  return res.status(404).json({ error: "Route not found" });
});

app.use((error, _req, res, _next) => {
  const statusCode = error?.statusCode || 500;
  const message = error?.message || "Internal server error";
  return res.status(statusCode).json({ error: message });
});

async function startServer() {
  await mongoose.connect(MONGO_URI);
  initializeSocket(server);
  scheduleExpiredMatchCleanup(console);

  server.listen(PORT, () => {
    console.log(`Sports backend running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start sports backend:", error);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  server.close(() => process.exit(0));
});
