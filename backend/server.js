require("dotenv").config();

const http = require("node:http");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Server } = require("socket.io");

const chatRoutes = require("./routes/chat");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const gameRoutes = require("./routes/games");
const communityRoutes = require("./routes/community");
const { initializeSocket } = require("./socket");
const { scheduleExpiredMatchCleanup } = require("./utils/cleanupExpiredMatches");
const { loadKnowledgeEmbeddings } = require("./services/embedder");

const app = express();
const server = http.createServer(app);

const PORT = Number(process.env.PORT || 5000);
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/community_sports";
const defaultAllowedOrigins = ["http://localhost:5173", "https://gamer-hub-ai.vercel.app"];
const allowedOrigins = String(
  process.env.SPORTS_CORS_ORIGIN || process.env.CORS_ORIGIN || defaultAllowedOrigins.join(","),
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAllOrigins = allowedOrigins.includes("*");

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "dev_jwt_secret_change_me";
  console.warn("[sports] JWT_SECRET not set. Using temporary dev secret.");
}

function jsonSyntaxGuard(error, _req, res, next) {
  if (error instanceof SyntaxError && Object.prototype.hasOwnProperty.call(error, "body")) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }
  return next(error);
}

process.on("uncaughtException", (error) => {
  console.error("[server] uncaughtException:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("[server] unhandledRejection:", reason);
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowAllOrigins || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin is not allowed"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(jsonSyntaxGuard);

app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user", userRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/community", communityRoutes);

app.get("/health", (_req, res) => {
  return res.status(200).json({ status: "ok", service: "ai" });
});

app.use((_req, res) => {
  return res.status(404).json({ error: "Route not found" });
});

app.use((error, _req, res, _next) => {
  const statusCode = error?.statusCode || 500;
  const message = error?.message || "Internal server error";
  return res.status(statusCode).json({ error: message });
});

const io = new Server(server, {
  cors: {
    origin: allowAllOrigins ? true : allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["polling", "websocket"],
});

initializeSocket(io);

async function preloadKnowledgeBase() {
  try {
    await loadKnowledgeEmbeddings();
    console.log("Knowledge base embeddings loaded");
  } catch (error) {
    console.error("Failed to preload knowledge base embeddings:", error);
  }
}

async function startServer() {
  await mongoose.connect(MONGO_URI);
  scheduleExpiredMatchCleanup(console);

  server.listen(PORT, () => {
    console.log("Server running on port", PORT);
    console.log("JWT_SECRET length:", process.env.JWT_SECRET?.length);
    console.log("Socket.IO transports:", "polling, websocket");
    console.log(
      "GROQ_API_KEY loaded:",
      process.env.GROQ_API_KEY ? "yes" : "no",
    );
    console.log(
      "GROQ_MODEL configured:",
      process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    );

    void preloadKnowledgeBase();
  });
}

void startServer().catch((error) => {
  console.error("Failed to start backend services:", error);
});
