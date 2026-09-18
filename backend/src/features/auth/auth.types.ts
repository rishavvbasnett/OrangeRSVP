import { LoginUserSchema } from "./auth.validation.js";
import z from "zod";
import type { AuthenticatedUser } from "../../shared/shared.types.js";

export type LoginUser = z.infer<typeof LoginUserSchema>;

export type AuthTokenPayload = AuthenticatedUser;
