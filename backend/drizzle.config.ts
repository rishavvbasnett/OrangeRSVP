import env from "./src/shared/config/env.js";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/features/**/*.schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: env.POSTGRES_URL,
  },
  strict: true,
  verbose: true,
});
