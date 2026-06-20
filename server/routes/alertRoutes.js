import express from "express";
import { getAlerts, getUnreadCount, markRead, markAllRead } from "../controllers/alertController.js";
import { requireAuth } from "../middleware/auth.js";
import { verifyOwnership } from "../middleware/verifyOwnership.js";

const routes = express.Router();

routes.use(requireAuth);

routes.get("/", getAlerts);
routes.get("/unread-count", getUnreadCount);
routes.post("/read", verifyOwnership("alerts"), markRead);
routes.post("/read-all", markAllRead);

export default routes;
