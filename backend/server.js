require("dotenv").config();

const http = require("node:http");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const chatRoutes = require("./routes/chat");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const gameRoutes = require("./routes/games");
const communityRoutes = require("./routes/community");
const { initializeSocket } = require("./socket");
const { scheduleExpiredMatchCleanup } = require("./utils/cleanupExpiredMatches");
const { loadKnowledgeEmbeddings } = require("./services/embedder");

const aiApp = express();
const sportsApp = express();
const aiServer = http.createServer(aiApp);
const sportsServer = http.createServer(sportsApp);

const AI_PORT = Number(process.env.PORT || 5000);
const SPORTS_PORT = Number(process.env.SPORTS_PORT || process.env.PORT || 5001);
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/community_sports";
const SPORTS_CORS_ORIGIN = process.env.SPORTS_CORS_ORIGIN || "https://gamer-hub-ai.vercel.app";
const RUN_SINGLE_PORT_SOCKET = SPORTS_PORT === AI_PORT;

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

aiApp.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  }),
);
aiApp.use(express.json({ limit: "10mb" }));
aiApp.use(express.urlencoded({ extended: true, limit: "10mb" }));
aiApp.use(jsonSyntaxGuard);

aiApp.use("/api/chat", chatRoutes);
aiApp.use("/api/auth", authRoutes);
aiApp.use("/api/users", userRoutes);
aiApp.use("/api/user", userRoutes);
aiApp.use("/api/games", gameRoutes);
aiApp.use("/api/community", communityRoutes);
aiApp.get("/health", (_req, res) => {
  return res.status(200).json({ status: "ok", service: "ai" });
});

sportsApp.use(
  cors({
    origin: String(SPORTS_CORS_ORIGIN)
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  }),
);
sportsApp.use(express.json({ limit: "10mb" }));
sportsApp.use(express.urlencoded({ extended: true, limit: "10mb" }));
sportsApp.use(jsonSyntaxGuard);

sportsApp.use("/api/auth", authRoutes);
sportsApp.use("/api/users", userRoutes);
sportsApp.use("/api/user", userRoutes);
sportsApp.use("/api/games", gameRoutes);
sportsApp.use("/api/community", communityRoutes);

sportsApp.get("/health", (_req, res) => {
  return res.status(200).json({ status: "ok", service: "sports" });
});

sportsApp.use((_req, res) => {
  return res.status(404).json({ error: "Route not found" });
});

sportsApp.use((error, _req, res, _next) => {
  const statusCode = error?.statusCode || 500;
  const message = error?.message || "Internal server error";
  return res.status(statusCode).json({ error: message });
});

async function preloadKnowledgeBase() {
  try {
    await loadKnowledgeEmbeddings();
    console.log("Knowledge base embeddings loaded");
  } catch (error) {
    console.error("Failed to preload knowledge base embeddings:", error);
  }
}

function startSportsServer() {
  initializeSocket(sportsServer);
  sportsServer.listen(SPORTS_PORT, () => {
    console.log(`Sports backend running on http://localhost:${SPORTS_PORT}`);
  });
}

function startAiServer(attachSocket) {
  if (attachSocket) {
    initializeSocket(aiServer);
    console.log(`[socket] Socket.IO attached to AI server on port ${AI_PORT}`);
  }

  aiServer.listen(AI_PORT, () => {
    console.log("AI SERVER STARTED");
    console.log(`AI backend running on port ${AI_PORT}`);
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

async function startServers() {
  await mongoose.connect(MONGO_URI);
  scheduleExpiredMatchCleanup(console);

  if (RUN_SINGLE_PORT_SOCKET) {
    startAiServer(true);
    return;
  }

  startSportsServer();
  startAiServer(false);
}

void startServers().catch((error) => {
  console.error("Failed to start backend services:", error);
});
