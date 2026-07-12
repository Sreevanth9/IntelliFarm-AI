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
    this.defaultModel = "llama-3.3-70b-versatile";
    this.fallbackModel = "llama-3.1-8b-instant";
  }

  // SSE Stream Generator
  async getChatStream(messages) {
    try {
      const response = await this.groq.chat.completions.create({
        model: this.defaultModel,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      });
      return response;
    } catch (error) {
      console.error("Grok primary model stream error, trying fallback model:", error.message);
      // Fallback
      return await this.groq.chat.completions.create({
        model: this.fallbackModel,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      });
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
