import type { NextFunction, Request, Response } from "express";
import asyncHandler from "./asyncHandler.js";
import { redis } from "../config/redis.js";
import { TooManyRequestsError } from "../utils/errors.js";

interface RateLimitOptions {
  maxRequests: number;
  resetWindowSeconds: number;
  feature: string;
  keyGenerator: (request: Request) => string;
}

export const rateLimit = (options: RateLimitOptions) => {
  return asyncHandler(
    async (request: Request, _response: Response, next: NextFunction) => {
      const identity = options.keyGenerator(request);
      const key = `ratelimit:${options.feature}:${identity}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, options.resetWindowSeconds);
      if (count > options.maxRequests)
        throw new TooManyRequestsError("Rate limit exceeded");
      next();
    },
  );
};
