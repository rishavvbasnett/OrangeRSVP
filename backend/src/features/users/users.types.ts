import z from "zod";
import type { UserInputSchema } from "./users.validation.js";
import { Document } from "mongoose";

export type role = "manager" | "customer" | "admin" | "kitchen" | "foh";

export type UserInput = z.infer<typeof UserInputSchema>;

export interface UserDocument extends Document {
  email: string;
  passwordHash: string;
  role: role;
}

export type UserDto = Omit<UserDocument, "passwordHash">;
