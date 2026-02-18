const mongoose = require("mongoose");

const { Schema } = mongoose;

const chatSchema = new Schema({
  matchId: {
    type: Schema.Types.ObjectId,
    ref: "Game",
    index: true,
  },
  communityId: {
    type: Schema.Types.ObjectId,
    ref: "Community",
    index: true,
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

chatSchema.pre("validate", function validateChatTarget(next) {
  const hasMatchId = Boolean(this.matchId);
  const hasCommunityId = Boolean(this.communityId);

  if (hasMatchId === hasCommunityId) {
    this.invalidate("matchId", "Exactly one of matchId or communityId is required");
  }

  next();
});

module.exports = mongoose.model("Chat", chatSchema);
