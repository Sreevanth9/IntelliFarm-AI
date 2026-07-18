import express from "express";
import { body } from "express-validator";

import { getMe, login, logout, register, oauthLogin, changePassword, refreshSession, getCsrfToken, verifyEmail, forgotPassword, resetPassword } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { loginLimiter, oauthLimiter, registerLimiter, resetLimiter } from "../middleware/rateLimiters.js";
import { csrfProtection } from "../middleware/csrf.js";

const routes = express.Router();

routes.post("/log-error", (req, res) => {
  console.error("=== CLIENT OAUTH SYNC ERROR LOG ===");
  console.error(JSON.stringify(req.body, null, 2));
  console.error("====================================");
  res.status(200).json({ success: true });
});

routes.post(
  "/register",
  registerLimiter,
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 12, max: 128 }).withMessage("Password must be 12 to 128 characters"),
  ],
  validateRequest,
  register
);

routes.post(
  "/login",
  loginLimiter,
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isString().isLength({ min: 1, max: 128 }).withMessage("Password is required"),
  ],
  validateRequest,
  login
);

routes.get("/csrf", getCsrfToken);
routes.post("/oauth-login", oauthLimiter, csrfProtection, [
  body("accessToken").isString().isLength({ min: 20, max: 4096 }).withMessage("OAuth session is required"),
], validateRequest, oauthLogin);
routes.post("/refresh", csrfProtection, refreshSession);
routes.post("/change-password", requireAuth, csrfProtection, [
  body("oldPassword").isString().isLength({ min: 1, max: 128 }),
  body("newPassword").isString().isLength({ min: 12, max: 128 }),
], validateRequest, changePassword);

routes.post(
  "/verify-email",
  resetLimiter,
  [
    body("token").isString().trim().isLength({ min: 10, max: 256 }).withMessage("Valid token is required"),
  ],
  validateRequest,
  verifyEmail
);

routes.post(
  "/forgot-password",
  resetLimiter,
  [
    body("email").isEmail().withMessage("Valid email is required"),
  ],
  validateRequest,
  forgotPassword
);

routes.post(
  "/reset-password",
  resetLimiter,
  [
    body("token").isString().trim().isLength({ min: 10, max: 256 }).withMessage("Valid token is required"),
    body("password").isString().isLength({ min: 12, max: 128 }).withMessage("Password must be 12 to 128 characters"),
  ],
  validateRequest,
  resetPassword
);

routes.get("/me", requireAuth, getMe);
routes.post("/logout", requireAuth, csrfProtection, logout);

export default routes;
