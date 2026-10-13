import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../utils/errorClasses.js";
import asyncHandler from "./asyncHandler.js";
import {
  extractBearerToken,
  generateAccessTokenBlocklistKey,
  verifyAndDecodeAccessToken,
} from "../../features/auth/auth.tokens.js";
import redis from "../config/redis.js";

const authenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = extractBearerToken(req.headers.authorization);
    if (!accessToken) throw new UnauthorizedError("Access token required");

    const decodedToken = verifyAndDecodeAccessToken(accessToken);

    const blocklistCheck = await redis.exists(
      generateAccessTokenBlocklistKey(decodedToken.jti),
    );
    if (blocklistCheck === 1) throw new UnauthorizedError("Invalid token");

    req.user = {
      id: Number(decodedToken.sub),
      platformRole: decodedToken.platformRole,
    };

    next();
  },
);

export default authenticate;
