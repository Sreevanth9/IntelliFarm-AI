import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load server/.env first
dotenv.config({ path: path.resolve(__dirname, "../.env") });
// Fallback to current working directory .env
dotenv.config();
