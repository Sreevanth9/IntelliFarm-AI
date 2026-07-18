import dotenv from "dotenv";
dotenv.config();
import { detectCropDisease } from "./services/aiService.js";

// 1x1 transparent pixel base64 as test image
const dummyBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAIElEQVR4AezQoQ0AAADCMML/R/MBQSA3PVVrjLFC/XkCAAD//3Nn3qIAAAAGSURBVAMAEzgAFbNrw9wAAAAASUVORK5CYII=";

async function main() {
  try {
    console.log("Testing disease detection service (Qwen2.5-VL-72B-Instruct)...");
    
    // Call the detectCropDisease service function
    const result = await detectCropDisease({ base64Image: dummyBase64 });
    
    console.log("Result:", JSON.stringify(result, null, 2));
    if (result.status === "invalid") {
      console.log("✅ Success! The service successfully validated that the 1x1 pixel image is not a valid crop leaf.");
    } else {
      console.log("❌ Unexpected status:", result.status);
    }
  } catch (error) {
    console.error("Test failed:", error.message, error.stack);
  }
}

main();
