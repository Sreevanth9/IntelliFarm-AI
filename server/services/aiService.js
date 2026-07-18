import Groq from "groq-sdk";
import OpenAI from "openai";
import "dotenv/config";
import { supabase } from "../config/supabase.js";
import { logSecurityEvent } from "../utils/securityLogger.js";

// AI Security Helper: Jailbreak/System extraction detector
const containsJailbreak = (text) => {
  if (!text) return false;
  const lowercase = text.toLowerCase();
  const jailbreakPatterns = [
    "ignore previous instructions",
    "ignore system prompt",
    "jailbreak",
    "system rules",
    "ignore rules",
    "reveal your prompt",
    "system prompt extraction",
    "expose prompt",
    "forget system guidelines"
  ];
  return jailbreakPatterns.some(pattern => lowercase.includes(pattern));
};

// AI Security Helper: Redact sensitive tokens and configuration details from AI output
const redactSecrets = (text) => {
  if (typeof text !== "string") return text;
  
  let redacted = text;
  
  // Redact Groq keys
  redacted = redacted.replace(/gsk_[a-zA-Z0-9_]{30,}/g, "[REDACTED_API_KEY]");
  // Redact Supabase keys
  redacted = redacted.replace(/sb_publishable_[a-zA-Z0-9_]{30,}/g, "[REDACTED_ANON_KEY]");
  // Redact JWT passwords/secrets
  redacted = redacted.replace(/jwt_secret_[a-zA-Z0-9_]+/gi, "[REDACTED_SECRET]");
  
  return redacted;
};

export const askAI = async ({ prompt, history = [], userId = null }) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const error = new Error("Groq API key is missing");
    error.statusCode = 500;
    throw error;
  }

  // Enforce prompt injection guardrail
  if (containsJailbreak(prompt)) {
    await logSecurityEvent({
      eventType: "AI_PROMPT_INJECTION_ATTEMPT",
      userId,
      ipAddress: "0.0.0.0",
      endpoint: "/api/assistant/message",
      details: { prompt, reason: "Jailbreak signature matched" }
    });

    try {
      await supabase.from("ai_audit_logs").insert({
        user_id: userId,
        prompt,
        response: "[REJECTED: Jailbreak attempt detected]",
        is_flagged: true,
        flagged_reason: "Jailbreak signature matched"
      });
    } catch (err) {
      console.error("AI Audit Log save failed:", err.message);
    }

    return "I am sorry, but I cannot assist with inputs that attempt to bypass my safety and system guidelines.";
  }

  const groq = new Groq({ apiKey });

  const messages = [
    {
      role: "system",
      content:
        `You are IntelliFarm AI, an expert AI assistant for farmers.
Style:
- Respond naturally like ChatGPT.
- Never produce large walls of text.
- Use Markdown formatting.
- Use headings.
- Use bullet points.
- Use numbered lists when explaining steps.
- Use emojis only where they improve readability (🌾🌧💧📈⚠️✅).
- Keep paragraphs under three lines.
- Highlight important values using bold.
- Use tables whenever comparing crops, fertilizers, or market prices.
- Always give a short recommendation section at the end.
- Ask follow-up questions only if required.
- Never say "Based on our previous conversation" unless the information exists in the current conversation.
- Never sound robotic or overly formal.
- Prefer concise, practical advice over lengthy explanations.
- Never explain your internal reasoning process.
- Support callout formatting by prefixing with emojis:
  🟢 Recommended
  [Recommendation contents]
  🟡 Warning
  [Warning contents]
  🔴 Avoid
  [Avoid contents]`,
    },
    {
      role: "assistant",
      content: "I am IntelliFarm AI, ready to provide practical agriculture guidance.",
    },
  ];

  for (const entry of history) {
    let content = "";
    if (typeof entry.parts === "string") {
      content = entry.parts;
    } else if (Array.isArray(entry.parts)) {
      content = entry.parts.map(p => typeof p === "string" ? p : (p.text || "")).join("\n");
    } else if (entry.message) {
      if (entry.message.user) {
        messages.push({ role: "user", content: entry.message.user });
      }
      if (entry.message.gemini || entry.message.groq) {
        messages.push({ role: "assistant", content: entry.message.gemini || entry.message.groq });
      }
      continue;
    } else if (entry.content) {
      content = entry.content;
    }

    const role = entry.role === "model" || entry.role === "assistant" ? "assistant" : "user";
    messages.push({ role, content });
  }

  messages.push({ role: "user", content: prompt });

  const completion = await groq.chat.completions.create({
    messages,
    model: "llama-3.3-70b-versatile",
  });

  const rawAnswer = completion.choices[0].message.content;
  const sanitizedAnswer = redactSecrets(rawAnswer);

  // Archive audit log entry
  try {
    await supabase.from("ai_audit_logs").insert({
      user_id: userId,
      prompt,
      response: sanitizedAnswer,
      is_flagged: false
    });
  } catch (err) {
    console.error("AI Audit Log save failed:", err.message);
  }

  return sanitizedAnswer;
};

export const detectCropDisease = async ({ base64Image }) => {
  console.log("[HF VISION PIPELINE]: Initializing...");
  
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    console.error("[HF VISION PIPELINE ERROR]: HF_TOKEN environment variable is not defined!");
    const error = new Error("Hugging Face access token is missing on the server.");
    error.statusCode = 500;
    throw error;
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    console.error("[GROQ RECS PIPELINE ERROR]: GROQ_API_KEY environment variable is not defined!");
    const error = new Error("Groq API key is missing on the server.");
    error.statusCode = 500;
    throw error;
  }

  const openai = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: hfToken,
  });

  const groq = new Groq({ apiKey: groqApiKey });

  // Phase 1: Call vision model to validate image, identify crop and disease
  console.log("[HF VISION PHASE 1]: Calling Qwen/Qwen2.5-VL-72B-Instruct:featherless-ai...");
  let visionResponse;
  try {
    visionResponse = await openai.chat.completions.create({
      model: "Qwen/Qwen2.5-VL-72B-Instruct:featherless-ai",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an agricultural plant pathologist.

Determine whether this is a crop leaf.

If it is not a crop leaf:

{
  "isLeaf": false,
  "reasoning": "Explain why this is not a crop leaf (e.g., 'The image is of a dog, not a plant leaf.')"
}

Otherwise return ONLY valid JSON.

{
  "isLeaf": true,
  "crop": "Crop name (e.g., Tomato, Rice, Maize, etc.)",
  "disease": "Disease name (e.g., Early Blight, Blast, etc.)",
  "healthy": false,
  "confidence": 95.0,
  "severity": "Mild|Moderate|Severe|Healthy",
  "reasoning": "Reasoning for the crop and disease identification"
}

Do not include markdown.
Do not include explanations outside the JSON.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });
  } catch (err) {
    console.error("[HF VISION PHASE 1 FAILED]: API invocation crashed:", err.message, err.stack);
    const error = new Error(`Hugging Face Qwen2.5-VL API failed: ${err.message}`);
    error.statusCode = 502;
    throw error;
  }

  const visionContent = visionResponse.choices[0].message.content;
  console.log("[HF VISION PHASE 1 RAW RESPONSE]:", visionContent);

  let visionResult;
  try {
    const jsonMatch = visionContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in response");
    }
    visionResult = JSON.parse(jsonMatch[0]);
    console.log("[HF VISION PHASE 1 PARSED]:", JSON.stringify(visionResult, null, 2));
  } catch (err) {
    console.error("[HF VISION PHASE 1 PARSED FAILED]: JSON parse exception:", err.message);
    const error = new Error(`Failed to parse vision model response JSON: ${err.message}`);
    error.statusCode = 500;
    throw error;
  }

  // If vision validation failed, return the invalid state
  if (!visionResult.isLeaf) {
    console.log("[HF VISION PHASE 1 VALIDATION]: Leaf validation failed");
    return {
      status: "invalid",
      reason: "No crop leaf detected",
      suggestion: visionResult.reasoning || "Please upload a clear image of a single crop leaf."
    };
  }

  // Phase 2: Call LLM (Spryzen AI) to generate agronomic recommendations
  const crop = visionResult.crop || "Unknown Crop";
  const disease = visionResult.healthy ? "Healthy" : (visionResult.disease || "Unknown Condition");
  const status = visionResult.healthy ? "healthy" : "diseased";
  const diseaseConfidence = visionResult.confidence || 95;
  const isHealthy = status === "healthy";
  const severity = isHealthy ? "Healthy" : (visionResult.severity || (diseaseConfidence > 85 ? "Severe" : "Moderate"));

  const spryzenPrompt = `You are Spryzen AI, a senior agronomist and plant doctor.
Generate a structured agronomic diagnosis report based on the following vision model analysis of a farmer's crop image:
- Crop: ${crop}
- Disease: ${disease}
- Status: ${status}
- Vision Confidence: ${diseaseConfidence}%
- Severity Estimation: ${severity} (Select one: "Healthy", "Mild", "Moderate", "Severe")

Guidelines:
- Explain the symptoms or summary of this condition in a professional, farmer-friendly manner. Keep paragraphs short (under 3 lines).
- Provide a list of organic/biological treatment methods, and a list of chemical treatment methods.
- Provide a list of preventative actions for future crop cycles.
- Include a specific weather risk warning (e.g., how humidity or temperature impacts the spread of this condition).
- Estimate the expected recovery timeline.

Return the response in a clean, raw JSON format with EXACTLY these keys:
{
  "summary": "...",
  "treatmentOrganic": ["method 1", "method 2", ...],
  "treatmentChemical": ["method 1", "method 2", ...],
  "prevention": ["prevention 1", "prevention 2", ...],
  "weatherRisk": "...",
  "expectedRecovery": "..."
}
Do not write any introductory or concluding text, and do not wrap the response in markdown code blocks. Just return the raw JSON string.`;

  console.log("[GROQ RECS PHASE 2]: Calling llama-3.3-70b-versatile...");
  let spryzenResponse;
  try {
    spryzenResponse = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are Spryzen AI, the plant pathology expert. Always respond in the requested JSON format.",
        },
        {
          role: "user",
          content: spryzenPrompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });
  } catch (err) {
    console.error("[GROQ RECS PHASE 2 FAILED]: API invocation crashed:", err.message, err.stack);
    const error = new Error(`Groq Spryzen AI recommendation API failed: ${err.message}`);
    error.statusCode = 502;
    throw error;
  }

  const spryzenContent = spryzenResponse.choices[0].message.content;
  console.log("[GROQ RECS PHASE 2 RAW RESPONSE]:", spryzenContent);

  let spryzenResult;
  try {
    const jsonMatch = spryzenContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in response");
    }
    spryzenResult = JSON.parse(jsonMatch[0]);
    console.log("[GROQ RECS PHASE 2 PARSED]:", JSON.stringify(spryzenResult, null, 2));
  } catch (err) {
    console.error("[GROQ RECS PHASE 2 PARSED FAILED]: JSON parse exception:", err.message);
    spryzenResult = {
      summary: `Potential ${disease} detected on ${crop}.`,
      treatmentOrganic: ["Apply organic compost or bio-fungicide.", "Prune and dispose of infected leaves safely."],
      treatmentChemical: ["Apply a broad-spectrum fungicide labeled for this crop.", "Follow packet dosage instructions carefully."],
      prevention: ["Avoid overhead watering to keep foliage dry.", "Ensure proper plant spacing for air circulation."],
      weatherRisk: "Rain and high relative humidity can accelerate fungal spore spread.",
      expectedRecovery: "10-14 days with proper intervention."
    };
  }

  // Return the combined report structure
  return {
    status: "success",
    crop: {
      name: crop,
      confidence: visionResult.confidence || 95
    },
    diagnosis: {
      disease: disease,
      confidence: diseaseConfidence
    },
    severity: severity,
    summary: redactSecrets(spryzenResult.summary),
    treatmentOrganic: (spryzenResult.treatmentOrganic || []).map(t => redactSecrets(t)),
    treatmentChemical: (spryzenResult.treatmentChemical || []).map(t => redactSecrets(t)),
    prevention: (spryzenResult.prevention || []).map(p => redactSecrets(p)),
    weatherRisk: redactSecrets(spryzenResult.weatherRisk),
    expectedRecovery: redactSecrets(spryzenResult.expectedRecovery)
  };
};
