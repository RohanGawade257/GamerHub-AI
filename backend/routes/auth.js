const express = require("express");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();

function normalizePreferredSports(preferredSports) {
  if (!Array.isArray(preferredSports)) {
    return [];
  }

  return preferredSports
    .map((sport) => String(sport || "").trim())
    .filter(Boolean)
    .slice(0, 10);
}

function normalizeSocialLinks(socialLinks) {
  if (!Array.isArray(socialLinks)) {
    return [];
  }

  return socialLinks
    .map((entry) => ({
      platform: String(entry?.platform || "").trim(),
      label: String(entry?.label || "").trim(),
      url: String(entry?.url || "").trim(),
    }))
    .filter((entry) => entry.platform && entry.label && entry.url)
    .slice(0, 10);
}

function signToken(userId) {
  return jwt.sign(
    {
      id: userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
}

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      preferredSports,
      location,
      skillLevel,
      profileImage,
      bio,
      socialLinks,
    } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "name, email, and password are required",
      });
    }

    const parsedSkillLevel = skillLevel === undefined ? 3 : Number(skillLevel);
    if (!Number.isFinite(parsedSkillLevel) || parsedSkillLevel < 1 || parsedSkillLevel > 5) {
      return res.status(400).json({ error: "skillLevel must be between 1 and 5" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: String(password),
      preferredSports: normalizePreferredSports(preferredSports),
      location: String(location || "Unknown").trim() || "Unknown",
      skillLevel: parsedSkillLevel,
      profileImage: String(profileImage || "").trim(),
      bio: String(bio || "").trim(),
      socialLinks: normalizeSocialLinks(socialLinks),
    });

    const token = signToken(user._id.toString());

    return res.status(201).json({
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(String(password));
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user._id.toString());

    return res.json({
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Login failed" });
  }
});

module.exports = router;
