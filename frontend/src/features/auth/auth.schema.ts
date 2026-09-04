import { z } from "zod";

export const CredentialSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const LoggedUserSchema = z.object({
  email: z.email(),
  role: z.enum(["customer", "manager"]),
  token: z.string(),
});
