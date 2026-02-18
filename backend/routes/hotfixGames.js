const express = require("express");

const { authMiddleware } = require("../middleware/hotfixAuth");
const { store, createGameId } = require("../store/hackathonStore");

const router = express.Router();

function findUserById(userId) {
  return store.users.find((user) => user.id === userId) || null;
}

function formatGame(game) {
  const creator = findUserById(game.createdById);

  return {
    _id: game._id,
    sport: game.sport,
    location: game.location,
    dateTime: game.dateTime,
    maxPlayers: game.maxPlayers,
    currentPlayers: game.players.length,
    players: [...game.players],
    participants: [...game.players],
    createdBy: creator
      ? {
          _id: creator.id,
          id: creator.id,
          name: creator.name,
          email: creator.email,
        }
      : {
          _id: game.createdById,
          id: game.createdById,
          name: "Unknown",
        },
    skillRequirement: 1,
    description: "",
  };
}

router.post("/create", authMiddleware, (req, res) => {
  const sport = String(req.body?.sport || "").trim();
  const location = String(req.body?.location || "").trim();
  const dateTime = String(req.body?.dateTime || "").trim();
  const maxPlayers = Number(req.body?.maxPlayers);

  if (!sport || !location || !dateTime || !Number.isFinite(maxPlayers)) {
    return res.status(400).json({ error: "sport, location, dateTime and maxPlayers are required" });
  }

  if (!Number.isInteger(maxPlayers) || maxPlayers < 2) {
    return res.status(400).json({ error: "maxPlayers must be an integer greater than 1" });
  }

  const parsedDate = new Date(dateTime);
  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ error: "dateTime must be valid" });
  }

  const game = {
    _id: createGameId(),
    sport,
    location,
    dateTime: parsedDate.toISOString(),
    maxPlayers,
    createdById: req.user.id,
    players: [req.user.id],
  };

  store.games.push(game);
  return res.status(201).json({ game: formatGame(game) });
});

router.get("/", (_req, res) => {
  const games = store.games.map((game) => formatGame(game));
  return res.json({ games });
});

router.get("/:id", (req, res) => {
  const game = store.games.find((entry) => entry._id === req.params.id);
  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }

  return res.json({ game: formatGame(game) });
});

router.post("/:id/join", authMiddleware, (req, res) => {
  const game = store.games.find((entry) => entry._id === req.params.id);
  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }

  if (game.players.includes(req.user.id)) {
    return res.json({ game: formatGame(game), message: "Already joined" });
  }

  if (game.players.length >= game.maxPlayers) {
    return res.status(400).json({ error: "Game is full" });
  }

  game.players.push(req.user.id);
  return res.json({ game: formatGame(game) });
});

module.exports = router;
