import crypto from "crypto";

const accessTokenSecret = process.env.ACCESS_TOKEN_JWT_SECRET || "intellifarm_access_secret";
const refreshTokenSecret = process.env.REFRESH_TOKEN_JWT_SECRET || "intellifarm_refresh_secret";

const base64Url = (input) =>
  Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const parseDuration = (value, fallbackSeconds) => {
  if (!value) return fallbackSeconds;
  const match = String(value).match(/^(\d+)([smhd])$/);
  if (!match) return Number(value) || fallbackSeconds;

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return amount * multipliers[unit];
};

const signJwt = (payload, secret, expiresInSeconds) => {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedBody = base64Url(JSON.stringify(body));
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedBody}.${signature}`;
};

const verifyJwt = (token, secret) => {
  const [encodedHeader, encodedBody, signature] = token.split(".");

  if (!encodedHeader || !encodedBody || !signature) {
    throw new Error("Invalid token");
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (signature !== expectedSignature) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(Buffer.from(encodedBody, "base64url").toString("utf8"));

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  return payload;
};

export const signAccessToken = (userData) => {
  return signJwt(
    userData,
    accessTokenSecret,
    parseDuration(process.env.ACCESS_TOKEN_EXPIRETIME, 15 * 60)
  );
};

export const signRefreshToken = (userData) => {
  return signJwt(
    userData,
    refreshTokenSecret,
    parseDuration(process.env.REFRESH_TOKEN_EXPIRETIME, 7 * 24 * 60 * 60)
  );
};

export const verifyAccessToken = (token) => verifyJwt(token, accessTokenSecret);
export const verifyRefreshToken = (token) => verifyJwt(token, refreshTokenSecret);
