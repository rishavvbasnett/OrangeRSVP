import "dotenv/config";

export const MONGODB_URI = process.env.MONGODB_URI;

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined");
export const JWT_SECRET = process.env.JWT_SECRET;

export const PORT = process.env.PORT;
