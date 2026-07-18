import "dotenv/config";

const normalizeOrigin = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const configuredOrigins = (process.env.CLIENT_ORIGINS || process.env.CLIENT_REDIRECT_URL || "")
  .split(",")
  .map((origin) => normalizeOrigin(origin.trim()))
  .filter(Boolean);

export const isProduction = process.env.NODE_ENV === "production";
export const allowedOrigins = new Set(configuredOrigins);

if (isProduction && allowedOrigins.size === 0) {
  throw new Error("CLIENT_ORIGINS must list the permitted browser origins in production");
}

const configuredSameSite = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();
export const cookieSameSite = ["lax", "strict", "none"].includes(configuredSameSite)
  ? configuredSameSite
  : "lax";

if (cookieSameSite === "none" && !isProduction) {
  throw new Error("COOKIE_SAME_SITE=none requires HTTPS production deployment");
}

export const cookieSecure = isProduction;

const baseCookieOptions = {
  secure: cookieSecure,
  sameSite: cookieSameSite,
};

if (process.env.COOKIE_DOMAIN) {
  baseCookieOptions.domain = process.env.COOKIE_DOMAIN;
}

export const accessCookieOptions = (maxAge) => ({
  ...baseCookieOptions,
  httpOnly: true,
  path: "/",
  maxAge,
});

export const refreshCookieOptions = (maxAge) => ({
  ...baseCookieOptions,
  httpOnly: true,
  path: "/api/auth/refresh",
  maxAge,
});

export const csrfCookieOptions = (maxAge) => ({
  ...baseCookieOptions,
  httpOnly: false,
  path: "/",
  maxAge,
});
