import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import env from "./env.js";

const pool = new Pool({
  connectionString: env.POSTGRES_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (error) => {
  console.error("Postgres connection error:", error.message);
});

const db = drizzle({
  client: pool,
  logger: env.NODE_ENV === "development",
});

export default db;
