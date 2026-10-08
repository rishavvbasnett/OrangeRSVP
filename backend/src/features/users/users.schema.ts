import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  integer,
  text,
  boolean,
  timestamp,
  unique,
  check,
} from "drizzle-orm/pg-core";

export const platformRole = pgEnum("platform_role", ["customer", "admin"]);

export const users = pgTable(
  "users",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    platformRole: platformRole("platform_role").notNull().default("customer"),
    passwordHash: text("password_hash").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("users_email_uq").on(table.email),
    check("users_email_lowercase", sql`${table.email} = lower(${table.email})`),
  ],
);
