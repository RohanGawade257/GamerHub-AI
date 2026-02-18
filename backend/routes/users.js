const express = require("express");
const mongoose = require("mongoose");

const authMiddleware = require("../middleware/auth");
const User = require("../models/User");
const { isUserOnline } = require("../socket");

const router = express.Router();

function normalizePreferredSports(preferredSports) {
  if (preferredSports === undefined) {
    return undefined;
  }

  if (typeof preferredSports === "string") {
    return preferredSports.trim();
  }

  if (!Array.isArray(preferredSports)) {
    return undefined;
  }

  return preferredSports
    .map((sport) => String(sport || "").trim())
    .filter(Boolean)
    .slice(0, 10)
    .join(", ");
}

function normalizeSocialLinks(socialLinks) {
  if (!Array.isArray(socialLinks)) {
    return undefined;
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

function normalizeProfileSocialLinks(socialLinks) {
  if (socialLinks === undefined) {
    return undefined;
  }

  if (!Array.isArray(socialLinks)) {
    return null;
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

function parseAge(age, { required = false } = {}) {
  if (age === undefined || age === null || String(age).trim() === "") {
    if (required) {
      return {
        error: "age is required",
      };
    }

    return {
      value: null,
    };
  }

  const parsedAge = Number(age);
  if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
    return {
      error: "age must be an integer between 1 and 120",
    };
  }

  return {
    value: parsedAge,
  };
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id || ""));
}

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      user: {
        ...user.toObject(),
        isOnline: isUserOnline(user._id),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to fetch profile" });
  }
});

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      user: {
        ...user.toObject(),
        isOnline: isUserOnline(user._id),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to fetch profile" });
  }
});

router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const {
      profileImage,
      age,
      location,
      bio,
      socialLinks,
      phone,
      preferredSports,
    } = req.body || {};

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (profileImage !== undefined) {
      user.profileImage = String(profileImage || "").trim();
    }

    if (age !== undefined) {
      const ageResult = parseAge(age);
      if (ageResult.error) {
        return res.status(400).json({ error: ageResult.error });
      }
      user.age = ageResult.value;
    }

    if (location !== undefined) {
      const normalizedLocation = String(location || "").trim();
      if (!normalizedLocation) {
        return res.status(400).json({ error: "location is required" });
      }
      user.location = normalizedLocation;
    }

    if (bio !== undefined) {
      user.bio = String(bio || "").trim();
    }

    const normalizedSocialLinks = normalizeProfileSocialLinks(socialLinks);
    if (normalizedSocialLinks === null) {
      return res.status(400).json({ error: "socialLinks must be an array" });
    }
    if (normalizedSocialLinks !== undefined) {
      user.socialLinks = normalizedSocialLinks;
    }

    if (phone !== undefined) {
      user.phone = String(phone || "").trim();
    }

    if (preferredSports !== undefined) {
      user.preferredSports = String(preferredSports || "").trim();
    }

    await user.save();

    return res.json({
      user: {
        ...user.toObject(),
        isOnline: isUserOnline(user._id),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to update profile" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      user: {
        ...user.toObject(),
        isOnline: isUserOnline(user._id),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to fetch user" });
  }
});

router.put("/update", authMiddleware, async (req, res) => {
  try {
    const updates = req.body || {};
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (typeof updates.name === "string" && updates.name.trim()) {
      user.name = updates.name.trim();
    }

    if (typeof updates.email === "string" && updates.email.trim()) {
      const normalizedEmail = updates.email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const existingEmail = await User.findOne({ email: normalizedEmail });
        if (existingEmail) {
          return res.status(409).json({ error: "This email is already in use" });
        }
      }
      user.email = normalizedEmail;
    }

    if (typeof updates.location === "string" && updates.location.trim()) {
      user.location = updates.location.trim();
    }

    if (updates.skillLevel !== undefined) {
      const parsedSkill = Number(updates.skillLevel);
      if (!Number.isFinite(parsedSkill) || parsedSkill < 1 || parsedSkill > 5) {
        return res.status(400).json({ error: "skillLevel must be between 1 and 5" });
      }
      user.skillLevel = parsedSkill;
    }

    if (updates.age !== undefined) {
      const ageResult = parseAge(updates.age);
      if (ageResult.error) {
        return res.status(400).json({ error: ageResult.error });
      }
      user.age = ageResult.value;
    }

    if (updates.phone !== undefined) {
      const normalizedPhone = String(updates.phone || "").trim();
      user.phone = normalizedPhone;
    }

    const normalizedSports = normalizePreferredSports(updates.preferredSports);
    if (normalizedSports !== undefined) {
      user.preferredSports = normalizedSports;
    }

    const normalizedSocialLinks = normalizeSocialLinks(updates.socialLinks);
    if (normalizedSocialLinks !== undefined) {
      user.socialLinks = normalizedSocialLinks;
    }

    if (typeof updates.profileImage === "string") {
      user.profileImage = updates.profileImage.trim();
    }

    if (typeof updates.bio === "string") {
      user.bio = updates.bio.trim();
    }

    if (typeof updates.password === "string" && updates.password.trim()) {
      if (updates.password.trim().length < 8) {
        return res.status(400).json({ error: "password must be at least 8 characters" });
      }
      user.password = updates.password.trim();
    }

    await user.save();

    return res.json({
      user: {
        ...user.toJSON(),
        isOnline: isUserOnline(user._id),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to update profile" });
  }
});

module.exports = router;
