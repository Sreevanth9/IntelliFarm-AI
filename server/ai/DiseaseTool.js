import { supabase } from "../config/supabase.js";

class DiseaseTool {
  async getRecentReports(userId) {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from("disease_reports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data.map(r => ({
        id: r.id,
        diseaseName: r.disease_name,
        symptoms: r.symptoms,
        treatment: r.treatment,
        prevention: r.prevention,
        createdAt: r.created_at
      }));
    } catch (error) {
      console.error("DiseaseTool failed to load recent reports:", error.message);
      return [];
    }
  }

  // Pre-compiled treatment rules for matching crops/diseases from query text
  getDiseaseGuide(queryText) {
    const q = (queryText || "").toLowerCase();
    
    if (q.includes("blast") || q.includes("rice blast") || q.includes("paddy blast")) {
      return {
        disease: "Rice Blast (Fungal)",
        crop: "Rice / Paddy",
        symptoms: "Spindle-shaped lesions on leaves with gray centers, node rotting, neck blast causing empty grains.",
        treatment: "Spray Tricyclazole 75% WP @ 0.6 g/L or Carbendazim @ 1 g/L. Avoid excessive nitrogen applications.",
        organicSolution: "Spray Pseudomonas fluorescens @ 10g/L or fresh cow dung extract (20%). Spacing helps control spread.",
        prevention: "Use disease-free seed, treat seeds with Trichoderma viride, and maintain balanced fertilizer application."
      };
    }
    
    if (q.includes("early blight") || q.includes("tomato blight") || q.includes("blight")) {
      return {
        disease: "Early Blight (Alternaria solani)",
        crop: "Tomato / Potato",
        symptoms: "Target-board spots with concentric rings starting on older leaves. Yellow halos surrounding spots.",
        treatment: "Spray Copper Oxychloride 50% WP @ 2.5 g/L or Mancozeb @ 2 g/L.",
        organicSolution: "Foliar application of Neem oil formulation @ 3-5 ml/L, prune lower leaves touching soil, clean garden debris.",
        prevention: "Practice crop rotation (avoid solanaceous crops in succession), improve drainage, mulch soil beds."
      };
    }

    if (q.includes("rust") || q.includes("leaf rust") || q.includes("coffee rust")) {
      return {
        disease: "Leaf Rust (Fungal)",
        crop: "Wheat / Coffee / Beans",
        symptoms: "Orange-brown powdery pustules on leaves, premature leaf drops, reduced crop vigor.",
        treatment: "Spray Propiconazole 25% EC @ 1 ml/L or Hexaconazole @ 2 ml/L.",
        organicSolution: "Apply sulfur dust or spray baking soda solution with a mild insecticidal soap carrier.",
        prevention: "Plant rust-resistant crop cultivars and control weed hosts around fields."
      };
    }

    return null;
  }
}

export default new DiseaseTool();
