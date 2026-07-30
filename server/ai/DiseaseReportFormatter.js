/**
 * DiseaseReportFormatter
 * 
 * Converts the raw detectCropDisease() return object into:
 *   1. markdown  – streamed as SSE content for inline display
 *   2. card      – structured uiCard { type: "diagnosis", data: {...} }
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

    // Build concise markdown (the card will carry the detail)
    const markdown = this._buildMarkdown(cardData);

    return {
      markdown,
      card: { type: "diagnosis", data: cardData }
    };
  }

  // ── Private helpers ────────────────────────────────────────

  _extractCropName(result) {
    if (!result.crop) return "Crop Leaf";
    if (typeof result.crop === "string") return result.crop;
    if (typeof result.crop === "object") return result.crop.name || "Crop Leaf";
    return "Crop Leaf";
  }

  _buildMarkdown(d) {
    const statusLine = d.isHealthy
      ? "Healthy ✅"
      : `Diseased — ${d.disease}`;

    let md = `### 🌿 Spryzen AI Crop Health Diagnostic Report\n\n`;
    md += `**Crop**: ${d.crop}  \n`;
    md += `**Status**: ${statusLine}  \n`;
    md += `**Severity**: ${d.severity} (${d.confidence}% confidence)\n\n`;
    md += `#### 📝 Observations\n${d.summary}\n`;

    if (d.weatherRisk) {
      md += `\n#### 🌦 Weather Risk\n${d.weatherRisk}\n`;
    }

    if (d.treatmentOrganic.length > 0) {
      md += `\n#### 🌱 Organic Treatment\n${d.treatmentOrganic.map(t => `- ${t}`).join("\n")}\n`;
    }

    if (d.treatmentChemical.length > 0) {
      md += `\n#### 🧪 Chemical Treatment\n${d.treatmentChemical.map(t => `- ${t}`).join("\n")}\n`;
    }

    if (d.prevention.length > 0) {
      md += `\n#### 🛡 Prevention\n${d.prevention.map(p => `- ${p}`).join("\n")}\n`;
    }

    if (d.expectedRecovery) {
      md += `\n#### ⏱ Expected Recovery\n${d.expectedRecovery}\n`;
    }

    return md;
  }
}

export default new DiseaseReportFormatter();
