import express from "express";

const router = express.Router();

import {
  getAssistantHome,
  postAssistantChat,
  getChatHistory,
  postChat,
  deleteChatHistory,
  updateLocation,
} from "../controllers/public.js";
import { authMiddleware } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiters.js";

router.get("/api", getAssistantHome);
router.post("/api/chat", authMiddleware, aiLimiter, postAssistantChat);
router.get("/api/getchathistory", authMiddleware, getChatHistory);
router.post("/api/chatdata", authMiddleware, postChat);
router.delete("/api/chathistory/:id", authMiddleware, deleteChatHistory);
router.put("/api/updatelocation", authMiddleware, updateLocation);

export default router;
