import { migrate } from "drizzle-orm/node-postgres/migrator";
import db from "../config/db.js";

const globalSetup = async () => {
  await migrate(db, { migrationsFolder: "./drizzle" });
  await db.$client.end();
};
export default globalSetup;
