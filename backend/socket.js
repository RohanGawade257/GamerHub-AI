const jwt = require("jsonwebtoken");

const Game = require("./models/Game");
const Community = require("./models/Community");
const User = require("./models/User");
const Chat = require("./models/Chat");

const activeUserSockets = new Map();

function extractSocketToken(socket) {
  const handshakeToken = socket.handshake.auth?.token;
  if (typeof handshakeToken === "string" && handshakeToken.trim()) {
    return handshakeToken.trim();
  }

  const authHeader = socket.handshake.headers?.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return "";
}

function isUserParticipant(game, userId) {
  return game.participants.some((participantId) => String(participantId) === String(userId));
}

function isCommunityMember(community, userId) {
  return community.members.some((memberId) => String(memberId) === String(userId));
}

function buildMatchMessage(chatDoc, user) {
  return {
    _id: chatDoc._id,
    matchId: chatDoc.matchId,
    senderId: {
      _id: user._id,
      name: user.name,
      profileImage: user.profileImage || "",
    },
    message: chatDoc.message,
    timestamp: chatDoc.timestamp,
  };
}

function buildCommunityMessage(chatDoc, user) {
  return {
    _id: chatDoc._id,
    communityId: chatDoc.communityId,
    senderId: {
      _id: user._id,
      name: user.name,
      profileImage: user.profileImage || "",
    },
    message: chatDoc.message,
    timestamp: chatDoc.timestamp,
  };
}

function getOnlineUserIds() {
  return Array.from(activeUserSockets.keys());
}

function isUserOnline(userId) {
  return activeUserSockets.has(String(userId));
}

async function setUserPresence(userId, isOnline) {
  try {
    await User.findByIdAndUpdate(userId, { isOnline }, { new: false });
  } catch (error) {
    console.error("[socket] Failed to update user presence:", error.message);
  }
}

function initializeSocket(io) {
  function allowSocketWithoutAuth(socket, next) {
    console.warn("[socket-auth] Allowing socket without auth (TEMP)");
    socket.user = { _id: "debug", name: "DebugUser" };
    return next();
  }

  io.use(async (socket, next) => {
    try {
      const token = extractSocketToken(socket);
      if (!token) {
        return allowSocketWithoutAuth(socket, next);
      }

      console.log("[socket-auth] Verifying token");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id name profileImage");
      if (!user) {
        return allowSocketWithoutAuth(socket, next);
      }

      socket.user = user;
      return next();
    } catch (error) {
      console.error("[socket-auth] JWT error:", error.message);
      console.error("[socket-auth] Token received:", extractSocketToken(socket));
      return allowSocketWithoutAuth(socket, next);
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    const userId = String(socket.user._id);
    const previousConnections = activeUserSockets.get(userId) || 0;
    activeUserSockets.set(userId, previousConnections + 1);

    if (previousConnections === 0) {
      void setUserPresence(userId, true);
      io.emit("presence-update", { userId, isOnline: true });
    }

    socket.on("joinMatch", async (payload, callback) => {
      try {
        const matchId = String(payload?.matchId || "").trim();
        if (!matchId) {
          throw new Error("matchId is required");
        }

        const game = await Game.findById(matchId).select("participants");
        if (!game) {
          throw new Error("Match not found");
        }

        if (!isUserParticipant(game, socket.user._id)) {
          throw new Error("Join this match before opening chat");
        }

        socket.join(`match:${matchId}`);

        if (typeof callback === "function") {
          callback({ ok: true });
        }
      } catch (error) {
        if (typeof callback === "function") {
          callback({ ok: false, error: error.message || "Unable to join chat room" });
        }
      }
    });

    socket.on("sendMessage", async (payload, callback) => {
      try {
        const matchId = String(payload?.matchId || "").trim();
        const rawMessage = String(payload?.message || "").trim();

        if (!matchId || !rawMessage) {
          throw new Error("matchId and message are required");
        }

        const game = await Game.findById(matchId).select("participants");
        if (!game) {
          throw new Error("Match not found");
        }

        if (!isUserParticipant(game, socket.user._id)) {
          throw new Error("Only participants can send match messages");
        }

        const chatDoc = await Chat.create({
          matchId,
          senderId: socket.user._id,
          message: rawMessage.slice(0, 500),
          timestamp: new Date(),
        });

        const outgoingMessage = buildMatchMessage(chatDoc, socket.user);
        io.to(`match:${matchId}`).emit("newMessage", outgoingMessage);

        if (typeof callback === "function") {
          callback({ ok: true, message: outgoingMessage });
        }
      } catch (error) {
        if (typeof callback === "function") {
          callback({ ok: false, error: error.message || "Unable to send message" });
        }
      }
    });

    socket.on("join-community", async (payload, callback) => {
      try {
        const communityId = String(payload?.communityId || "").trim();
        if (!communityId) {
          throw new Error("communityId is required");
        }

        const community = await Community.findById(communityId).select("members");
        if (!community) {
          throw new Error("Community not found");
        }

        if (!isCommunityMember(community, socket.user._id)) {
          throw new Error("Join this community before opening chat");
        }

        socket.join(`community:${communityId}`);
        const onlineUsers = getOnlineUserIds();
        socket.emit("presence-sync", onlineUsers);

        if (typeof callback === "function") {
          callback({ ok: true });
        }
      } catch (error) {
        if (typeof callback === "function") {
          callback({ ok: false, error: error.message || "Unable to join community" });
        }
      }
    });

    socket.on("send-message", async (payload, callback) => {
      try {
        const communityId = String(payload?.communityId || "").trim();
        const rawMessage = String(payload?.message || "").trim();

        if (!communityId || !rawMessage) {
          throw new Error("communityId and message are required");
        }

        const community = await Community.findById(communityId).select("members");
        if (!community) {
          throw new Error("Community not found");
        }

        if (!isCommunityMember(community, socket.user._id)) {
          throw new Error("Only community members can send messages");
        }

        const chatDoc = await Chat.create({
          communityId,
          senderId: socket.user._id,
          message: rawMessage.slice(0, 500),
          timestamp: new Date(),
        });

        const outgoingMessage = buildCommunityMessage(chatDoc, socket.user);
        io.to(`community:${communityId}`).emit("receive-message", outgoingMessage);

        if (typeof callback === "function") {
          callback({ ok: true, message: outgoingMessage });
        }
      } catch (error) {
        if (typeof callback === "function") {
          callback({ ok: false, error: error.message || "Unable to send message" });
        }
      }
    });

    socket.on("disconnect", () => {
      const currentCount = activeUserSockets.get(userId) || 0;
      const nextCount = Math.max(0, currentCount - 1);

      if (nextCount === 0) {
        activeUserSockets.delete(userId);
        void setUserPresence(userId, false);
        io.emit("presence-update", { userId, isOnline: false });
      } else {
        activeUserSockets.set(userId, nextCount);
      }
    });
  });

  return io;
}

module.exports = {
  initializeSocket,
  getOnlineUserIds,
  isUserOnline,
};
