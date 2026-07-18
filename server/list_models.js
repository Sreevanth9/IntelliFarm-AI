import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error("GROQ_API_KEY not found in process.env");
  process.exit(1);
}

const groq = new Groq({ apiKey });

async function main() {
  try {
    const list = await groq.models.list();
    const models = list.data.map(m => ({ id: m.id }));
    console.log("Groq Models:", JSON.stringify(models, null, 2));
  } catch (error) {
    console.error("Error fetching models:", error.message);
  }
}

main();
