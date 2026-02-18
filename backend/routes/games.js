const express = require("express");
const mongoose = require("mongoose");

const authMiddleware = require("../middleware/auth");
const Game = require("../models/Game");
const User = require("../models/User");
const Chat = require("../models/Chat");
const Community = require("../models/Community");
const { autoFormTeams } = require("../utils/teamFormation");

const router = express.Router();

const GAME_POPULATION = [
  { path: "createdBy", select: "name email age phone location skillLevel preferredSports profileImage bio socialLinks isOnline" },
  { path: "creatorId", select: "name email age phone location skillLevel preferredSports profileImage bio socialLinks isOnline" },
  { path: "participants", select: "name email age phone location skillLevel preferredSports profileImage bio socialLinks isOnline" },
  { path: "teams.teamA", select: "name location skillLevel preferredSports profileImage isOnline" },
  { path: "teams.teamB", select: "name location skillLevel preferredSports profileImage isOnline" },
];

function applyGamePopulation(query) {
  GAME_POPULATION.forEach((entry) => {
    query.populate(entry);
  });
  return query;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id || ""));
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePlayerAge(age) {
  const parsedAge = Number(age);
  if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
    return null;
  }

  return parsedAge;
}

function normalizeJoinPayload(payload) {
  const normalizedName = String(payload?.name || "").trim();
  const normalizedSkill = String(payload?.skill || "").trim();
  const normalizedPhone = String(payload?.phone || "").trim();
  const normalizedInviteCode = String(payload?.inviteCode || "").trim().toUpperCase();
  const parsedAge = parsePlayerAge(payload?.age);

  if (!normalizedName) {
    return { error: "name is required" };
  }

  if (!normalizedSkill) {
    return { error: "skill is required" };
  }

  if (parsedAge === null) {
    return { error: "age must be an integer between 1 and 120" };
  }

  if (!normalizedPhone) {
    return { error: "phone is required" };
  }

  return {
    value: {
      name: normalizedName,
      skill: normalizedSkill,
      age: parsedAge,
      phone: normalizedPhone,
      inviteCode: normalizedInviteCode,
    },
  };
}

function buildJoinedPlayerFromUser(user) {
  const parsedAge = parsePlayerAge(user?.age);
  const normalizedPhone = String(user?.phone || "").trim();

  return {
    userId: user._id,
    name: String(user?.name || "Host"),
    skill: String(user?.skillLevel ?? 1),
    age: parsedAge || 18,
    phone: normalizedPhone || "Not provided",
    joinedAt: new Date(),
  };
}

function hasUserJoined(game, userId) {
  const normalizedUserId = String(userId || "");

  const joinedParticipants = game.participants.some((participantId) => {
    return String(participantId) === normalizedUserId;
  });

  if (joinedParticipants) {
    return true;
  }

  return (game.joinedPlayers || []).some((joinedPlayer) => {
    return String(joinedPlayer.userId) === normalizedUserId;
  });
}

async function loadParticipantsForGame(game) {
  const users = await User.find({
    _id: {
      $in: game.participants,
    },
  })
    .select("_id skillLevel")
    .lean();

  const userMap = new Map(users.map((user) => [String(user._id), user]));

  return game.participants
    .map((participantId) => userMap.get(String(participantId)))
    .filter(Boolean);
}

router.post("/create", authMiddleware, async (req, res) => {
  try {
    const {
      sport,
      dateTime,
      location,
      maxPlayers,
      skillRequirement,
      description,
      thumbnail,
      communityCode,
    } = req.body || {};

    if (!sport || !dateTime || !location || !maxPlayers) {
      return res.status(400).json({
        error: "sport, dateTime, location, and maxPlayers are required",
      });
    }

    const parsedDate = new Date(dateTime);
    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "dateTime must be a valid date" });
    }

    const parsedMaxPlayers = Number(maxPlayers);
    if (!Number.isInteger(parsedMaxPlayers) || parsedMaxPlayers < 2) {
      return res.status(400).json({ error: "maxPlayers must be an integer >= 2" });
    }

    const parsedSkillRequirement = Number(skillRequirement || 1);
    if (!Number.isFinite(parsedSkillRequirement) || parsedSkillRequirement < 1 || parsedSkillRequirement > 5) {
      return res.status(400).json({ error: "skillRequirement must be between 1 and 5" });
    }

    const creatorProfile = await User.findById(req.user.id).select("_id name skillLevel age phone");
    if (!creatorProfile) {
      return res.status(404).json({ error: "Creator account not found" });
    }

    const game = await Game.create({
      sport: String(sport).trim(),
      date: parsedDate,
      dateTime: parsedDate,
      location: String(location).trim(),
      maxPlayers: parsedMaxPlayers,
      currentPlayers: 1,
      skillRequirement: parsedSkillRequirement,
      description: String(description || "").trim(),
      thumbnail: String(thumbnail || "").trim(),
      communityCode: String(communityCode || "").trim().toUpperCase(),
      creatorId: req.user.id,
      createdBy: req.user.id,
      participants: [req.user.id],
      joinedPlayers: [buildJoinedPlayerFromUser(creatorProfile)],
      teams: {
        teamA: [],
        teamB: [],
        isManual: false,
      },
    });

    const populatedGame = await applyGamePopulation(Game.findById(game._id));

    return res.status(201).json({ game: populatedGame });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to create game" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { sport, skill, location, upcoming } = req.query;
    const filter = {};

    if (sport) {
      filter.sport = {
        $regex: `^${escapeRegex(sport)}$`,
        $options: "i",
      };
    }

    if (location) {
      filter.location = {
        $regex: escapeRegex(location),
        $options: "i",
      };
    }

    if (skill !== undefined && String(skill).trim() !== "") {
      const parsedSkill = Number(skill);
      if (Number.isFinite(parsedSkill)) {
        filter.skillRequirement = { $lte: parsedSkill };
      }
    }

    if (String(upcoming || "true").toLowerCase() !== "false") {
      filter.dateTime = { $gte: new Date() };
    }

    const games = await applyGamePopulation(Game.find(filter).sort({ dateTime: 1 }));

    return res.json({ games });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to fetch games" });
  }
});

router.get("/:id/players", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid game id" });
    }

    const game = await Game.findById(id).select("createdBy joinedPlayers");
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (String(game.createdBy) !== req.user.id) {
      return res.status(403).json({ error: "Only the game creator can view joined players" });
    }

    const players = (game.joinedPlayers || []).map((player) => ({
      userId: String(player.userId || ""),
      name: player.name,
      skill: player.skill,
      age: player.age,
      phone: player.phone,
      joinedAt: player.joinedAt,
    }));

    return res.json({ players });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to fetch joined players" });
  }
});

router.get("/:id/messages", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid game id" });
    }

    const game = await Game.findById(id).select("participants");
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    const isParticipant = game.participants.some((participantId) => {
      return String(participantId) === req.user.id;
    });

    if (!isParticipant) {
      return res.status(403).json({ error: "Join this game to view chat" });
    }

    const messages = await Chat.find({ matchId: game._id })
      .sort({ timestamp: 1 })
      .populate("senderId", "name skillLevel");

    return res.json({ messages });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to fetch messages" });
  }
});

router.post("/:id/join", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid game id" });
    }

    const joinPayload = normalizeJoinPayload(req.body || {});
    if (joinPayload.error) {
      return res.status(400).json({ error: joinPayload.error });
    }

    const game = await Game.findById(id);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    const alreadyJoined = hasUserJoined(game, req.user.id);

    if (alreadyJoined) {
      const existingGame = await applyGamePopulation(Game.findById(game._id));
      return res.json({ game: existingGame, message: "You are already in this game" });
    }

    if (game.currentPlayers >= game.maxPlayers) {
      return res.status(400).json({ error: "Game is already full" });
    }

    const matchCommunityCode = String(game.communityCode || "").trim().toUpperCase();
    if (matchCommunityCode) {
      if (!joinPayload.value.inviteCode) {
        return res.status(400).json({ error: "inviteCode is required for this match" });
      }

      if (joinPayload.value.inviteCode !== matchCommunityCode) {
        return res.status(400).json({ error: "Invalid community code for this match" });
      }
    }

    game.participants.push(req.user.id);
    game.joinedPlayers.push({
      userId: req.user.id,
      name: joinPayload.value.name,
      skill: joinPayload.value.skill,
      age: joinPayload.value.age,
      phone: joinPayload.value.phone,
      joinedAt: new Date(),
    });
    game.currentPlayers = game.participants.length;

    if (game.currentPlayers >= game.maxPlayers) {
      const participantsWithSkill = await loadParticipantsForGame(game);
      const { teamA, teamB } = autoFormTeams(participantsWithSkill);
      game.teams = {
        teamA,
        teamB,
        isManual: false,
      };
    }

    let community = null;
    let alreadyCommunityMember = true;

    if (joinPayload.value.inviteCode) {
      community = await Community.findOne({ inviteCode: joinPayload.value.inviteCode });
      if (community) {
        alreadyCommunityMember = community.members.some((memberId) => String(memberId) === req.user.id);
        if (!alreadyCommunityMember) {
          community.members.push(req.user.id);
        }
      }
    }

    await game.save();

    if (community && !alreadyCommunityMember) {
      await community.save();
    }

    const populatedGame = await applyGamePopulation(Game.findById(game._id));

    return res.json({
      game: populatedGame,
      message: community && !alreadyCommunityMember ? "Joined game and community successfully" : "Joined game successfully",
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to join game" });
  }
});

router.put("/:id/teams/manual", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid game id" });
    }

    const { teamA, teamB } = req.body || {};
    if (!Array.isArray(teamA) || !Array.isArray(teamB)) {
      return res.status(400).json({ error: "teamA and teamB must be arrays" });
    }

    const game = await Game.findById(id);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (String(game.createdBy) !== req.user.id) {
      return res.status(403).json({ error: "Only the game creator can assign teams" });
    }

    if (game.currentPlayers < game.maxPlayers) {
      return res.status(400).json({ error: "Manual team assignment is available only for full games" });
    }

    const participantIdSet = new Set(game.participants.map((participantId) => String(participantId)));
    const normalizedTeamA = teamA.map((participantId) => String(participantId));
    const normalizedTeamB = teamB.map((participantId) => String(participantId));
    const combinedTeams = [...normalizedTeamA, ...normalizedTeamB];

    if (combinedTeams.length !== participantIdSet.size) {
      return res.status(400).json({ error: "Each participant must be assigned to exactly one team" });
    }

    if (new Set(combinedTeams).size !== participantIdSet.size) {
      return res.status(400).json({ error: "Duplicate participants found in team assignment" });
    }

    const includesUnknownParticipant = combinedTeams.some((participantId) => !participantIdSet.has(participantId));
    if (includesUnknownParticipant) {
      return res.status(400).json({ error: "Team assignment contains non-participant IDs" });
    }

    if (Math.abs(normalizedTeamA.length - normalizedTeamB.length) > 1) {
      return res.status(400).json({ error: "Teams must be split as evenly as possible" });
    }

    game.teams = {
      teamA: normalizedTeamA,
      teamB: normalizedTeamB,
      isManual: true,
    };

    await game.save();

    const populatedGame = await applyGamePopulation(Game.findById(game._id));

    return res.json({ game: populatedGame });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to assign teams" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid game id" });
    }

    const game = await Game.findById(id);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (String(game.createdBy) !== req.user.id) {
      return res.status(403).json({ error: "Only the game creator can update this game" });
    }

    const updates = req.body || {};

    if (typeof updates.sport === "string" && updates.sport.trim()) {
      game.sport = updates.sport.trim();
    }

    if (typeof updates.location === "string" && updates.location.trim()) {
      game.location = updates.location.trim();
    }

    if (typeof updates.description === "string") {
      game.description = updates.description.trim();
    }

    const nextDateValue = updates.date !== undefined ? updates.date : updates.dateTime;
    if (nextDateValue !== undefined) {
      const parsedDate = new Date(nextDateValue);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: "date/dateTime must be a valid date" });
      }
      game.dateTime = parsedDate;
    }

    if (updates.maxPlayers !== undefined) {
      const parsedMaxPlayers = Number(updates.maxPlayers);
      if (!Number.isInteger(parsedMaxPlayers) || parsedMaxPlayers < 2) {
        return res.status(400).json({ error: "maxPlayers must be an integer >= 2" });
      }
      if (parsedMaxPlayers < game.currentPlayers) {
        return res.status(400).json({ error: "maxPlayers cannot be lower than currentPlayers" });
      }
      game.maxPlayers = parsedMaxPlayers;
    }

    if (updates.skillRequirement !== undefined) {
      const parsedSkillRequirement = Number(updates.skillRequirement);
      if (!Number.isFinite(parsedSkillRequirement) || parsedSkillRequirement < 1 || parsedSkillRequirement > 5) {
        return res.status(400).json({ error: "skillRequirement must be between 1 and 5" });
      }
      game.skillRequirement = parsedSkillRequirement;
    }

    await game.save();

    const populatedGame = await applyGamePopulation(Game.findById(game._id));

    return res.json({ game: populatedGame });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to update game" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid game id" });
    }

    const game = await Game.findById(id);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (String(game.createdBy) !== req.user.id) {
      return res.status(403).json({ error: "Only the game creator can delete this game" });
    }

    await Chat.deleteMany({ matchId: game._id });
    await game.deleteOne();

    return res.json({ message: "Game deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to delete game" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid game id" });
    }

    const game = await applyGamePopulation(Game.findById(id));
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    return res.json({ game });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to fetch game" });
  }
});

module.exports = router;
