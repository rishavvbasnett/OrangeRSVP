import z from "zod";
import type { IdParamSchema } from "./shared.validation.js";
import type { role } from "../features/users/users.types.js";

export type IdParam = z.infer<typeof IdParamSchema>;

export interface AuthenticatedUser {
  id: string;
  role: role;
}
