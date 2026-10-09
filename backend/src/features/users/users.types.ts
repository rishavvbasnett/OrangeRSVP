import z from "zod";
import type { users } from "./users.schema.js";
import { UserInputSchema, ProfileUpdateSchema } from "./users.validation.js";

export type UserInput = z.infer<typeof UserInputSchema>;
export type UserRow = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserDto = Omit<UserRow, "passwordHash">;
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
export type PlatformRole = UserRow["platformRole"];
