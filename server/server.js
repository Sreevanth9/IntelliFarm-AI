import "dotenv/config";

const requiredEnvVars = [
  "ACCESS_TOKEN_JWT_SECRET",
  "REFRESH_TOKEN_JWT_SECRET",
  "GROQ_API_KEY",
  "OPENWEATHER_API_KEY",
  "SUPABASE_URL"
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar] || process.env[envVar].includes("placeholder")) {
    throw new Error(`CRITICAL STARTUP FAILURE: Missing environment variable "${envVar}"`);
  }
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_KEY) {
  throw new Error('CRITICAL STARTUP FAILURE: Missing environment variable "SUPABASE_SERVICE_ROLE_KEY"');
}

import app from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`IntelliFarm API server running on port ${PORT}`);
});
