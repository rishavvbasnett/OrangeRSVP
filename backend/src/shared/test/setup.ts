import { afterAll, beforeEach } from "vitest";
import { sql } from "drizzle-orm";
import db from "../config/db.js";

const assertTestDatabase = async () => {
  const result = await db.execute(sql`SELECT current_database() AS name`);
  const databaseName = String(result.rows[0].name);

  if (!databaseName.endsWith("_test")) {
    throw new Error(`Refusing to truncate non-test database: ${databaseName}`);
  }
};

beforeEach(async () => {
  await assertTestDatabase();
  await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await db.$client.end();
});
