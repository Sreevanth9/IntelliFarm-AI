import "./config/loadEnv.js";


const requiredEnvVars = [
  "ACCESS_TOKEN_JWT_SECRET",
  "REFRESH_TOKEN_JWT_SECRET",
  "GROQ_API_KEY",
  "OPENWEATHER_API_KEY"
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar] || process.env[envVar].includes("placeholder")) {
    throw new Error(`CRITICAL STARTUP FAILURE: Missing environment variable "${envVar}"`);
  }
}

import app from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`IntelliFarm API server running on port ${PORT}`);
});
