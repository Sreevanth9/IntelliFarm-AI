import express from "express";
import { body } from "express-validator";

import { addFarm, getFarms, getFarm, updateFarm, deleteFarm } from "../controllers/farmController.js";
import { requireAuth } from "../middleware/auth.js";
import { verifyOwnership } from "../middleware/verifyOwnership.js";
import { csrfProtection } from "../middleware/csrf.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

router.use(requireAuth);
router.use(csrfProtection);

const farmValidation = [
  body("name").isString().trim().isLength({ min: 2, max: 100 }).withMessage("Farm name must be 2-100 characters"),
  body("location").optional({ checkFalsy: true }).isString().trim().isLength({ max: 200 }),
  body("latitude").optional({ checkFalsy: true }).isFloat({ min: -90, max: 90 }),
  body("longitude").optional({ checkFalsy: true }).isFloat({ min: -180, max: 180 }),
  body("crop").isString().trim().isLength({ min: 2, max: 50 }),
  body("cropVariety").optional({ checkFalsy: true }).isString().trim().isLength({ max: 100 }),
  body("soilType").isString().trim().isLength({ min: 2, max: 50 }),
  body("area").isString().trim().isLength({ min: 1, max: 50 }),
  body("sowingDate").isISO8601().withMessage("Sowing date must be a valid date"),
  body("expectedHarvest").optional({ checkFalsy: true }).isISO8601(),
  body("irrigationMethod").optional({ checkFalsy: true }).isString().trim().isLength({ max: 50 }),
  body("notes").optional({ checkFalsy: true }).isString().trim().isLength({ max: 1000 }),
];

router.post("/", farmValidation, validateRequest, addFarm);
router.get("/", getFarms);
router.get("/:id", verifyOwnership("farms"), getFarm);
router.put("/:id", verifyOwnership("farms"), farmValidation, validateRequest, updateFarm);
router.delete("/:id", verifyOwnership("farms"), deleteFarm);

export default router;
