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
    body("location").optional({ checkFalsy: true }).isString().trim().isLength({ max: 200 }).withMessage("Location must be under 200 characters"),
    body("farmSize").optional({ checkFalsy: true }).isString().trim().isLength({ max: 50 }).withMessage("Farm size must be under 50 characters"),
    body("cropsInterested").optional().isArray().withMessage("Crops interested must be an array"),
    body("cropsInterested.*").isString().trim().isLength({ max: 50 }).withMessage("Crop name must be under 50 characters"),
    body("profileImg").optional({ checkFalsy: true }).isURL().withMessage("Profile image must be a valid URL"),
    body("profile_img").optional({ checkFalsy: true }).isURL().withMessage("Profile image must be a valid URL"),
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
