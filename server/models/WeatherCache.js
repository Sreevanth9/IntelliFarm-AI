import mongoose from "mongoose";

const weatherCacheSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    data: {
      type: Object,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

weatherCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const WeatherCache = mongoose.model("WeatherCache", weatherCacheSchema);
