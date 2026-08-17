import express from "express";
import requestIp from "request-ip";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import authRoutes from "./routes/auth.js";
import cropRoutes from "./routes/cropRoutes.js";
import farmRoutes from "./routes/farmRoutes.js";
import profileRoutes from "./routes/profile.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import copilotRoutes from "./routes/copilot.js";
import supportRoutes from "./routes/supportRoutes.js";
import awsRoutes from "./routes/awsRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { sanitizeBody } from "./middleware/sanitizeInput.js";
import { allowedOrigins } from "./config/security.js";
import { generalApiLimiter } from "./middleware/rateLimiters.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);

// Hardened Helmet configuration to enforce HSTS and define CSP directives allowing Supabase, AWS, and postal connections
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: [
          "'self'",
          "https://pkfdbgwavkblnzabdpmd.supabase.co",
          "https://api.postalpincode.in",
          "https://*.amazonaws.com",
          "https://*.s3.amazonaws.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://api.dicebear.com",
          "https://pkfdbgwavkblnzabdpmd.supabase.co",
          "https://*.supabase.co",
          "https://*.amazonaws.com",
          "https://*.s3.amazonaws.com",
        ],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
  })
);
app.use(generalApiLimiter);
app.use(express.json({ limit: "7mb" }));
app.use(sanitizeBody);
app.use(cookieParser());
app.use(requestIp.mw());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      const error = new Error("Origin is not allowed");
      error.statusCode = 403;
      return callback(error);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token"],
    optionsSuccessStatus: 204,
    maxAge: 600,
    credentials: true,
  })
);

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientBuildPath = path.resolve(__dirname, "../client/build");

// Serve static React build files
app.use(express.static(clientBuildPath));

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "IntelliFarm API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/farms", farmRoutes);
app.use("/api/copilot", copilotRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/aws", awsRoutes);

// SPA fallback: any non-API route serves the React app
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

app.use(errorHandler);

export default app;

