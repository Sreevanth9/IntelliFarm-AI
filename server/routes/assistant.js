import express from "express";
import { body } from "express-validator";

import {
  getAssistantHistory,
  sendAssistantMessage,
} from "../controllers/assistantController.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { aiLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post(
  "/message",
  optionalAuth,
  aiLimiter,
  [body("message").trim().isLength({ min: 2 }).withMessage("Message is required")],
  validateRequest,
  sendAssistantMessage
);

router.get("/history", requireAuth, getAssistantHistory);

export default router;
