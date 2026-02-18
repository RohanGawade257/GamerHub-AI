const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { store, createUserId } = require("../store/hackathonStore");
const { getSecret } = require("../middleware/hotfixAuth");

const router = express.Router();

function publicUser(user) {
  return {
    _id: user.id,
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    getSecret(),
    {
      expiresIn: "7d",
    },
  );
}

router.post("/register", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    const existingUser = store.users.find((user) => user.email === email);
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = {
      id: createUserId(),
      name,
      email,
      passwordHash,
    };

    store.users.push(user);

    const token = signToken(user);
    return res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = store.users.find((entry) => entry.email === email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user);
    return res.json({ token, user: publicUser(user) });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Login failed" });
  }
});

module.exports = router;
