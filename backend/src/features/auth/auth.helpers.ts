import jwt from "jsonwebtoken";
import type { AccessTokenPayload } from "./auth.types.js";
import env from "../../shared/config/env.js";
import type { IdParam } from "../../shared/shared.types.js";
import redis from "../../shared/config/redis.js";

const ACCESS_TOKEN_TTL = 10 * 60;
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;

export const generateAccessToken = (accessTokenPayload: AccessTokenPayload) => {
  return jwt.sign(accessTokenPayload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
    jwtid: crypto.randomUUID(),
    algorithm: "HS256",
  });
};

export const generateRefreshToken = async (userId: IdParam) => {
  const token = crypto.randomUUID();
  const key = `refreshToken:${token}`;
  await redis.setex(key, REFRESH_TOKEN_TTL, userId);
  return token;
};
