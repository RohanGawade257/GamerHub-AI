const mongoose = require("mongoose");

const { Schema } = mongoose;

const joinedPlayerSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    skill: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    age: {
      type: Number,
      required: true,
      min: 1,
      max: 120,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const gameSchema = new Schema(
  {
    sport: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
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
    thumbnail: {
      type: String,
      default: "",
      trim: true,
    },
    communityCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
      maxlength: 20,
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    joinedPlayers: {
      type: [joinedPlayerSchema],
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

gameSchema.pre("validate", function syncMatchFields(next) {
  if (this.isModified("createdBy")) {
    this.creatorId = this.createdBy;
  } else if (this.createdBy && !this.creatorId) {
    this.creatorId = this.createdBy;
  }

  if (this.isModified("creatorId")) {
    this.createdBy = this.creatorId;
  } else if (this.creatorId && !this.createdBy) {
    this.createdBy = this.creatorId;
  }

  if (this.isModified("dateTime")) {
    this.date = this.dateTime;
  } else if (this.dateTime && !this.date) {
    this.date = this.dateTime;
  }

  if (this.isModified("date")) {
    this.dateTime = this.date;
  } else if (this.date && !this.dateTime) {
    this.dateTime = this.date;
  }

  if (Array.isArray(this.participants) && this.participants.length > 0) {
    this.currentPlayers = this.participants.length;
  }

  return next();
});

gameSchema.index({ sport: 1, dateTime: 1, location: 1 });
gameSchema.index({ creatorId: 1, date: 1 });

module.exports = mongoose.model("Game", gameSchema);
