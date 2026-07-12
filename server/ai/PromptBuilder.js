class PromptBuilder {
  constructor() {
    this.systemPrompt = `You are IntelliFarm Copilot, a premium, context-aware agricultural AI assistant.
Always adhere to the following formatting and structural rules:

1. RESPONSE FORMATTING:
   - Use rich Markdown elements: clear levels of headings (e.g., # Title, ## Section, ### Sub-section).
   - Use bullet points, bold emphasis, and numbered lists to structure farming guidelines.
   - Use markdown tables to compare crops, fertilizer schedules, or soil parameters.
   - Inject relevant emojis (e.g., 🌱, 🌾, ⛈, 🥦, 🚜, 📈) at the start of headings and bullet points for high visual appeal.
   - Avoid long walls of text. Keep paragraphs to 2-3 sentences.

2. CONTEXT INTEGRATION:
   - Carefully read the "CRITICAL FARM CONTEXT" (Farm size, Crop, Soil Type, Local Weather, Disease guides, and memories).
   - Do NOT output generic responses. Always mention specific local factors: e.g., "Based on your clay soil in Hyderabad..." or "Since you mentioned having 12 acres of tomato crops...".
   - Seamlessly blend weather temperatures and humidity alerts into actionable farming advice.

3. RECOMMENDATIONS & ACTION STEPS:
   - When giving crop selections, sowing guidelines, or treatment instructions, always end your discussion with a section starting with exactly one of these headings:
     ## Recommendation
     OR
     ## Next Steps
     OR
     ## Action Steps
   - Under this heading, provide a concise summary of the primary recommendation and actionable next steps.

4. FOLLOW-UP SUGGESTIONS BLOCK:
   - At the very end of your response, you MUST append a single line containing exactly 3 follow-up question suggestions for the farmer, formatted exactly as follows:
     [SUGGESTIONS: ["Question 1 text?", "Question 2 text?", "Question 3 text?"]]
   - These suggestions must be dynamic and relevant to the current conversation (e.g., if talking about cotton, suggest fertilizer advice, disease identification, or Mandi price updates). Do not output generic questions.`;
  }

  build(params) {
    const {
      farmProfile = null,
      weatherContext = null,
      diseaseContext = null,
      memories = [],
      history = [],
      currentMessage = ""
    } = params;

    const messages = [];

    // 1. Add base system prompt
    messages.push({
      role: "system",
      content: this.systemPrompt
    });

    // 2. Build Context String
    let contextStr = "CRITICAL FARM CONTEXT:\n";

    if (farmProfile) {
      contextStr += `- Active Farm: "${farmProfile.name}" (Crop: ${farmProfile.crop}, Soil Type: ${farmProfile.soilType}, Size: ${farmProfile.area}, Sowing Date: ${farmProfile.sowingDate})\n`;
      if (farmProfile.location) {
        contextStr += `- Location: ${farmProfile.location}\n`;
      }
    }

    if (weatherContext) {
      contextStr += `- Local Weather & Forecast: ${JSON.stringify(weatherContext)}\n`;
    }

    if (diseaseContext) {
      contextStr += `- Disease Incidents/Reports: ${JSON.stringify(diseaseContext)}\n`;
    }

    if (memories && memories.length > 0) {
      contextStr += `- Extracted Farmer Preferences & Notes:\n`;
      memories.forEach((mem, index) => {
        contextStr += `  * [${mem.type}] ${mem.content}\n`;
      });
    }

    if (contextStr !== "CRITICAL FARM CONTEXT:\n") {
      messages.push({
        role: "system",
        content: contextStr + "\nPlease tailor your responses based on the details above, prioritizing the active farm's crop, soil, and local weather patterns. Do not mention the context data structure explicitly; integrate it naturally."
      });
    }

    // 3. Add History
    // Expected format: { role: 'user' | 'assistant', content: string }
    for (const msg of history) {
      messages.push({
        role: msg.role === "assistant" || msg.role === "model" ? "assistant" : "user",
        content: msg.content
      });
    }

    // 4. Add Current Message
    messages.push({
      role: "user",
      content: currentMessage
    });

    return messages;
  }
}

export default new PromptBuilder();
