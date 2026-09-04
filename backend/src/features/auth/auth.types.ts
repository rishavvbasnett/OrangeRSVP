import { LoginUserSchema } from "./auth.validation.js";
import z from "zod";

export type LoginUser = z.infer<typeof LoginUserSchema>;

export interface Payload {
  id: string;
  role: string;
}
