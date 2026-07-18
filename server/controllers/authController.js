import crypto from "crypto";
import bcrypt from "bcryptjs";

import { supabase } from "../config/supabase.js";
import { accessCookieOptions, csrfCookieOptions, refreshCookieOptions } from "../config/security.js";
import { issueCsrfToken } from "../middleware/csrf.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { logSecurityEvent } from "../utils/securityLogger.js";

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])[\s\S]{12,128}$/;
const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

const durationToMilliseconds = (value, fallback) => {
  const match = String(value || "").match(/^(\d+)([smhd])$/);
  if (!match) return fallback;
  return Number(match[1]) * ({ s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 })[match[2]];
};

const accessMaxAge = durationToMilliseconds(process.env.ACCESS_TOKEN_EXPIRETIME, 15 * 60_000);
const refreshMaxAge = durationToMilliseconds(process.env.REFRESH_TOKEN_EXPIRETIME, 7 * 24 * 60 * 60_000);
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const clientIp = (req) => req.ip || req.socket.remoteAddress || "0.0.0.0";

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(left || "");
  const rightBuffer = Buffer.from(right || "");
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const safeUser = (user) => ({
  id: user.id || user._id,
  name: user.name,
  email: user.email,
  profileImg: user.profile_img || user.profileImg,
  location: user.location,
  farmSize: user.farm_size || user.farmSize,
  cropsInterested: user.crops_interested || user.cropsInterested || [],
});

const setSessionCookies = (res, user, sessionId, refreshToken) => {
  res.cookie(ACCESS_COOKIE, signAccessToken(user, sessionId), accessCookieOptions(accessMaxAge));
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions(refreshMaxAge));
  issueCsrfToken(res);
};

const clearSessionCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE, accessCookieOptions(0));
  res.clearCookie(REFRESH_COOKIE, refreshCookieOptions(0));
  res.clearCookie("csrf_token", csrfCookieOptions(0));
};

const createSession = async (user, req) => {
  const sessionId = crypto.randomUUID();
  const refreshToken = signRefreshToken(user, sessionId);
  const { error } = await supabase.from("user_sessions").insert({
    id: sessionId,
    user_id: user.id || user._id,
    refresh_token_hash: hashToken(refreshToken),
    device_info: String(req.get("user-agent") || "unknown").slice(0, 512),
    ip_address: clientIp(req),
    expires_at: new Date(Date.now() + refreshMaxAge).toISOString(),
  });
  if (error) throw error;
  return { sessionId, refreshToken };
};

const sendAuthResponse = async (res, user, req, status = 200) => {
  const { sessionId, refreshToken } = await createSession(user, req);
  setSessionCookies(res, user, sessionId, refreshToken);
  return res.status(status).json({ success: true, user: safeUser(user) });
};

const passwordError = () => Object.assign(
  new Error("Password must be 12 to 128 characters and include uppercase, lowercase, a number, and a symbol"),
  { statusCode: 400 }
);

export const getCsrfToken = (req, res) => {
  const token = issueCsrfToken(res);
  res.status(200).json({ success: true, token });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, location, cropsInterested = [] } = req.body;
    const normalizedEmail = email.toLowerCase();
    if (!PASSWORD_PATTERN.test(password)) throw passwordError();

    const { data: existingUser, error: searchError } = await supabase.from("users").select("id").eq("email", normalizedEmail).maybeSingle();
    if (searchError) throw searchError;
    if (existingUser) {
      await logSecurityEvent({ eventType: "FAILED_REGISTRATION", ipAddress: clientIp(req), endpoint: "/api/auth/register", details: { email: normalizedEmail, reason: "Email already registered" } });
      throw Object.assign(new Error("Email already registered"), { statusCode: 409 });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedVerificationToken = hashToken(verificationToken);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    const passwordHash = await bcrypt.hash(password, 12);
    const { data: newUser, error: insertError } = await supabase.from("users").insert({
      name,
      email: normalizedEmail,
      password: passwordHash,
      location: location || null,
      crops_interested: Array.isArray(cropsInterested) ? cropsInterested.slice(0, 20) : [],
      profile_img: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`,
      is_email_verified: false,
      email_verification_token: hashedVerificationToken,
      email_verification_expires: verificationExpires,
    }).select("id, name, email, profile_img, location, farm_size, crops_interested").single();
    if (insertError) throw insertError;

    const { error: historyError } = await supabase.from("password_history").insert({ user_id: newUser.id, password_hash: passwordHash });
    if (historyError) throw historyError;
    
    await logSecurityEvent({ 
      eventType: "EMAIL_VERIFICATION_SENT", 
      userId: newUser.id, 
      ipAddress: clientIp(req), 
      endpoint: "/api/auth/register", 
      details: { email: normalizedEmail } 
    });
    
    return res.status(201).json({ success: true, message: "Registration successful! Please verify your email address to log in." });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const normalizedEmail = req.body.email.toLowerCase();
    const { data: user, error: selectError } = await supabase.from("users")
      .select("id, name, email, password, profile_img, location, farm_size, crops_interested, failed_login_attempts, locked_until, is_email_verified")
      .eq("email", normalizedEmail).maybeSingle();
    if (selectError) throw selectError;
    if (!user?.password) {
      await logSecurityEvent({ eventType: "FAILED_LOGIN", ipAddress: clientIp(req), endpoint: "/api/auth/login", details: { email: normalizedEmail } });
      throw Object.assign(new Error("Invalid email or password"), { statusCode: 401 });
    }
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw Object.assign(new Error("Account is temporarily locked. Please try again later."), { statusCode: 423 });
    }
    if (!user.is_email_verified) {
      await logSecurityEvent({ eventType: "FAILED_LOGIN_UNVERIFIED", userId: user.id, ipAddress: clientIp(req), endpoint: "/api/auth/login", details: { email: normalizedEmail } });
      throw Object.assign(new Error("Please verify your email address before logging in."), { statusCode: 403 });
    }
    if (!await bcrypt.compare(req.body.password, user.password)) {
      const failedAttempts = Number(user.failed_login_attempts || 0) + 1;
      const lockUntil = failedAttempts >= 10 ? new Date(Date.now() + 30 * 60_000).toISOString() : null;
      const { error: updateError } = await supabase.from("users").update({
        failed_login_attempts: failedAttempts,
        last_failed_login: new Date().toISOString(),
        ...(lockUntil ? { locked_until: lockUntil } : {}),
      }).eq("id", user.id);
      if (updateError) throw updateError;
      await logSecurityEvent({ eventType: lockUntil ? "ACCOUNT_LOCKOUT_TRIGGERED" : "FAILED_LOGIN", userId: user.id, ipAddress: clientIp(req), endpoint: "/api/auth/login", details: { attempts: failedAttempts } });
      throw Object.assign(new Error("Invalid email or password"), { statusCode: 401 });
    }
    const { error: updateError } = await supabase.from("users").update({ failed_login_attempts: 0, locked_until: null }).eq("id", user.id);
    if (updateError) throw updateError;
    await logSecurityEvent({ eventType: "SUCCESSFUL_LOGIN", userId: user.id, ipAddress: clientIp(req), endpoint: "/api/auth/login", details: {} });
    return sendAuthResponse(res, user, req);
  } catch (error) {
    return next(error);
  }
};

export const getMe = async (req, res) => res.status(200).json({ success: true, user: safeUser(req.user) });

export const refreshSession = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) throw Object.assign(new Error("Authentication required"), { statusCode: 401 });
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded.jti || !decoded.sub) throw Object.assign(new Error("Invalid session"), { statusCode: 401 });

    const { data: session, error: sessionError } = await supabase.from("user_sessions")
      .select("id, user_id, refresh_token_hash, expires_at, revoked").eq("id", decoded.jti).maybeSingle();
    if (sessionError) throw sessionError;
    if (!session || session.user_id !== decoded.sub || session.revoked || new Date(session.expires_at) <= new Date() || !safeEqual(session.refresh_token_hash, hashToken(refreshToken))) {
      throw Object.assign(new Error("Session expired"), { statusCode: 401 });
    }

    const { data: user, error: userError } = await supabase.from("users")
      .select("id, name, email, profile_img, location, farm_size, crops_interested").eq("id", decoded.sub).maybeSingle();
    if (userError) throw userError;
    if (!user) throw Object.assign(new Error("User not found"), { statusCode: 401 });

    const newRefreshToken = signRefreshToken(user, session.id);
    const { error: rotateError } = await supabase.from("user_sessions").update({
      refresh_token_hash: hashToken(newRefreshToken), last_used_at: new Date().toISOString(),
    }).eq("id", session.id);
    if (rotateError) throw rotateError;
    setSessionCookies(res, user, session.id, newRefreshToken);
    return res.status(200).json({ success: true, user: safeUser(user) });
  } catch (error) {
    clearSessionCookies(res);
    return next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { error } = await supabase.from("user_sessions").update({ revoked: true }).eq("id", req.session.id);
    if (error) throw error;
    await logSecurityEvent({ eventType: "LOGOUT", userId: req.user.id, ipAddress: clientIp(req), endpoint: "/api/auth/logout", details: {} });
    clearSessionCookies(res);
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return next(error);
  }
};

export const oauthLogin = async (req, res, next) => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser(req.body.accessToken);
    if (authError || !authData.user?.email) throw Object.assign(new Error("OAuth session could not be verified"), { statusCode: 401 });
    const authUser = authData.user;
    const normalizedEmail = authUser.email.toLowerCase();
    const metadata = authUser.user_metadata || {};
    const name = String(metadata.full_name || metadata.name || normalizedEmail.split("@")[0]).slice(0, 120);
    const profileImage = typeof metadata.avatar_url === "string" && /^https:\/\//i.test(metadata.avatar_url)
      ? metadata.avatar_url.slice(0, 2048)
      : `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;

    let { data: user, error: selectError } = await supabase.from("users")
      .select("id, name, email, profile_img, location, farm_size, crops_interested, auth_user_id")
      .eq("auth_user_id", authUser.id).maybeSingle();
    if (selectError) throw selectError;
    if (!user) {
      const { data: emailUser, error: emailError } = await supabase.from("users")
        .select("id, name, email, profile_img, location, farm_size, crops_interested, auth_user_id")
        .eq("email", normalizedEmail).maybeSingle();
      if (emailError) throw emailError;
      if (emailUser?.auth_user_id && emailUser.auth_user_id !== authUser.id) {
        throw Object.assign(new Error("This email is already linked to another sign-in method"), { statusCode: 409 });
      }
      if (emailUser) {
        const { data, error } = await supabase.from("users").update({ auth_user_id: authUser.id, profile_img: emailUser.profile_img || profileImage, is_email_verified: true })
          .eq("id", emailUser.id).select("id, name, email, profile_img, location, farm_size, crops_interested, auth_user_id").single();
        if (error) throw error;
        user = data;
      } else {
        const placeholderPassword = await bcrypt.hash(crypto.randomBytes(48).toString("base64url"), 12);
        const { data, error } = await supabase.from("users").insert({
          auth_user_id: authUser.id, name, email: normalizedEmail, password: placeholderPassword, profile_img: profileImage, crops_interested: [], is_email_verified: true,
        }).select("id, name, email, profile_img, location, farm_size, crops_interested, auth_user_id").single();
        if (error) throw error;
        user = data;
      }
    }
    await logSecurityEvent({ eventType: "SUCCESSFUL_OAUTH_LOGIN", userId: user.id, ipAddress: clientIp(req), endpoint: "/api/auth/oauth-login", details: { provider: authUser.app_metadata?.provider || "oauth" } });
    return sendAuthResponse(res, user, req);
  } catch (error) {
    return next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!PASSWORD_PATTERN.test(newPassword)) throw passwordError();
    const { data: user, error: userError } = await supabase.from("users").select("id, password").eq("id", req.user.id).single();
    if (userError || !user?.password) throw Object.assign(new Error("Password changes are unavailable for this account"), { statusCode: 400 });
    if (!await bcrypt.compare(oldPassword, user.password)) {
      await logSecurityEvent({ eventType: "FAILED_PASSWORD_CHANGE", userId: req.user.id, ipAddress: clientIp(req), endpoint: "/api/auth/change-password", details: {} });
      throw Object.assign(new Error("Current password is incorrect"), { statusCode: 400 });
    }
    const { data: history, error: historyError } = await supabase.from("password_history").select("password_hash")
      .eq("user_id", req.user.id).order("created_at", { ascending: false }).limit(5);
    if (historyError) throw historyError;
    for (const entry of history || []) {
      if (await bcrypt.compare(newPassword, entry.password_hash)) throw Object.assign(new Error("New password cannot match a recent password"), { statusCode: 400 });
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const { error: updateError } = await supabase.from("users").update({ password: passwordHash }).eq("id", req.user.id);
    if (updateError) throw updateError;
    const { error: historyInsertError } = await supabase.from("password_history").insert({ user_id: req.user.id, password_hash: passwordHash });
    if (historyInsertError) throw historyInsertError;
    const { error: revokeError } = await supabase.from("user_sessions").update({ revoked: true }).eq("user_id", req.user.id);
    if (revokeError) throw revokeError;
    await logSecurityEvent({ eventType: "SUCCESSFUL_PASSWORD_CHANGE", userId: req.user.id, ipAddress: clientIp(req), endpoint: "/api/auth/change-password", details: {} });
    return sendAuthResponse(res, req.user, req);
  } catch (error) {
    return next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const hashedVerificationToken = hashToken(token);
    const { data: user, error: selectError } = await supabase.from("users")
      .select("id, email, email_verification_expires")
      .eq("email_verification_token", hashedVerificationToken)
      .maybeSingle();

    if (selectError) throw selectError;
    if (!user) {
      throw Object.assign(new Error("Invalid or expired verification token"), { statusCode: 400 });
    }

    if (new Date(user.email_verification_expires) < new Date()) {
      throw Object.assign(new Error("Verification token has expired. Please register again."), { statusCode: 400 });
    }

    const { error: updateError } = await supabase.from("users").update({
      is_email_verified: true,
      email_verification_token: null,
      email_verification_expires: null,
    }).eq("id", user.id);

    if (updateError) throw updateError;

    await logSecurityEvent({
      eventType: "EMAIL_VERIFICATION_SUCCESS",
      userId: user.id,
      ipAddress: clientIp(req),
      endpoint: "/api/auth/verify-email",
      details: { email: user.email }
    });

    return res.status(200).json({ success: true, message: "Email verified successfully! You can now log in." });
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const normalizedEmail = req.body.email.toLowerCase();
    const { data: user, error: selectError } = await supabase.from("users")
      .select("id, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (selectError) throw selectError;
    if (!user) {
      return res.status(200).json({ success: true, message: "If that email exists in our system, we have sent a password reset link." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    const { error: updateError } = await supabase.from("users").update({
      password_reset_token: hashedResetToken,
      password_reset_expires: resetExpires,
    }).eq("id", user.id);

    if (updateError) throw updateError;

    await logSecurityEvent({
      eventType: "PASSWORD_RESET_REQUESTED",
      userId: user.id,
      ipAddress: clientIp(req),
      endpoint: "/api/auth/forgot-password",
      details: { email: user.email }
    });

    return res.status(200).json({ success: true, message: "If that email exists in our system, we have sent a password reset link." });
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!PASSWORD_PATTERN.test(password)) throw passwordError();

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const { data: user, error: selectError } = await supabase.from("users")
      .select("id, email, password_reset_expires")
      .eq("password_reset_token", hashedToken)
      .maybeSingle();

    if (selectError) throw selectError;
    if (!user || new Date(user.password_reset_expires) < new Date()) {
      throw Object.assign(new Error("Invalid or expired password reset token"), { statusCode: 400 });
    }

    const { data: history, error: historyError } = await supabase.from("password_history")
      .select("password_hash")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (historyError) throw historyError;
    for (const entry of history || []) {
      if (await bcrypt.compare(password, entry.password_hash)) {
        throw Object.assign(new Error("New password cannot match a recent password"), { statusCode: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { error: updateError } = await supabase.from("users").update({
      password: passwordHash,
      password_reset_token: null,
      password_reset_expires: null,
      is_email_verified: true,
    }).eq("id", user.id);

    if (updateError) throw updateError;

    const { error: historyInsertError } = await supabase.from("password_history")
      .insert({ user_id: user.id, password_hash: passwordHash });
    if (historyInsertError) throw historyInsertError;

    const { error: revokeError } = await supabase.from("user_sessions")
      .update({ revoked: true })
      .eq("user_id", user.id);
    if (revokeError) throw revokeError;

    await logSecurityEvent({
      eventType: "PASSWORD_RESET_SUCCESS",
      userId: user.id,
      ipAddress: clientIp(req),
      endpoint: "/api/auth/reset-password",
      details: { email: user.email }
    });

    return res.status(200).json({ success: true, message: "Password has been reset successfully! You can now log in with your new password." });
  } catch (error) {
    return next(error);
  }
};
