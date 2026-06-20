import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    select: false,
  },
  profileImg: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  resetToken: {
    type: String,
  },
  expireAccessToken: [
    {
      type: Object,
    },
  ],
  expireRefreshToken: [
    {
      type: Object,
    },
  ],
  ip: {
    type: String,
  },
  location: {
    type: String,
  },
  farmSize: {
    type: String,
    default: "3 acres",
  },
  cropsInterested: [
    {
      type: String,
    },
  ],
  chatHistory: [
    {
      type: Schema.Types.ObjectId,
      ref: "ChatHistory",
    },
  ],
  maxRateLimit: {
    type: Number,
    default: 10,
  },
  currentLimit: {
    type: Number,
    default: 0,
  },
  recentRateLimitTime: {
    type: Number,
    default: 0,
  },
});

export const user = mongoose.model("User", userSchema);
