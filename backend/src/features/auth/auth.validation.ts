import z from "zod";

export const CredentialSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const AccessTokenPayloadSchema = z.object({
  sub: z.string().trim().min(1),
  role: z.enum(["manager", "customer", "admin", "kitchen", "foh"]),
});

export const RefreshTokenSchema = z.uuid();
