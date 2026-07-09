import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// Rate limiters for abuse prevention

// Login Limiter: 5 attempts per 15 minutes per IP + Email
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts. Please wait 15 minutes before trying again."
  },
  keyGenerator: (req) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || "127.0.0.1";
    const email = req.body?.email ? String(req.body.email).toLowerCase().trim() : "anonymous";
    return `${ipKeyGenerator(ip)}-${email}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration Limiter: 3 requests per hour
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Registration limit exceeded. You can only create 3 accounts per hour."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password Reset Limiter: 3 requests per hour
export const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Password reset limit exceeded. Please try again in an hour."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI Chat messages Limiter: 10 requests per minute
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "AI request limit exceeded. Please wait one minute before asking again."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Image Upload Limiter: 20 uploads per hour
export const imageUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Image upload limit exceeded. Please try again in an hour."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
