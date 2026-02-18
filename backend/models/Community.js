const mongoose = require("mongoose");

const { Schema } = mongoose;

const communitySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    inviteCode: {
      type: String,
      trim: true,
      uppercase: true,
      minlength: 6,
      maxlength: 8,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

communitySchema.index({ name: 1 });
communitySchema.index({ inviteCode: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Community", communitySchema);
