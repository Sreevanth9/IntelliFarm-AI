import express from "express";
import { body } from "express-validator";

import { getMe, login, logout, register, oauthLogin, changePassword } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { loginLimiter, registerLimiter } from "../middleware/rateLimiters.js";

const routes = express.Router();

routes.post(
  "/register",
  registerLimiter,
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validateRequest,
  register
);

routes.post(
  "/login",
  loginLimiter,
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  login
);

routes.post("/oauth-login", loginLimiter, oauthLogin);
routes.post("/change-password", requireAuth, changePassword);

routes.get("/me", requireAuth, getMe);
routes.post("/logout", logout);

export default routes;
