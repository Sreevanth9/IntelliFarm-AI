import { supabase } from "../config/supabase.js";
import { verifyAccessToken } from "../utils/jwt.js";

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  return req.cookies?.access_token;
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      const error = new Error("Authentication required");
      error.statusCode = 401;
      throw error;
    }

    const decoded = verifyAccessToken(token);
    const { data: userData, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("id", decoded.id)
      .maybeSingle();

    if (selectError) throw selectError;

    if (!userData) {
      const error = new Error("User not found");
      error.statusCode = 401;
      throw error;
    }

    // Set req.user to match expected properties
    req.user = userData;
    req.user._id = userData.id; // Map id to _id for compatibility
    req.auth = "auth";
    next();
  } catch (error) {
    error.statusCode = error.statusCode || 401;
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      req.auth = "guest";
      return next();
    }

    const decoded = verifyAccessToken(token);
    const { data: userData, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("id", decoded.id)
      .maybeSingle();

    if (selectError) throw selectError;

    if (userData) {
      req.user = userData;
      req.user._id = userData.id; // Map id to _id for compatibility
      req.auth = "auth";
    } else {
      req.auth = "guest";
    }

    next();
  } catch (error) {
    req.auth = "guest";
    next();
  }
};

export const authMiddleware = optionalAuth;
