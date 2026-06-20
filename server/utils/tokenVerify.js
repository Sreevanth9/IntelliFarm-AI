import jwt from "jsonwebtoken";
import { user } from "../models/user.js";

export const tokenVerify = (token) => {
  return new Promise((resolve, reject) => {
    const secret = process.env.ACCESS_TOKEN_JWT_SECRET;

    let decodeToken;
    try {
      decodeToken = jwt.verify(token, secret);
    } catch (err) {
      const error = new Error("Token Invalid");
      error.statusCode = 401;
      error.data = "invalid token";
      return reject(error);
    }

    if (!decodeToken) {
      const err = new Error("Token Invalid");
      err.statusCode = 401;
      err.data = "invalid token";
      return reject(err);
    }

    const userEmail = decodeToken.email;

    user
      .findOne({ email: userEmail })
      .then((userData) => {
        if (!userData) {
          const error = new Error("user not found");
          error.statusCode = 403;
          throw error;
        }

        const isTokenPresent = userData.expireAccessToken.some(
          (blockedToken) => blockedToken === token
        );

        if (isTokenPresent) {
          const error = new Error("invalid token");
          throw error;
        }

        resolve(userData);
      })
      .catch((err) => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        reject(err);
      });
  });
};
