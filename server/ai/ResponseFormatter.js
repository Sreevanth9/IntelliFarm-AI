class ResponseFormatter {
  format(rawText, toolOutputs = {}) {
    const cleanText = (rawText || "").trim();
    const uiCards = [];

    // Extract weather card metadata if weather tool returned data
    if (toolOutputs.weather) {
      uiCards.push({
        type: "weather",
        data: toolOutputs.weather
      });
    }

    // Extract crop disease card metadata if disease tool matched
    if (toolOutputs.disease && toolOutputs.disease.currentGuide) {
      uiCards.push({
        type: "disease",
        data: toolOutputs.disease.currentGuide
      });
    } else if (toolOutputs.disease && toolOutputs.disease.recentReports?.length > 0 && cleanText.toLowerCase().includes("disease")) {
      uiCards.push({
        type: "disease",
        data: toolOutputs.disease.recentReports[0]
      });
    }

    // Extract market price card if market tool matched
    if (toolOutputs.market) {
      uiCards.push({
        type: "market",
        data: toolOutputs.market
      });
    }

    // Parse suggestions array from assistant's custom marker block
    const sugMatch = cleanText.match(/\[SUGGESTIONS:\s*(\[[\s\S]*?\])\]/i);
    let finalCleanText = cleanText;
    if (sugMatch) {
      try {
        const suggestions = JSON.parse(sugMatch[1]);
        uiCards.push({
          type: "suggestions",
          data: suggestions
        });
        // Remove the SUGGESTIONS token line from cleanText so it isn't rendered in markdown
        finalCleanText = cleanText.replace(/\[SUGGESTIONS:\s*\[[\s\S]*?\]\]/i, "").trim();
      } catch (e) {
        console.warn("Failed to parse AI suggestions token block:", e.message);
      }
    }

    // Parse dynamic recommendation sections from the markdown content itself
    // Only shows recommendation card if the LLM output explicitly contains a recommendation section
    const recMatch = finalCleanText.match(/(?:## Recommendation|### Recommendation|## Next Steps|## Action Steps)\s*\n+([\s\S]+?)(?=\n##|\n#|$)/i);
    if (recMatch) {
      uiCards.push({
        type: "recommendation",
        data: {
          title: "IntelliFarm Advisory Advice",
          details: recMatch[1].trim(),
          actionable: "Apply soil corrections or crop guidelines matching local weather alerts."
        }
      });
    }

    return {
      formattedText: finalCleanText,
      uiCards
    };
  }
}

export default new ResponseFormatter();
