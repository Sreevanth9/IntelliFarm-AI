import express from "express";
import { addFarm, getFarms, deleteFarm } from "../controllers/farmController.js";
import { requireAuth } from "../middleware/auth.js";
import { verifyOwnership } from "../middleware/verifyOwnership.js";

const router = express.Router();

router.use(requireAuth);

router.post("/", addFarm);
router.get("/", getFarms);
router.delete("/:id", verifyOwnership("farms"), deleteFarm);

export default router;
