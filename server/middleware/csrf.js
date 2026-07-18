import crypto from "crypto";

import { csrfCookieOptions } from "../config/security.js";

export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const issueCsrfToken = (res) => {
  const token = crypto.randomBytes(32).toString("base64url");
  res.cookie(CSRF_COOKIE_NAME, token, csrfCookieOptions(CSRF_MAX_AGE_MS));
  return token;
};

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(left || "");
  const rightBuffer = Buffer.from(right || "");
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const csrfProtection = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken || !safeEqual(cookieToken, headerToken)) {
    const error = new Error("Invalid request security token");
    error.statusCode = 403;
    return next(error);
  }

  return next();
};
