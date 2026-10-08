import { config } from "dotenv";
import z from "zod";

let envFile;
if (process.env.NODE_ENV === "development") envFile = ".env";
if (process.env.NODE_ENV === "test") envFile = ".env.test";

config({ path: envFile });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  POSTGRES_URL: z.url(),
  JWT_SECRET: z.string().min(1),
  PORT: z.coerce.number().default(3000),
  REDIS_URL: z.url(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.log("Invalid environment variables", z.treeifyError(parsedEnv.error));
  process.exit(1);
}

const env = parsedEnv.data;

export default env;
