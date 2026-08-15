export const SUPPORTED_LANGUAGES = {
  te: { code: "te", name: "Telugu", nativeName: "తెలుగు", label: "Telugu (తెలుగు)" },
  hi: { code: "hi", name: "Hindi", nativeName: "हिन्दी", label: "Hindi (हिन्दी)" },
  ta: { code: "ta", name: "Tamil", nativeName: "தமிழ்", label: "Tamil (தமிழ்)" },
  kn: { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", label: "Kannada (ಕನ್ನಡ)" },
  ml: { code: "ml", name: "Malayalam", nativeName: "മലയാളം", label: "Malayalam (മലയാളം)" },
  bn: { code: "bn", name: "Bengali", nativeName: "বাংলা", label: "Bengali (বাংলা)" },
  en: { code: "en", name: "English", nativeName: "English", label: "English" }
};

const LANG_CODE_ALIASES = {
  "en-in": "en",
  "en-us": "en",
  "te-in": "te",
  "hi-in": "hi",
  "ta-in": "ta",
  "kn-in": "kn",
  "ml-in": "ml",
  "bn-in": "bn",
  english: "en",
  telugu: "te",
  hindi: "hi",
  tamil: "ta",
  kannada: "kn",
  malayalam: "ml",
  bengali: "bn"
};

/**
 * Lightweight local language detector using Unicode script inspection.
 * Zero external network calls or LLM overhead.
 * Handles mixed-language Indian English messages.
 */
export function detectLanguage(text) {
  if (!text || typeof text !== "string") return "en";
  const trimmed = text.trim();
  if (!trimmed) return "en";

  // Unicode ranges for Indic scripts:
  // Telugu: \u0C00-\u0C7F
  if (/[\u0C00-\u0C7F]/.test(trimmed)) return "te";
  // Devanagari (Hindi, Marathi): \u0900-\u097F
  if (/[\u0900-\u097F]/.test(trimmed)) return "hi";
  // Tamil: \u0B80-\u0BFF
  if (/[\u0B80-\u0BFF]/.test(trimmed)) return "ta";
  // Kannada: \u0C80-\u0CFF
  if (/[\u0C80-\u0CFF]/.test(trimmed)) return "kn";
  // Malayalam: \u0D00-\u0D7F
  if (/[\u0D00-\u0D7F]/.test(trimmed)) return "ml";
  // Bengali: \u0980-\u09FF
  if (/[\u0980-\u09FF]/.test(trimmed)) return "bn";

  // Default to English for Latin characters or unrecognized scripts
  return "en";
}

/**
 * Resolves the effective response language.
 * Priority: Current message detected language > Explicit user preference > English fallback.
 */
export function resolveLanguage(currentMessage, preferredLanguage) {
  const detected = detectLanguage(currentMessage);

  const normPref = preferredLanguage
    ? (LANG_CODE_ALIASES[String(preferredLanguage).toLowerCase().trim()] || String(preferredLanguage).toLowerCase().split("-")[0])
    : "en";

  // Priority: Current message detected language > Explicit preferred language > English fallback
  let effectiveLang = "en";
  if (detected) {
    effectiveLang = detected;
  } else if (normPref && SUPPORTED_LANGUAGES[normPref]) {
    effectiveLang = normPref;
  } else {
    effectiveLang = "en";
  }

  // Development logging only (Requirement 8)
  if (process.env.NODE_ENV !== "production") {
    console.log(`[Language] detected=${detected || "none"} preference=${normPref || "none"} response=${effectiveLang}`);
  }

  const langMeta = SUPPORTED_LANGUAGES[effectiveLang] || SUPPORTED_LANGUAGES.en;

  return {
    detected,
    preferred: normPref,
    responseLang: effectiveLang,
    responseLangLabel: langMeta.label,
    responseLangName: langMeta.name
  };
}

export default {
  detectLanguage,
  resolveLanguage,
  SUPPORTED_LANGUAGES
};
