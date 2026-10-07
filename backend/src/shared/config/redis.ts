import { Redis } from "ioredis";
import env from "./env.js";

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("error", (error) => {
  console.log("Redis error: ", error.message);
});

export default redis;
