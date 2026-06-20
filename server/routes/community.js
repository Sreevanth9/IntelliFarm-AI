import express from "express";
import { body } from "express-validator";

import {
  addComment,
  createPost,
  getPosts,
  likePost,
} from "../controllers/communityController.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

router.get("/posts", getPosts);
router.post(
  "/posts",
  requireAuth,
  [body("question").trim().isLength({ min: 5 }).withMessage("Post should be at least 5 characters")],
  validateRequest,
  createPost
);
router.post("/posts/:postId/like", likePost);
router.post(
  "/posts/:postId/comments",
  requireAuth,
  [body("text").trim().isLength({ min: 2 }).withMessage("Comment is required")],
  validateRequest,
  addComment
);

export default router;
