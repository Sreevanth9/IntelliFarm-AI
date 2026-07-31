/**
 * DiseaseReportFormatter
 * 
 * Converts the raw detectCropDisease() return object into:
 *   1. markdown  – concise summary streamed as SSE content (the card carries all detail)
 *   2. card      – structured uiCard { type: "diagnosis", version: 1, data: {...} }
 *
 * If the AI service ever changes its return schema, only this file
 * needs updating — ChatEngine stays untouched.
 */
class DiseaseReportFormatter {

  /**
   * @param {Object} result - Raw return value from detectCropDisease()
   * @returns {{ markdown: string, card: Object|null }}
   */
  format(result) {
    if (!result) {
      return { markdown: "", card: null };
    }

    // ── Invalid / non-leaf image ──────────────────────────────
    if (result.status === "invalid") {
      return {
        markdown: `⚠️ **Non-Crop Leaf Image Detected**\n\n${result.suggestion || result.reason || "The uploaded image does not appear to be a plant leaf. Please upload a clear photo of your crop leaf for diagnosis."}`,
        card: null
      };
    }

    // ── Successful diagnosis ─────────────────────────────────
    const cropName = this._extractCropName(result);
    const diseaseName = result.diagnosis?.disease || "Unknown";
    const confidence = result.diagnosis?.confidence || result.confidence || 90;
    const isHealthy = diseaseName === "Healthy";
    const severity = isHealthy ? "Healthy" : (result.severity || "Moderate");

    // Build structured card data
    const cardData = {
      crop: cropName,
      disease: diseaseName,
      confidence,
      isHealthy,
      severity,
      summary: result.summary || "Analysis complete.",
      weatherRisk: result.weatherRisk || null,
      treatmentOrganic: result.treatmentOrganic || [],
      treatmentChemical: result.treatmentChemical || [],
      prevention: result.prevention || [],
      expectedRecovery: result.expectedRecovery || null
    };

    // Concise markdown — the card carries all the structured detail
    const markdown = this._buildSummary(cardData);

    return {
      markdown,
      card: { type: "diagnosis", version: 1, data: cardData }
    };
  }

  // ── Private helpers ────────────────────────────────────────

  _extractCropName(result) {
    if (!result.crop) return "Crop Leaf";
    if (typeof result.crop === "string") return result.crop;
    if (typeof result.crop === "object") return result.crop.name || "Crop Leaf";
    return "Crop Leaf";
  }

  _buildSummary(d) {
    const statusLine = d.isHealthy
      ? "**Healthy ✅**"
      : `**${d.disease}** detected (${d.severity}, ${d.confidence}% confidence)`;

    return `I've analyzed your **${d.crop}** leaf image.\n\n${statusLine} — ${d.summary}\n\nSee the detailed diagnosis below.`;
  }
}

export default new DiseaseReportFormatter();
