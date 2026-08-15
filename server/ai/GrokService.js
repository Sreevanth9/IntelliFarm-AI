import Groq from "groq-sdk";
import "dotenv/config";

// Prompt injection guardrail
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

// Redact sensitive tokens and configuration details from AI output
const redactSecrets = (text) => {
  if (typeof text !== "string") return text;
  let redacted = text;
  redacted = redacted.replace(/gsk_[a-zA-Z0-9_]{30,}/g, "[REDACTED_API_KEY]");
  redacted = redacted.replace(/sb_publishable_[a-zA-Z0-9_]{30,}/g, "[REDACTED_ANON_KEY]");
  redacted = redacted.replace(/jwt_secret_[a-zA-Z0-9_]+/gi, "[REDACTED_SECRET]");
  return redacted;
};

class GrokService {
  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GROQ_API_KEY is missing from environment variables.");
    }
    this.groq = new Groq({ apiKey: apiKey || "placeholder" });
    this.defaultModel = "openai/gpt-oss-120b";
    this.fallbackModel = "llama-3.1-8b-instant";
  }

  // Check if messages payload contains image_url multimodal inputs
  hasVisionContent(messages) {
    if (!Array.isArray(messages)) return false;
    return messages.some(msg => {
      if (Array.isArray(msg.content)) {
        return msg.content.some(item => item.type === "image_url");
      }
      return false;
    });
  }

  // SSE Stream Generator
  async getChatStream(messages) {
    const isVision = this.hasVisionContent(messages);
    const selectedModel = isVision ? "llama-3.2-11b-vision-preview" : this.defaultModel;

    console.log(`[GrokService] MODEL: ${selectedModel} (Multimodal Vision: ${isVision})`);
    console.log("[GrokService] Messages Payload Structure:", JSON.stringify(messages, null, 2));

    try {
      const response = await this.groq.chat.completions.create({
        model: selectedModel,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      });
      console.log("[GrokService] STREAM CREATED successfully for model:", selectedModel);
      return response;
    } catch (error) {
      console.error("========== GROQ PRIMARY MODEL ERROR ==========");
      console.error("Model:", selectedModel);
      console.error("Error Message:", error?.message);
      console.error("Error Status:", error?.status);
      console.error("Error Response Data:", error?.response?.data || error?.error || error);
      console.error("===============================================");

      const fallback = isVision ? "llama-3.2-90b-vision-preview" : this.fallbackModel;
      console.log(`[GrokService] Attempting fallback model: ${fallback}...`);

      try {
        const fallbackResponse = await this.groq.chat.completions.create({
          model: fallback,
          messages,
          stream: true,
          temperature: 0.7,
          max_tokens: 2048,
        });
        console.log("[GrokService] FALLBACK STREAM CREATED successfully for model:", fallback);
        return fallbackResponse;
      } catch (fallbackErr) {
        console.error("========== GROQ FALLBACK MODEL ERROR ==========");
        console.error("Model:", fallback);
        console.error("Fallback Error Message:", fallbackErr?.message);
        console.error("Fallback Error Status:", fallbackErr?.status);
        console.error("===============================================");

        if (isVision) {
          console.log("[GrokService] Vision models unavailable. Gracefully falling back to text model openai/gpt-oss-120b...");
          const textOnlyMessages = messages.map(msg => {
            if (Array.isArray(msg.content)) {
              const textPart = msg.content.find(item => item.type === "text")?.text || "";
              return { role: msg.role, content: textPart };
            }
            return msg;
          });

          return await this.groq.chat.completions.create({
            model: this.defaultModel,
            messages: textOnlyMessages,
            stream: true,
            temperature: 0.7,
            max_tokens: 2048,
          });
        }

        throw fallbackErr;
      }
    }
  }

  // Non-streaming chat completion
  async getChatCompletion(messages) {
    try {
      const response = await this.groq.chat.completions.create({
        model: this.defaultModel,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      });
      return redactSecrets(response.choices[0].message.content);
    } catch (error) {
      console.error("Grok primary model completion error, trying fallback model:", error.message);
      const response = await this.groq.chat.completions.create({
        model: this.fallbackModel,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      });
      return redactSecrets(response.choices[0].message.content);
    }
  }

  securityCheck(text) {
    return containsJailbreak(text);
  }

  redact(text) {
    return redactSecrets(text);
  }
}

export default new GrokService();
