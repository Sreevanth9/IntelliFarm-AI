import express from "express";
import { body } from "express-validator";

import { addFarm, getFarms, deleteFarm } from "../controllers/farmController.js";
import { requireAuth } from "../middleware/auth.js";
import { verifyOwnership } from "../middleware/verifyOwnership.js";
import { csrfProtection } from "../middleware/csrf.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

router.use(requireAuth);
router.use(csrfProtection);

router.post(
  "/",
  [
    body("name").isString().trim().isLength({ min: 2, max: 100 }).withMessage("Farm name must be 2-100 characters"),
    body("location").optional({ checkFalsy: true }).isString().trim().isLength({ max: 200 }).withMessage("Location must be under 200 characters"),
    body("crop").isString().trim().isLength({ min: 2, max: 50 }).withMessage("Crop must be 2-50 characters"),
    body("soilType").isString().trim().isLength({ min: 2, max: 50 }).withMessage("Soil type must be 2-50 characters"),
    body("area").isString().trim().isLength({ min: 1, max: 50 }).withMessage("Area must be 1-50 characters"),
    body("sowingDate").isISO8601().withMessage("Sowing date must be a valid date"),
  ],
  validateRequest,
  addFarm
);
router.get("/", getFarms);
router.delete("/:id", verifyOwnership("farms"), deleteFarm);

export default router;
