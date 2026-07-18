import "dotenv/config";
import jwt from "jsonwebtoken";

const ISSUER = process.env.JWT_ISSUER || "intellifarm-api";
const AUDIENCE = process.env.JWT_AUDIENCE || "intellifarm-web";

const readSecret = (name) => {
  const value = process.env[name];
  if (!value || value.length < 32 || /placeholder|intellifarm_access_secret|intellifarm_refresh_secret/i.test(value)) {
    throw new Error(`${name} must be a unique secret of at least 32 characters`);
  }
  return value;
};

const accessTokenSecret = readSecret("ACCESS_TOKEN_JWT_SECRET");
const refreshTokenSecret = readSecret("REFRESH_TOKEN_JWT_SECRET");
const accessExpiry = process.env.ACCESS_TOKEN_EXPIRETIME || "15m";
const refreshExpiry = process.env.REFRESH_TOKEN_EXPIRETIME || "7d";

const sign = (userData, sessionId, secret, expiresIn) => jwt.sign(
  { email: userData.email },
  secret,
  {
    algorithm: "HS256",
    subject: String(userData.id || userData._id),
    audience: AUDIENCE,
    issuer: ISSUER,
    expiresIn,
    jwtid: sessionId,
  }
);

const verify = (token, secret) => jwt.verify(token, secret, {
  algorithms: ["HS256"],
  audience: AUDIENCE,
  issuer: ISSUER,
});

export const signAccessToken = (userData, sessionId) => sign(userData, sessionId, accessTokenSecret, accessExpiry);
export const signRefreshToken = (userData, sessionId) => sign(userData, sessionId, refreshTokenSecret, refreshExpiry);
export const verifyAccessToken = (token) => verify(token, accessTokenSecret);
export const verifyRefreshToken = (token) => verify(token, refreshTokenSecret);
