import express from "express";
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

const router = express.Router();

// Apply authentication middleware to all copilot endpoints
router.use(requireAuth);

router.post("/chat", aiLimiter, chatStream);

router.get("/conversations", getConversations);
router.get("/conversations/:id", getConversationMessages);
router.put("/conversations/:id", updateConversation);
router.delete("/conversations/:id", deleteConversation);

router.get("/memories", getMemories);
router.delete("/memories/:id", deleteMemory);

export default router;
