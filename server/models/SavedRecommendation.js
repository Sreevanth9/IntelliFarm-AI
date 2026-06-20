import mongoose from "mongoose";

const Schema = mongoose.Schema;

const savedRecommendationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "General",
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const SavedRecommendation = mongoose.model(
  "SavedRecommendation",
  savedRecommendationSchema
);
