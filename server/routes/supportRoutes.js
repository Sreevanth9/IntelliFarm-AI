import express from "express";
import { body } from "express-validator";
import { sendSupportMessage } from "../controllers/supportController.js";
import { requireAuth } from "../middleware/auth.js";
import { csrfProtection } from "../middleware/csrf.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = express.Router();

router.use(csrfProtection);

router.post(
  "/send",
  requireAuth,
  [
    body("message").isString().trim().isLength({ min: 3, max: 10000 }).withMessage("Message must be 3-10000 characters"),
    body("type").optional().isString().trim().isLength({ max: 100 }),
    body("subject").optional().isString().trim().isLength({ max: 200 }),
  ],
  validateRequest,
  sendSupportMessage
);

export default router;
