import { supabase } from "../config/supabase.js";
import { askAI, detectCropDisease } from "../services/aiService.js";

const buildPrompt = (task, details = {}) => {
  return `${task}

Farmer details:
${JSON.stringify(details, null, 2)}

Give practical, farmer-friendly advice. Include crop names, reasons, timing, risks, and next steps where useful.`;
};

const sendAgricultureResponse = async (req, res, next, task) => {
  try {
    const recommendation = await askAI({
      prompt: buildPrompt(task, req.body),
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
  try {
    const { image } = req.body;
    if (!image) {
      const error = new Error("Crop image is required");
      error.statusCode = 400;
      throw error;
    }

    // Enforce base64 file size limit: 5 MB
    const base64Content = image.includes(",") ? image.split(",")[1] : image;
    const approximateSize = (base64Content.length * 3) / 4;
    if (approximateSize > 5 * 1024 * 1024) {
      const error = new Error("File size exceeds the 5MB limit.");
      error.statusCode = 400;
      throw error;
    }

    // Magic-bytes signature check (PNG, JPEG, WebP)
    const isPng = base64Content.startsWith("iVBORw0KGgo");
    const isJpeg = base64Content.startsWith("/9j/");
    const isWebp = base64Content.startsWith("UklGR");

    if (!isPng && !isJpeg && !isWebp) {
      const error = new Error("Invalid file type. Only PNG, JPG/JPEG, and WebP images are allowed.");
      error.statusCode = 400;
      throw error;
    }

    const diagnosis = await detectCropDisease({ base64Image: base64Content });

    const { data: report, error } = await supabase
      .from("disease_reports")
      .insert({
        user_id: req.user.id,
        disease_name: diagnosis.diseaseName,
        symptoms: diagnosis.symptoms,
        treatment: diagnosis.treatment,
        prevention: diagnosis.prevention,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      report: {
        _id: report.id,
        id: report.id,
        diseaseName: report.disease_name,
        symptoms: report.symptoms,
        treatment: report.treatment,
        prevention: report.prevention,
        createdAt: report.created_at,
      },
    });
  } catch (error) {
    next(error);
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
      diseaseName: r.disease_name,
      symptoms: r.symptoms,
      treatment: r.treatment,
      prevention: r.prevention,
      createdAt: r.created_at,
    }));

    res.status(200).json({ success: true, reports: formatted });
  } catch (error) {
    next(error);
  }
};
