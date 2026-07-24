import { supabase } from "../config/supabase.js";

export const getProfile = async (req, res, next) => {
  try {
    const { data: recommendations, error } = await supabase
      .from("saved_recommendations")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error && error.code !== "PGRST116") {
      console.warn("[profileController] saved_recommendations fetch warning:", error.message);
    }

    const formattedRecs = (recommendations || []).map(r => ({
      _id: r.id,
      id: r.id,
      user: r.user_id,
      title: r.title,
      category: r.category,
      content: r.content,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    let pincode = req.user?.pincode || "";
    let location = req.user?.location || "";

    if (!pincode && location.includes(" | ")) {
      const parts = location.split(" | ");
      pincode = parts[0].trim();
      location = parts.slice(1).join(" | ").trim();
    } else if (!pincode && /^\d{6}$/.test(location.trim())) {
      pincode = location.trim();
      location = "";
    }

    res.status(200).json({
      success: true,
      profile: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        profileImg: req.user.profile_img,
        pincode,
        location,
        farmSize: req.user.farm_size,
        cropsInterested: Array.isArray(req.user.crops_interested) ? req.user.crops_interested : [],
        cropsConfirmed: Boolean(req.user.crops_confirmed),
        savedRecommendations: formattedRecs,
      },
    });
  } catch (error) {
    console.error("[profileController] getProfile error:", error);
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, pincode, location, farmSize, cropsInterested, profileImg, profile_img } = req.body;

    const cleanPincode = (pincode !== undefined && pincode !== null ? pincode : "").toString().trim();
    const cleanLocation = (location !== undefined && location !== null ? location : "").toString().trim();

    const baseUpdate = {};
    if (name !== undefined && name !== null) baseUpdate.name = String(name).trim();
    if (farmSize !== undefined && farmSize !== null) baseUpdate.farm_size = String(farmSize);
    if (cropsInterested !== undefined) {
      baseUpdate.crops_interested = Array.isArray(cropsInterested) ? cropsInterested : [];
      // A crop list is only considered chosen after the user explicitly saves it.
      baseUpdate.crops_confirmed = true;
    }
    if (profileImg) baseUpdate.profile_img = profileImg;
    if (profile_img) baseUpdate.profile_img = profile_img;

    let updatedUser = null;

    // Attempt 1: Try updating with pincode column directly
    try {
      const fullUpdate = {
        ...baseUpdate,
        ...(location !== undefined ? { location: cleanLocation } : {}),
        ...(pincode !== undefined ? { pincode: cleanPincode } : {}),
      };

      const res1 = await supabase
        .from("users")
        .update(fullUpdate)
        .eq("id", req.user.id)
        .select("*")
        .maybeSingle();

      if (!res1.error && res1.data) {
        updatedUser = res1.data;
      }
    } catch (e1) {
      // Column pincode might not exist in target database
    }

    // Attempt 2: Fallback if pincode column is absent in Supabase
    if (!updatedUser) {
      let combinedLocation = cleanLocation;
      if (cleanPincode && cleanLocation && !cleanLocation.startsWith(cleanPincode)) {
        combinedLocation = `${cleanPincode} | ${cleanLocation}`;
      } else if (cleanPincode && !cleanLocation) {
        combinedLocation = cleanPincode;
      }

      const fallbackUpdate = {
        ...baseUpdate,
        ...(combinedLocation ? { location: combinedLocation } : {}),
      };

      const res2 = await supabase
        .from("users")
        .update(fallbackUpdate)
        .eq("id", req.user.id)
        .select("*")
        .maybeSingle();

      if (!res2.error && res2.data) {
        updatedUser = res2.data;
      } else if (res2.error) {
        console.error("[profileController] Supabase update fallback error:", res2.error);
        throw res2.error;
      }
    }

    if (!updatedUser) {
      throw new Error("Unable to update profile record in database");
    }

    let resPincode = updatedUser.pincode || cleanPincode || "";
    let resLocation = updatedUser.location || cleanLocation || "";

    if (!resPincode && resLocation.includes(" | ")) {
      const parts = resLocation.split(" | ");
      resPincode = parts[0].trim();
      resLocation = parts.slice(1).join(" | ").trim();
    } else if (!resPincode && /^\d{6}$/.test(resLocation.trim())) {
      resPincode = resLocation.trim();
      resLocation = "";
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        profileImg: updatedUser.profile_img,
        pincode: resPincode,
        location: resLocation,
        farmSize: updatedUser.farm_size,
        cropsInterested: updatedUser.crops_interested || [],
        cropsConfirmed: Boolean(updatedUser.crops_confirmed),
      },
    });
  } catch (error) {
    console.error("[profileController] updateProfile error:", error);
    next(error);
  }
};

export const saveRecommendation = async (req, res, next) => {
  try {
    const { title, category, content } = req.body;

    if (!title || !content) {
      const error = new Error("Title and content are required");
      error.statusCode = 400;
      throw error;
    }

    const { data: recommendation, error } = await supabase
      .from("saved_recommendations")
      .insert({
        user_id: req.user.id,
        title,
        category: category || "General",
        content,
      })
      .select()
      .single();

    if (error) throw error;

    const formattedRec = {
      _id: recommendation.id,
      id: recommendation.id,
      user: recommendation.user_id,
      title: recommendation.title,
      category: recommendation.category,
      content: recommendation.content,
      createdAt: recommendation.created_at,
      updatedAt: recommendation.updated_at
    };

    res.status(201).json({ success: true, recommendation: formattedRec });
  } catch (error) {
    next(error);
  }
};

export const getSavedRecommendations = async (req, res, next) => {
  try {
    const { data: recommendations, error } = await supabase
      .from("saved_recommendations")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formattedRecs = (recommendations || []).map(r => ({
      _id: r.id,
      id: r.id,
      user: r.user_id,
      title: r.title,
      category: r.category,
      content: r.content,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));

    res.status(200).json({ success: true, recommendations: formattedRecs });
  } catch (error) {
    next(error);
  }
};

export const deleteSavedRecommendation = async (req, res, next) => {
  try {
    const { data: recommendation, error } = await supabase
      .from("saved_recommendations")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!recommendation) {
      const error = new Error("Recommendation not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, message: "Recommendation deleted" });
  } catch (error) {
    next(error);
  }
};
