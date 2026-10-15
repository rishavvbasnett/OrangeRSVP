import jwt from "jsonwebtoken";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import env from "../../shared/config/env.js";
import type { PlatformRole, UserRow } from "../users/users.types.js";
import type {
  DecodedAccessToken,
  RefreshTokenRecord,
  TokenPair,
} from "./auth.types.js";
import { DecodedAccessTokenSchema } from "./auth.validation.js";
import { UnauthorizedError } from "../../shared/utils/errorClasses.js";
import redis from "../../shared/config/redis.js";

export const ACCESS_TOKEN_TTL_SECONDS = 10 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const JWT_ISSUER = "orangersvp-api";
const JWT_AUDIENCE = "orangersvp-client";

export const signAccessToken = (
  userId: number,
  platformRole: PlatformRole,
): string => {
  const payload = { platformRole };

  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    jwtid: randomUUID(),
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    subject: String(userId),
  });

  return accessToken;
};

export const verifyAndDecodeAccessToken = (
  accessToken: string,
): DecodedAccessToken => {
  const verifiedPayload = jwt.verify(accessToken, env.JWT_SECRET, {
    algorithms: ["HS256"],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });

  const parsedPayload = DecodedAccessTokenSchema.safeParse(verifiedPayload);
  if (!parsedPayload.success) throw new UnauthorizedError("Invalid token");

  return parsedPayload.data;
};

export const signRefreshToken = async (userId: number): Promise<string> => {
  const refreshToken = randomBytes(32).toString("base64url");
  const refreshTokenRecord: RefreshTokenRecord = { userId };
  await redis.setex(
    generateRefreshTokenKey(refreshToken),
    REFRESH_TOKEN_TTL_SECONDS,
    JSON.stringify(refreshTokenRecord),
  );
  return refreshToken;
};

export const hashToken = (token: string): string => {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return tokenHash;
};

export const extractBearerToken = (
  authorizationHeader: string | undefined,
): string | null => {
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) return null;

  return token;
};

export const generateRefreshTokenKey = (refreshToken: string): string => {
  const tokenHash = hashToken(refreshToken);
  return `refreshToken:${tokenHash}`;
};

export const generateAccessTokenBlocklistKey = (jti: string): string => {
  return `blocklist:${jti}`;
};

export const revokeRefreshToken = async (refreshToken: string) => {
  await redis.del(generateRefreshTokenKey(refreshToken));
};

export const blocklistAccessToken = async (jti: string, exp: number) => {
  const key = generateAccessTokenBlocklistKey(jti);
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const secondsUntilExpiry = exp - nowInSeconds;

  if (secondsUntilExpiry > 0) await redis.setex(key, secondsUntilExpiry, "1");
};
export const issueTokenPair = async (user: UserRow): Promise<TokenPair> => {
  const accessToken = signAccessToken(user.id, user.platformRole);
  const refreshToken = await signRefreshToken(user.id);

  const tokenPair: TokenPair = {
    accessToken,
    refreshToken,
  };
  return tokenPair;
};
