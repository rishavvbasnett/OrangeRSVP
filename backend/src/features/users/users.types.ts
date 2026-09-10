import z from "zod";
import type { RegisterUserSchema } from "./users.validation.js";

export type role = "manager" | "customer" | "admin";

export type RegisterUser = z.infer<typeof RegisterUserSchema>;

export interface UserDocument {
  email: string;
  passwordHash: string;
  role: role;
}

export type PublicUser = Omit<UserDocument, "passwordHash">;
