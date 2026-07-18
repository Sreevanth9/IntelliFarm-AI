import { supabase } from "../config/supabase.js";
import { askAI, detectCropDisease } from "../services/aiService.js";

const buildPrompt = (task, details = {}) => {
  const boundedDetails = JSON.stringify(details, null, 2).slice(0, 4000);
  return `${task}

Farmer details:
${boundedDetails}

Give practical, farmer-friendly advice. Include crop names, reasons, timing, risks, and next steps where useful.`;
};

const sendAgricultureResponse = async (req, res, next, task) => {
  try {
    const recommendation = await askAI({
      prompt: buildPrompt(task, req.body),
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      recommendation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const cropRecommend = (req, res, next) => {
  sendAgricultureResponse(req, res, next, "Recommend suitable crops");
};

export const fertilizerSuggest = (req, res, next) => {
  sendAgricultureResponse(req, res, next, "Suggest fertilizer plan");
};

export const farmingTips = (req, res, next) => {
  sendAgricultureResponse(req, res, next, "Give farming tips");
};

export const detectDisease = async (req, res, next) => {
  console.log("=== START DISEASE DETECTION PIPELINE ===");
  try {
    const { image, lat, lon } = req.body;
    if (!image) {
      console.warn("[VALIDATION FAILED]: Image missing in body");
      const error = new Error("Crop image is required");
      error.statusCode = 400;
      throw error;
    }

    // Enforce base64 file size limit: 5 MB
    const base64Content = image.includes(",") ? image.split(",")[1] : image;
    const approximateSize = (base64Content.length * 3) / 4;
    console.log(`[FILE DETAILS]: Approx Size: ${(approximateSize / 1024 / 1024).toFixed(2)} MB, Base64 Length: ${base64Content.length}`);

    if (approximateSize > 5 * 1024 * 1024) {
      console.warn("[VALIDATION FAILED]: File size exceeds 5MB");
      const error = new Error("File size exceeds the 5MB limit.");
      error.statusCode = 400;
      throw error;
    }

    // Magic-bytes signature check (PNG, JPEG, WebP)
    const isPng = base64Content.startsWith("iVBORw0KGgo");
    const isJpeg = base64Content.startsWith("/9j/");
    const isWebp = base64Content.startsWith("UklGR");

    if (!isPng && !isJpeg && !isWebp) {
      console.warn("[VALIDATION FAILED]: Invalid image signature header");
      const error = new Error("Invalid file type. Only PNG, JPG/JPEG, and WebP images are allowed.");
      error.statusCode = 400;
      throw error;
    }

    let weatherData = null;
    if (lat && lon) {
      try {
        console.log(`[WEATHER SERVICE]: Fetching current weather for lat: ${lat}, lon: ${lon}`);
        const { fetchWeatherData } = await import("../services/weatherService.js");
        const data = await fetchWeatherData({ lat, lon });
        weatherData = {
          temp: data.main?.temp,
          humidity: data.main?.humidity,
          city: data.name
        };
        console.log(`[WEATHER SERVICE SUCCESS]: Temperature: ${weatherData.temp}°C, Humidity: ${weatherData.humidity}%`);
      } catch (err) {
        console.warn("[WEATHER SERVICE ERROR]: Weather fetch failed:", err.message);
      }
    }

    console.log("Calling detectCropDisease service...");
    const diagnosis = await detectCropDisease({ base64Image: base64Content, weatherData });
    console.log("[DIAGNOSIS SERVICE RETURNED]:", JSON.stringify(diagnosis, null, 2));

    if (diagnosis.status === "invalid") {
      console.log("[VALIDATION REPORT]: Leaf validation failed");
      return res.status(200).json({
        success: true,
        status: "invalid",
        reason: diagnosis.reason,
        suggestion: diagnosis.suggestion,
      });
    }

    const organic = (diagnosis.treatmentOrganic || []).map(t => `• ${t}`).join("\n");
    const chemical = (diagnosis.treatmentChemical || []).map(t => `• ${t}`).join("\n");
    const treatmentCombined = `Organic Methods:\n${organic || "• None specified."}\n\nChemical Methods:\n${chemical || "• None specified."}`;
    const preventionCombined = (diagnosis.prevention || []).map(p => `• ${p}`).join("\n");

    console.log("Inserting report into supabase database...");
    const { data: report, error } = await supabase
      .from("disease_reports")
      .insert({
        user_id: req.user.id,
        disease_name: diagnosis.diagnosis.disease,
        crop: diagnosis.crop.name,
        confidence: diagnosis.diagnosis.confidence,
        severity: diagnosis.severity,
        symptoms: diagnosis.summary,
        treatment: treatmentCombined,
        prevention: preventionCombined,
        weather_risk: diagnosis.weatherRisk,
        expected_recovery: diagnosis.expectedRecovery,
      })
      .select()
      .single();

    if (error) {
      console.error("[SUPABASE INSERT FAILED]:", error.message);
      throw error;
    }

    console.log("[DIAGNOSIS COMPLETE]: Saved successfully with ID:", report.id);

    res.status(201).json({
      success: true,
      status: "success",
      report: {
        _id: report.id,
        id: report.id,
        crop: report.crop,
        cropConfidence: diagnosis.crop.confidence,
        diseaseName: report.disease_name,
        confidence: report.confidence,
        severity: report.severity,
        symptoms: report.symptoms,
        treatment: report.treatment,
        prevention: report.prevention,
        weatherRisk: report.weather_risk,
        expectedRecovery: report.expected_recovery,
        createdAt: report.created_at,
        box: diagnosis.box,
      },
    });
  } catch (error) {
    console.error("[DISEASE DETECTION CONTROLLER ERROR]:", error.message, error.stack);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error during diagnosis",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  } finally {
    console.log("=== END DISEASE DETECTION PIPELINE ===");
  }
};

export const getDiseaseReports = async (req, res, next) => {
  try {
    const { data: reports, error } = await supabase
      .from("disease_reports")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formatted = (reports || []).map(r => ({
      _id: r.id,
      id: r.id,
      crop: r.crop,
      diseaseName: r.disease_name,
      confidence: r.confidence,
      severity: r.severity,
      symptoms: r.symptoms,
      treatment: r.treatment,
      prevention: r.prevention,
      weatherRisk: r.weather_risk,
      expectedRecovery: r.expected_recovery,
      createdAt: r.created_at,
    }));

    res.status(200).json({ success: true, reports: formatted });
  } catch (error) {
    next(error);
  }
};
