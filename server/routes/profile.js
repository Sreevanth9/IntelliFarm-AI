import express from "express";
import { body } from "express-validator";

import {
  deleteSavedRecommendation,
  getProfile,
  getSavedRecommendations,
  saveRecommendation,
  updateProfile,
} from "../controllers/profileController.js";
import { requireAuth } from "../middleware/auth.js";
import { verifyOwnership } from "../middleware/verifyOwnership.js";
import { csrfProtection } from "../middleware/csrf.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

router.use(csrfProtection);

router.get("/", requireAuth, getProfile);
router.put(
  "/",
  requireAuth,
  [
    body("name").optional().isString().trim().isLength({ min: 2, max: 100 }).withMessage("Name must be 2-100 characters"),
    body("pincode").optional({ checkFalsy: true }).isString().trim().isLength({ max: 20 }),
    body("location").optional({ checkFalsy: true }).isString().trim().isLength({ max: 200 }),
    body("farmSize").optional({ checkFalsy: true }).isString().trim().isLength({ max: 50 }),
    body("cropsInterested").optional().isArray(),
    body("cropsInterested.*").isString().trim().isLength({ max: 50 }),
    body("profileImg").optional({ checkFalsy: true }).isString(),
    body("profile_img").optional({ checkFalsy: true }).isString(),
  ],
  validateRequest,
  updateProfile
);
router.get("/recommendations", requireAuth, getSavedRecommendations);
router.post(
  "/recommendations",
  requireAuth,
  [
    body("title").isString().trim().isLength({ min: 2, max: 200 }).withMessage("Title must be 2-200 characters"),
    body("category").optional({ checkFalsy: true }).isString().trim().isLength({ max: 50 }).withMessage("Category must be under 50 characters"),
    body("content").isString().trim().isLength({ min: 2, max: 50000 }).withMessage("Content must be 2-50000 characters"),
  ],
  validateRequest,
  saveRecommendation
);
router.delete("/recommendations/:id", requireAuth, verifyOwnership("saved_recommendations"), deleteSavedRecommendation);

export default router;
