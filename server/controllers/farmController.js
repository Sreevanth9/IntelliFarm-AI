import { supabase } from "../config/supabase.js";

export const addFarm = async (req, res, next) => {
  try {
    const { name, location, crop, soilType, area, sowingDate } = req.body;
    
    if (!name || !crop || !soilType || !area || !sowingDate) {
      const error = new Error("All fields except location are required");
      error.statusCode = 400;
      throw error;
    }

    const { data: farm, error } = await supabase
      .from("farms")
      .insert({
        user_id: req.user.id,
        farm_name: name,
        location: location || "",
        crop,
        soil_type: soilType,
        area,
        sowing_date: sowingDate,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      farm: {
        id: farm.id,
        name: farm.farm_name,
        location: farm.location,
        crop: farm.crop,
        soilType: farm.soil_type,
        area: farm.area,
        sowingDate: farm.sowing_date,
        createdAt: farm.created_at,
      },
    });
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

    const formatted = (farms || []).map((f) => ({
      id: f.id,
      name: f.farm_name,
      location: f.location,
      crop: f.crop,
      soilType: f.soil_type,
      area: f.area,
      sowingDate: f.sowing_date,
      createdAt: f.created_at,
    }));

    res.status(200).json({ success: true, farms: formatted });
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
