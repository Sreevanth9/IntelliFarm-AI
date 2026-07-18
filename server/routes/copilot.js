import express from "express";
import { body } from "express-validator";

import {
  chatStream,
  getConversations,
  getConversationMessages,
  updateConversation,
  deleteConversation,
  getMemories,
  deleteMemory,
} from "../controllers/copilotController.js";
import { requireAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiters.js";
import { csrfProtection } from "../middleware/csrf.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

// Apply authentication middleware to all copilot endpoints
router.use(requireAuth);
router.use(csrfProtection);

router.post(
  "/chat",
  aiLimiter,
  [
    body("message").isString().trim().isLength({ min: 2, max: 10000 }).withMessage("Message must be 2-10000 characters"),
    body("conversationId").optional().isUUID().withMessage("Valid conversation ID is required"),
    body("attachments").optional().isArray().withMessage("Attachments must be an array"),
  ],
  validateRequest,
  chatStream
);

router.get("/conversations", getConversations);
router.get("/conversations/:id", getConversationMessages);
router.put(
  "/conversations/:id",
  [
    body("title").optional().isString().trim().isLength({ min: 1, max: 200 }).withMessage("Title must be 1-200 characters"),
    body("pinned").optional().isBoolean().withMessage("Pinned must be a boolean"),
    body("favorite").optional().isBoolean().withMessage("Favorite must be a boolean"),
  ],
  validateRequest,
  updateConversation
);
router.delete("/conversations/:id", deleteConversation);

router.get("/memories", getMemories);
router.delete("/memories/:id", deleteMemory);

export default router;
