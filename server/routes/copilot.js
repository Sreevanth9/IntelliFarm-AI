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
    body("message")
      .isString()
      .trim()
      .custom((value, { req }) => {
        const hasAttachments = Array.isArray(req.body.attachments) && req.body.attachments.length > 0;
        if (!value && !hasAttachments) {
          throw new Error("Message or attachment is required");
        }
        if (value && value.length > 10000) {
          throw new Error("Message cannot exceed 10000 characters");
        }
        return true;
      }),
    body("conversationId").optional({ checkFalsy: true, nullable: true }).isUUID().withMessage("Valid conversation ID is required"),
    body("attachments").optional({ checkFalsy: true, nullable: true }).isArray().withMessage("Attachments must be an array"),
    body("language").optional({ checkFalsy: true, nullable: true }).isString().trim(),
  ],
  validateRequest,
  chatStream
);

router.get("/conversations", getConversations);
router.get("/conversations/:id", getConversationMessages);
router.put(
  "/conversations/:id",
  [
    body("title").optional({ checkFalsy: true, nullable: true }).isString().trim().isLength({ min: 1, max: 200 }).withMessage("Title must be 1-200 characters"),
    body("pinned").optional({ nullable: true }).isBoolean().withMessage("Pinned must be a boolean"),
    body("favorite").optional({ nullable: true }).isBoolean().withMessage("Favorite must be a boolean"),
  ],
  validateRequest,
  updateConversation
);
router.delete("/conversations/:id", deleteConversation);

router.get("/memories", getMemories);
router.delete("/memories/:id", deleteMemory);

export default router;
