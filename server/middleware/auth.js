import { supabase } from "../config/supabase.js";
import { verifyAccessToken } from "../utils/jwt.js";

const getTokenFromRequest = (req) => {
  return req.cookies?.access_token;
};

const getAuthenticatedUser = async (token) => {
  const decoded = verifyAccessToken(token);
  const userId = decoded.sub;
  const sessionId = decoded.jti;

  if (!userId || !sessionId) {
    const error = new Error("Invalid session");
    error.statusCode = 401;
    throw error;
  }

  const { data: session, error: sessionError } = await supabase
    .from("user_sessions")
    .select("id, user_id, expires_at, revoked")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) throw sessionError;

  if (!session || session.user_id !== userId || session.revoked || new Date(session.expires_at) <= new Date()) {
    const error = new Error("Session expired");
    error.statusCode = 401;
    throw error;
  }

  const { data: userData, error: selectError } = await supabase
    .from("users")
    .select("id, name, email, profile_img, location, farm_size, crops_interested")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) throw selectError;
  if (!userData) {
    const error = new Error("User not found");
    error.statusCode = 401;
    throw error;
  }

  return { decoded, session, userData };
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      const error = new Error("Authentication required");
      error.statusCode = 401;
      throw error;
    }

    const { decoded, session, userData } = await getAuthenticatedUser(token);

    req.user = userData;
    req.user._id = userData.id;
    req.session = session;
    req.token = decoded;
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

    const { decoded, session, userData } = await getAuthenticatedUser(token);
    if (userData) {
      req.user = userData;
      req.user._id = userData.id;
      req.session = session;
      req.token = decoded;
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
