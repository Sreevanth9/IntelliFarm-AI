import express from "express";

import {
  deleteSavedRecommendation,
  getProfile,
  getSavedRecommendations,
  saveRecommendation,
  updateProfile,
} from "../controllers/profileController.js";
import { requireAuth } from "../middleware/auth.js";
import { verifyOwnership } from "../middleware/verifyOwnership.js";

const router = express.Router();

router.get("/", requireAuth, getProfile);
router.put("/", requireAuth, updateProfile);
router.get("/recommendations", requireAuth, getSavedRecommendations);
router.post("/recommendations", requireAuth, saveRecommendation);
router.delete("/recommendations/:id", requireAuth, verifyOwnership("saved_recommendations"), deleteSavedRecommendation);

export default router;
