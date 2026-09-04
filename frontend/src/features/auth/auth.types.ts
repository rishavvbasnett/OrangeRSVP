import { z } from "zod";
import { CredentialSchema, LoggedUserSchema } from "./auth.schema.ts";

export type Credential = z.infer<typeof CredentialSchema>;

export type LoggedUser = z.infer<typeof LoggedUserSchema>;

export interface AuthState {
  loggedUser: LoggedUser | null;
  setLoggedUser: (newUser: LoggedUser) => void;
  logout: () => void;
}

export type role = "customer" | "manager";

export type rolesProp = role[];
