const mongoose = require("mongoose");

const { Schema } = mongoose;

const gameSchema = new Schema(
  {
    sport: {
      type: String,
      required: true,
      trim: true,
    },
    dateTime: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    maxPlayers: {
      type: Number,
      required: true,
      min: 2,
    },
    currentPlayers: {
      type: Number,
      default: 1,
      min: 1,
    },
    skillRequirement: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    teams: {
      teamA: {
        type: [
          {
            type: Schema.Types.ObjectId,
            ref: "User",
          },
        ],
        default: [],
      },
      teamB: {
        type: [
          {
            type: Schema.Types.ObjectId,
            ref: "User",
          },
        ],
        default: [],
      },
      isManual: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  },
);

gameSchema.index({ sport: 1, dateTime: 1, location: 1 });

module.exports = mongoose.model("Game", gameSchema);
