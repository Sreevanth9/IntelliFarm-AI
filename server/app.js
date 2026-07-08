import express from "express";
import requestIp from "request-ip";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import assistantRoutes from "./routes/assistant.js";
import authRoutes from "./routes/auth.js";
import cropRoutes from "./routes/cropRoutes.js";
import farmRoutes from "./routes/farmRoutes.js";
import profileRoutes from "./routes/profile.js";
import publicRoutes from "./routes/public.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { sanitizeBody } from "./middleware/sanitizeInput.js";

const app = express();
app.set("trust proxy", 1);
const originUrl = process.env.CLIENT_REDIRECT_URL || "http://localhost:3000";

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(sanitizeBody);
app.use(cookieParser());
app.use(requestIp.mw());
app.use(
  cors({
    origin: originUrl,
    optionsSuccessStatus: 200,
    credentials: true,
  })
);

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "IntelliFarm API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/farms", farmRoutes);

app.use("/gemini", publicRoutes);

app.use(errorHandler);

export default app;
