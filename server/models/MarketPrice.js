import mongoose from "mongoose";

const marketPriceSchema = new mongoose.Schema(
  {
    crop: String,
    state: String,
    market: String,
    season: String,
    price: Number,
    trend: Number,
    arrival: String,
  },
  { timestamps: true }
);

export const MarketPrice = mongoose.model("MarketPrice", marketPriceSchema);
