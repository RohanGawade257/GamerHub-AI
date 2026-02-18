const express = require("express");
const bcrypt = require("bcrypt");

const { authMiddleware } = require("../middleware/hotfixAuth");
const { store } = require("../store/hackathonStore");

const router = express.Router();

function publicUser(user) {
  return {
    _id: user.id,
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

router.get("/me", authMiddleware, (req, res) => {
  const user = store.users.find((entry) => entry.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ user: publicUser(user) });
});

router.put("/update", authMiddleware, async (req, res) => {
  try {
    const user = store.users.find((entry) => entry.id === req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const nextName = String(req.body?.name || "").trim();
    const nextEmail = String(req.body?.email || "").trim().toLowerCase();
    const nextPassword = String(req.body?.password || "").trim();

    if (nextName) {
      user.name = nextName;
    }

    if (nextEmail && nextEmail !== user.email) {
      const usedByOther = store.users.some((entry) => entry.email === nextEmail && entry.id !== user.id);
      if (usedByOther) {
        return res.status(409).json({ error: "Email already in use" });
      }
      user.email = nextEmail;
    }

    if (nextPassword) {
      user.passwordHash = await bcrypt.hash(nextPassword, 10);
    }

    return res.json({ user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to update user" });
  }
});

module.exports = router;
