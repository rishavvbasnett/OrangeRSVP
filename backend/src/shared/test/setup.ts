import { afterAll, beforeEach } from "vitest";
import { sql } from "drizzle-orm";
import db from "../config/db.js";
import redis from "../config/redis.js";

const assertTestDbPostgres = async () => {
  const result = await db.execute(sql`SELECT current_database() AS name`);
  const databaseName = String(result.rows[0].name);

  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Test pointing at a Non-Test Postgres database: ${databaseName}`,
    );
  }
};

const truncateAllTables = async () => {
  const result = await db.execute(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
  );
  const tableNames = result.rows.map((row) => `"${String(row.tablename)}"`);

  if (tableNames.length === 0) return;

  const tableList = tableNames.join(", ");
  await db.execute(
    sql.raw(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`),
  );
};

const clearRedisDatabase = async () => {
  await redis.flushdb();
};

const assertTestDbRedis = () => {
  const redisDbIndex = redis.options.db;

  if (redisDbIndex !== 1) {
    throw new Error(
      `Test point at a Non-Test Redis database: , ${redisDbIndex}`,
    );
  }
};

beforeEach(async () => {
  await assertTestDbPostgres();
  assertTestDbRedis();
  await truncateAllTables();
  await clearRedisDatabase();
});

afterAll(async () => {
  await db.$client.end();
  await redis.quit();
});
