import Redis from "ioredis";
import { REDIS_URL } from "./env.js";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("error", (error) => {
  console.log("Redis error: ", error.message);
});
