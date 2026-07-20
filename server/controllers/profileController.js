import { supabase } from "../config/supabase.js";

export const getProfile = async (req, res, next) => {
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

    res.status(200).json({
      success: true,
      profile: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        profileImg: req.user.profile_img,
        pincode: req.user.pincode,
        location: req.user.location,
        farmSize: req.user.farm_size,
        cropsInterested: req.user.crops_interested,
        savedRecommendations: formattedRecs,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, pincode, location, farmSize, cropsInterested, profileImg, profile_img } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (location !== undefined) updateData.location = location;
    if (farmSize !== undefined) updateData.farm_size = farmSize;
    if (cropsInterested !== undefined) updateData.crops_interested = cropsInterested;
    if (profileImg) updateData.profile_img = profileImg;
    if (profile_img) updateData.profile_img = profile_img;

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", req.user.id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        profileImg: updatedUser.profile_img,
        pincode: updatedUser.pincode,
        location: updatedUser.location,
        farmSize: updatedUser.farm_size,
        cropsInterested: updatedUser.crops_interested,
      },
    });
  } catch (error) {
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
