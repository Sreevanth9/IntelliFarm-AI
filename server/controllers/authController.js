import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";

const cookieDomain = process.env.COOKIE_DOMAIN || "localhost";
const applicationType = process.env.APPLICATION_TYPE;

const buildCookieOptions = (maxAge) => {
  const options = {
    maxAge,
    httpOnly: true,
    sameSite: "Lax",
  };

  if (cookieDomain && cookieDomain !== "localhost") {
    options.domain = cookieDomain;
  }

  if (applicationType === "production") {
    options.secure = true;
    options.sameSite = "None";
  }

  return options;
};

const createTokenPayload = (userData) => ({
  id: (userData.id || userData._id).toString(),
  email: userData.email,
  name: userData.name,
});

const sendAuthResponse = (res, userData, status = 200) => {
  const payload = createTokenPayload(userData);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie("access_token", accessToken, buildCookieOptions(15 * 60 * 1000));
  res.cookie("refresh_token", refreshToken, buildCookieOptions(7 * 24 * 60 * 60 * 1000));

  res.status(status).json({
    success: true,
    token: accessToken,
    user: {
      id: userData.id || userData._id,
      name: userData.name,
      email: userData.email,
      profileImg: userData.profile_img || userData.profileImg,
      location: userData.location,
      farmSize: userData.farm_size || userData.farmSize,
      cropsInterested: userData.crops_interested || userData.cropsInterested,
    },
  });
};

import crypto from "crypto";
import { logSecurityEvent } from "../utils/securityLogger.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, password, location, cropsInterested = [] } = req.body;
    const ip = req.ip || req.connection.remoteAddress || "0.0.0.0";
    const endpoint = "/api/auth/register";
    
    // Check if user exists in Supabase
    const { data: existingUser, error: searchError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (searchError) throw searchError;

    if (existingUser) {
      await logSecurityEvent({
        eventType: "FAILED_REGISTRATION",
        ipAddress: ip,
        endpoint,
        details: { email, reason: "Email already registered" }
      });
      const error = new Error("Email already registered");
      error.statusCode = 409;
      throw error;
    }

    // Enforce strict password rules: min 8, uppercase, lowercase, digit, special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      await logSecurityEvent({
        eventType: "FAILED_REGISTRATION",
        ipAddress: ip,
        endpoint,
        details: { email, reason: "Weak password input" }
      });
      const error = new Error("Password must be at least 8 characters long, containing uppercase, lowercase, numbers, and special characters.");
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        location,
        crops_interested: cropsInterested,
        profile_img: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Save to password history
    await supabase.from("password_history").insert({
      user_id: newUser.id,
      password_hash: hashedPassword,
    });

    await logSecurityEvent({
      eventType: "SUCCESSFUL_REGISTRATION",
      userId: newUser.id,
      ipAddress: ip,
      endpoint,
      details: { email }
    });

    sendAuthResponse(res, newUser, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress || "0.0.0.0";
    const endpoint = "/api/auth/login";

    const { data: userData, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (selectError) throw selectError;

    if (!userData) {
      await logSecurityEvent({
        eventType: "FAILED_LOGIN",
        ipAddress: ip,
        endpoint,
        details: { email, reason: "Invalid credentials" },
      });
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    // Check account lockout
    if (userData.locked_until && new Date(userData.locked_until) > new Date()) {
      await logSecurityEvent({
        eventType: "ACCOUNT_LOCKED_ACCESS_ATTEMPT",
        userId: userData.id,
        ipAddress: ip,
        endpoint,
        details: { email, lockedUntil: userData.locked_until },
      });
      const error = new Error(`Account is temporarily locked. Please try again after ${new Date(userData.locked_until).toLocaleTimeString()}`);
      error.statusCode = 423;
      throw error;
    }

    const passwordMatches = await bcrypt.compare(password, userData.password);

    if (!passwordMatches) {
      const newFailedAttempts = (userData.failed_login_attempts || 0) + 1;
      const updates = {
        failed_login_attempts: newFailedAttempts,
        last_failed_login: new Date().toISOString(),
      };

      let isLocked = false;
      if (newFailedAttempts >= 10) {
        updates.locked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        isLocked = true;
      }

      await supabase
        .from("users")
        .update(updates)
        .eq("id", userData.id);

      await logSecurityEvent({
        eventType: isLocked ? "ACCOUNT_LOCKOUT_TRIGGERED" : "FAILED_LOGIN",
        userId: userData.id,
        ipAddress: ip,
        endpoint,
        details: { email, attempts: newFailedAttempts, isLocked },
      });

      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    // Reset lockout state on success
    await supabase
      .from("users")
      .update({
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq("id", userData.id);

    // Save session in database
    const userAgent = req.headers["user-agent"] || "unknown";
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const refreshTokenHash = crypto.createHash("sha256").update(Math.random().toString()).digest("hex");

    await supabase
      .from("user_sessions")
      .insert({
        user_id: userData.id,
        refresh_token_hash: refreshTokenHash,
        device_info: userAgent,
        ip_address: ip,
        expires_at: expiresAt.toISOString(),
      });

    await logSecurityEvent({
      eventType: "SUCCESSFUL_LOGIN",
      userId: userData.id,
      ipAddress: ip,
      endpoint,
      details: { email },
    });

    sendAuthResponse(res, userData);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      profileImg: req.user.profile_img,
      location: req.user.location,
      farmSize: req.user.farm_size,
      cropsInterested: req.user.crops_interested,
    },
  });
};

export const logout = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || "0.0.0.0";
    if (req.user) {
      // Revoke all active sessions
      await supabase
        .from("user_sessions")
        .update({ revoked: true })
        .eq("user_id", req.user.id);

      await logSecurityEvent({
        eventType: "LOGOUT",
        userId: req.user.id,
        ipAddress: ip,
        endpoint: "/api/auth/logout",
      });
    }

    res.clearCookie("access_token", buildCookieOptions(0));
    res.clearCookie("refresh_token", buildCookieOptions(0));
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const oauthLogin = async (req, res, next) => {
  try {
    const { id, email, name, profileImg } = req.body;

    if (!email) {
      const error = new Error("Email is required for OAuth login");
      error.statusCode = 400;
      throw error;
    }

    // Check if user exists in public.users
    let { data: userData, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (selectError) throw selectError;

    if (!userData) {
      // Generate a random placeholder password to satisfy the NOT NULL constraint on the password column in Supabase
      const dummyPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const hashedPassword = await bcrypt.hash(dummyPassword, 12);

      // Create new user in public.users using upsert to avoid duplicate key violations on race conditions
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .upsert({
          id: id || undefined,
          name: name || email.split("@")[0],
          email: email.toLowerCase(),
          password: hashedPassword,
          profile_img: profileImg || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`,
          location: "Hyderabad, Telangana",
          crops_interested: ["Paddy", "Tomato", "Maize"],
        })
        .select()
        .single();

      if (insertError) {
        // Fallback: If upsert still fails or encounters a race condition, try to fetch the record again
        const { data: fallbackUser, error: fallbackError } = await supabase
          .from("users")
          .select("*")
          .eq("email", email.toLowerCase())
          .maybeSingle();

        if (fallbackError || !fallbackUser) {
          throw insertError;
        }
        userData = fallbackUser;
      } else {
        userData = newUser;
      }
    } else {
      // Update details if profile image is missing
      const updates = {};
      if (!userData.profile_img && profileImg) {
        updates.profile_img = profileImg;
      }
      
      if (Object.keys(updates).length > 0) {
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update(updates)
          .eq("email", email.toLowerCase())
          .select()
          .single();
        if (!updateError && updatedUser) {
          userData = updatedUser;
        }
      }
    }

    sendAuthResponse(res, userData);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const ip = req.ip || req.connection.remoteAddress || "0.0.0.0";
    const endpoint = "/api/auth/change-password";

    if (!oldPassword || !newPassword) {
      const error = new Error("Both old and new passwords are required");
      error.statusCode = 400;
      throw error;
    }

    // 1. Enforce strict password rules
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      const error = new Error("New password must be at least 8 characters, containing uppercase, lowercase, numbers, and special characters.");
      error.statusCode = 400;
      throw error;
    }

    // 2. Retrieve user password hash
    const { data: userData, error: selectError } = await supabase
      .from("users")
      .select("password")
      .eq("id", req.user.id)
      .single();

    if (selectError || !userData) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    // If user has a password set, verify it
    if (userData.password) {
      const passwordMatches = await bcrypt.compare(oldPassword, userData.password);
      if (!passwordMatches) {
        await logSecurityEvent({
          eventType: "FAILED_PASSWORD_CHANGE",
          userId: req.user.id,
          ipAddress: ip,
          endpoint,
          details: { reason: "Incorrect old password" }
        });
        const error = new Error("Incorrect old password");
        error.statusCode = 400;
        throw error;
      }
    }

    // 3. Password History Check: Retrieve last 3 password hashes
    const { data: history, error: historyError } = await supabase
      .from("password_history")
      .select("password_hash")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (historyError) throw historyError;

    if (history && history.length > 0) {
      for (const record of history) {
        const isSame = await bcrypt.compare(newPassword, record.password_hash);
        if (isSame) {
          const error = new Error("New password cannot be one of your last 3 passwords");
          error.statusCode = 400;
          throw error;
        }
      }
    }

    // 4. Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", req.user.id);

    if (updateError) throw updateError;

    // 5. Save to history
    await supabase
      .from("password_history")
      .insert({
        user_id: req.user.id,
        password_hash: hashedPassword
      });

    // Log security event
    await logSecurityEvent({
      eventType: "SUCCESSFUL_PASSWORD_CHANGE",
      userId: req.user.id,
      ipAddress: ip,
      endpoint,
      details: {}
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    next(error);
  }
};
