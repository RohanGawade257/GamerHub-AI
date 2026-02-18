const express = require("express");
const mongoose = require("mongoose");

const authMiddleware = require("../middleware/auth");
const Community = require("../models/Community");
const Chat = require("../models/Chat");
const { getOnlineUserIds } = require("../socket");

const router = express.Router();

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id || ""));
}

function getEntityId(entity) {
  if (!entity) {
    return "";
  }
  if (typeof entity === "string") {
    return entity;
  }
  return String(entity._id || entity.id || entity);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function generateInviteCode() {
  const codeLength = Math.floor(Math.random() * 3) + 6;
  return Math.random().toString(36).substring(2, codeLength + 2).toUpperCase();
}

async function createUniqueInviteCode(maxAttempts = 12) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const inviteCode = generateInviteCode();
    // eslint-disable-next-line no-await-in-loop
    const existing = await Community.findOne({ inviteCode }).select("_id").lean();
    if (!existing) {
      return inviteCode;
    }
  }

  throw new Error("Unable to generate invite code");
}

function serializeCommunity(communityDoc, viewerUserId = "") {
  const community = communityDoc.toObject ? communityDoc.toObject() : communityDoc;
  const onlineUserIds = getOnlineUserIds();
  const onlineIdSet = new Set(onlineUserIds);
  const creatorId = getEntityId(community.createdBy);

  const members = (community.members || []).map((member) => {
    if (!member || typeof member !== "object") {
      return member;
    }

    return {
      ...member,
      isOnline: onlineIdSet.has(String(member._id)),
    };
  });

  const serialized = {
    ...community,
    members,
    memberCount: members.length,
  };

  if (creatorId !== String(viewerUserId || "")) {
    delete serialized.inviteCode;
  }

  return serialized;
}

router.post("/create", authMiddleware, async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const description = String(req.body?.description || "").trim();

    if (!name) {
      return res.status(400).json({ error: "Community name is required" });
    }

    const inviteCode = await createUniqueInviteCode();

    const community = await Community.create({
      name,
      description,
      inviteCode,
      createdBy: req.user.id,
      members: [req.user.id],
    });

    const populated = await Community.findById(community._id)
      .populate("createdBy", "name email profileImage")
      .populate("members", "name email profileImage bio skillLevel socialLinks isOnline");

    return res.status(201).json({ community: serializeCommunity(populated, req.user.id) });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to create community" });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const search = String(req.query?.search || "").trim();
    const filter = {};

    if (search) {
      filter.name = { $regex: escapeRegex(search), $options: "i" };
    }

    const communities = await Community.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email profileImage")
      .populate("members", "name email profileImage");

    const serialized = communities.map((community) => {
      const formatted = serializeCommunity(community, req.user.id);
      return {
        ...formatted,
        joined: (formatted.members || []).some((member) => String(member?._id || member) === req.user.id),
      };
    });

    return res.json({ communities: serialized });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to fetch communities" });
  }
});

router.post("/join-by-code", authMiddleware, async (req, res) => {
  try {
    const inviteCode = String(req.body?.inviteCode || "").trim().toUpperCase();
    if (!inviteCode) {
      return res.status(400).json({ error: "inviteCode is required" });
    }

    const community = await Community.findOne({ inviteCode });
    if (!community) {
      return res.status(404).json({ error: "Community not found for this invite code" });
    }

    const alreadyJoined = community.members.some((memberId) => String(memberId) === req.user.id);
    if (!alreadyJoined) {
      community.members.push(req.user.id);
      await community.save();
    }

    const populated = await Community.findById(community._id)
      .populate("createdBy", "name email profileImage")
      .populate("members", "name email profileImage bio skillLevel socialLinks isOnline");

    return res.json({
      community: serializeCommunity(populated, req.user.id),
      message: alreadyJoined ? "Already a member" : "Joined successfully",
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to join community by code" });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const communityId = req.params.id;
    if (!isValidObjectId(communityId)) {
      return res.status(400).json({ error: "Invalid community id" });
    }

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    if (String(community.createdBy) !== req.user.id) {
      return res.status(403).json({ error: "Only the community creator can update this community" });
    }

    const updates = req.body || {};

    if (updates.name !== undefined) {
      const normalizedName = String(updates.name || "").trim();
      if (!normalizedName) {
        return res.status(400).json({ error: "Community name is required" });
      }
      community.name = normalizedName;
    }

    if (updates.description !== undefined) {
      community.description = String(updates.description || "").trim();
    }

    if (updates.regenerateInviteCode === true) {
      community.inviteCode = await createUniqueInviteCode();
    }

    await community.save();

    const populated = await Community.findById(community._id)
      .populate("createdBy", "name email profileImage")
      .populate("members", "name email profileImage bio skillLevel socialLinks isOnline");

    return res.json({ community: serializeCommunity(populated, req.user.id) });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to update community" });
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const communityId = req.params.id;
    if (!isValidObjectId(communityId)) {
      return res.status(400).json({ error: "Invalid community id" });
    }

    const community = await Community.findById(communityId)
      .populate("createdBy", "name email profileImage")
      .populate("members", "name email location skillLevel profileImage bio socialLinks isOnline");

    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    const messages = await Chat.find({ communityId })
      .sort({ timestamp: 1 })
      .limit(300)
      .populate("senderId", "name profileImage");

    return res.json({
      community: serializeCommunity(community, req.user.id),
      messages,
      onlineUserIds: getOnlineUserIds(),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Unable to fetch community" });
  }
});

module.exports = router;
