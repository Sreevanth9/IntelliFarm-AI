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
import { aiLimiter } from "../middleware/rateLimiters.js";
import { body } from "express-validator";
import { validateRequest } from "../middleware/validateRequest.js";
import { csrfProtection } from "../middleware/csrf.js";

const router = express.Router();

router.use(requireAuth);
router.use(csrfProtection);

router.post("/crop-recommend", aiLimiter, cropRecommend);
router.post("/fertilizer-suggest", aiLimiter, fertilizerSuggest);
router.post("/farming-tips", aiLimiter, farmingTips);

router.post("/disease-detect", imageUploadLimiter, [
  body("image").isString().isLength({ min: 20, max: 7 * 1024 * 1024 }).withMessage("A valid crop image is required"),
], validateRequest, detectDisease);
router.get("/disease-reports", getDiseaseReports);

export default router;
