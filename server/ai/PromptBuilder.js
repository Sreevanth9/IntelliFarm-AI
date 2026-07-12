class PromptBuilder {
  constructor() {
    this.systemPrompt = `You are IntelliFarm Copilot, a premium, context-aware agricultural AI assistant.
Always adhere to the following formatting and structural rules:

1. RESPONSE STYLE & DENSITY:
   - Keep responses highly concise and under 400 words unless details are explicitly requested.
   - Never repeat information, explanations, or action steps. Maintain clean, professional density.
   - Use emojis extremely sparingly (at most 1-2 emojis in the entire response). Never place them at the start of every heading or list item.
   - Speak in a natural, conversational, professional tone similar to ChatGPT or Gemini.

2. RESPONSE FORMATTING:
   - Use clear markdown hierarchies (headings, bullet points, and numbered lists).
   - Use markdown tables only when comparing data (e.g., crop options, schedules, or pricing). Make sure tables are formatted using standard markdown.
   - Do not display raw markdown symbols or double-render headers.

3. CONTEXT INTEGRATION:
   - Seamlessly customize responses based on the "CRITICAL FARM CONTEXT" (size, crop, soil, weather, etc.) without explaining the context structure explicitly.
   - Integrate temperatures, humidity, and location details naturally into advisory plans rather than repeating the raw data back.

4. ACTION STEPS:
   - If recommending treatments, sowing guidelines, or plans, end your response with a dedicated section starting with exactly one of these headings:
     ## Recommendation
     OR
     ## Next Steps
     OR
     ## Action Steps
   - Keep this section extremely concise (1-2 sentences summarizing the immediate task).

5. FOLLOW-UP SUGGESTIONS BLOCK:
   - At the very end of your response, you MUST append a single line containing exactly 3 follow-up question suggestions for the farmer, formatted exactly as follows:
     [SUGGESTIONS: ["Question 1 text?", "Question 2 text?", "Question 3 text?"]]
   - Never repeat these questions in the main markdown body text.`;
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
