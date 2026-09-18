import "dotenv/config";

export const MONGODB_URI = process.env.MONGODB_URI;

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined");
export const JWT_SECRET = process.env.JWT_SECRET;

export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const PORT = process.env.PORT;
