import express from "express";

import {
  cropRecommend,
  farmingTips,
  fertilizerSuggest,
  detectDisease,
  getDiseaseReports,
} from "../controllers/cropController.js";
import { requireAuth } from "../middleware/auth.js";
import { imageUploadLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/crop-recommend", cropRecommend);
router.post("/fertilizer-suggest", fertilizerSuggest);
router.post("/farming-tips", farmingTips);

router.post("/disease-detect", requireAuth, imageUploadLimiter, detectDisease);
router.get("/disease-reports", requireAuth, getDiseaseReports);

export default router;
