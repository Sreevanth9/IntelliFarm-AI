import { supabase } from "../config/supabase.js";

// Helper: compute crop growth stage from sowing date
const getGrowthStage = (sowingDate) => {
  if (!sowingDate) return { stage: "Unknown", daysElapsed: 0, daysToHarvest: null };
  const sown = new Date(sowingDate);
  const today = new Date();
  const daysElapsed = Math.floor((today - sown) / (1000 * 60 * 60 * 24));
  let stage = "Germination";
  if (daysElapsed >= 21 && daysElapsed < 46) stage = "Vegetative";
  else if (daysElapsed >= 46 && daysElapsed < 71) stage = "Flowering";
  else if (daysElapsed >= 71 && daysElapsed < 91) stage = "Fruiting";
  else if (daysElapsed >= 91) stage = "Harvest Ready";
  return { stage, daysElapsed };
};

const formatFarm = (f) => ({
  id: f.id,
  name: f.farm_name,
  location: f.location,
  latitude: f.latitude,
  longitude: f.longitude,
  crop: f.crop,
  cropVariety: f.crop_variety,
  soilType: f.soil_type,
  area: f.area,
  sowingDate: f.sowing_date,
  expectedHarvest: f.expected_harvest,
  irrigationMethod: f.irrigation_method,
  notes: f.notes,
  createdAt: f.created_at,
  ...getGrowthStage(f.sowing_date),
});

export const addFarm = async (req, res, next) => {
  try {
    const {
      name, location, latitude, longitude,
      crop, cropVariety, soilType, area, sowingDate,
      expectedHarvest, irrigationMethod, notes,
    } = req.body;

    if (!name || !crop || !soilType || !area || !sowingDate) {
      const error = new Error("Name, crop, soil type, area, and sowing date are required");
      error.statusCode = 400;
      throw error;
    }

    const { data: farm, error } = await supabase
      .from("farms")
      .insert({
        user_id: req.user.id,
        farm_name: name,
        location: location || "",
        latitude: latitude || null,
        longitude: longitude || null,
        crop,
        crop_variety: cropVariety || null,
        soil_type: soilType,
        area,
        sowing_date: sowingDate,
        expected_harvest: expectedHarvest || null,
        irrigation_method: irrigationMethod || "Drip",
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, farm: formatFarm(farm) });
  } catch (error) {
    next(error);
  }
};

export const getFarms = async (req, res, next) => {
  try {
    const { data: farms, error } = await supabase
      .from("farms")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formatted = (farms || []).map(formatFarm);
    res.status(200).json({ success: true, farms: formatted });
  } catch (error) {
    next(error);
  }
};

export const getFarm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data: farm, error } = await supabase
      .from("farms")
      .select("*")
      .eq("id", id)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!farm) {
      const err = new Error("Farm not found");
      err.statusCode = 404;
      throw err;
    }

    // Fetch linked disease reports
    const { data: diseaseReports } = await supabase
      .from("disease_reports")
      .select("id, disease_name, crop, confidence, created_at")
      .eq("farm_id", id)
      .order("created_at", { ascending: false })
      .limit(5);

    res.status(200).json({
      success: true,
      farm: { ...formatFarm(farm), diseaseHistory: diseaseReports || [] },
    });
  } catch (error) {
    next(error);
  }
};

export const updateFarm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, location, latitude, longitude,
      crop, cropVariety, soilType, area, sowingDate,
      expectedHarvest, irrigationMethod, notes,
    } = req.body;

    const updatePayload = {};
    if (name !== undefined) updatePayload.farm_name = name;
    if (location !== undefined) updatePayload.location = location;
    if (latitude !== undefined) updatePayload.latitude = latitude;
    if (longitude !== undefined) updatePayload.longitude = longitude;
    if (crop !== undefined) updatePayload.crop = crop;
    if (cropVariety !== undefined) updatePayload.crop_variety = cropVariety;
    if (soilType !== undefined) updatePayload.soil_type = soilType;
    if (area !== undefined) updatePayload.area = area;
    if (sowingDate !== undefined) updatePayload.sowing_date = sowingDate;
    if (expectedHarvest !== undefined) updatePayload.expected_harvest = expectedHarvest;
    if (irrigationMethod !== undefined) updatePayload.irrigation_method = irrigationMethod;
    if (notes !== undefined) updatePayload.notes = notes;

    const { data: farm, error } = await supabase
      .from("farms")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ success: true, farm: formatFarm(farm) });
  } catch (error) {
    next(error);
  }
};

export const deleteFarm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("farms")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      const error = new Error("Farm not found or unauthorized");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, message: "Farm deleted successfully" });
  } catch (error) {
    next(error);
  }
};
