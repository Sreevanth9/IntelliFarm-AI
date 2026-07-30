// PII and Sensitive Credential Sanitizer Utility

export const sanitizePiiAndSecrets = (input) => {
  if (!input) return input;

  if (typeof input === "object") {
    try {
      const str = JSON.stringify(input);
      const sanitizedStr = sanitizePiiAndSecrets(str);
      return JSON.parse(sanitizedStr);
    } catch (e) {
      return input;
    }
  }

  if (typeof input !== "string") return input;

  let text = input;

  // 1. Redact Secret API Keys / Tokens
  text = text.replace(/gsk_[a-zA-Z0-9_]{20,}/g, "[REDACTED_GROQ_KEY]");
  text = text.replace(/sk-[a-zA-Z0-9_]{20,}/g, "[REDACTED_OPENAI_KEY]");
  text = text.replace(/sb_publishable_[a-zA-Z0-9_]{20,}/g, "[REDACTED_SUPABASE_KEY]");
  text = text.replace(/eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, "[REDACTED_JWT_TOKEN]");

  // 2. Redact Email Addresses
  text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[REDACTED_EMAIL]");

  // 3. Redact Phone Numbers (Indian / International formats)
  text = text.replace(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,5}\)?[\s-]?\d{3,5}[\s-]?\d{3,5}\b/g, "[REDACTED_PHONE]");

  // 4. Redact Credit Card / Aadhaar / National ID numbers (12 to 16 digit numbers)
  text = text.replace(/\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}(?:[-.\s]?\d{4})?\b/g, "[REDACTED_ID_NUMBER]");

  return text;
};

export default sanitizePiiAndSecrets;
