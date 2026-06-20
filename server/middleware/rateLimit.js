import { supabase } from "../config/supabase.js";

export const rateLimit = async (req, res, next) => {
  const user = req.user;
  if (!user) {
    return next();
  }
  if (req.auth === "auth") {
    try {
      const { error } = await supabase
        .from("users")
        .update({ current_limit: 0 })
        .eq("id", user.id);
      
      if (error) throw error;
      user.current_limit = 0;
      return next();
    } catch (err) {
      return next(err);
    }
  }
  try {
    const maxRateLimit = user.max_rate_limit || user.maxRateLimit || 10;
    const currentTime = Date.now();
    const timeDifference = currentTime - (Number(user.recent_rate_limit_time) || 0);
    
    let currentLimit = user.current_limit || 0;
    let recentRateLimitTime = Number(user.recent_rate_limit_time) || 0;

    if (timeDifference > 60 * 60 * 1000) {
      currentLimit = 0;
      recentRateLimitTime = currentTime;
    } else {
      if (currentLimit > maxRateLimit) {
        const error = new Error("Rate limit exceeded");
        error.data =
          "Rate Limit Exceeded. Please wait for one hour before trying again. Thank you for your patience.";
        error.statusCode = 429;
        return next(error);
      }
    }

    const { error } = await supabase
      .from("users")
      .update({
        current_limit: currentLimit,
        recent_rate_limit_time: recentRateLimitTime,
      })
      .eq("id", user.id);

    if (error) throw error;

    user.current_limit = currentLimit;
    user.recent_rate_limit_time = recentRateLimitTime;
    next();
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};
