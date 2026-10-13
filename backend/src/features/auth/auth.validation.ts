import z from "zod";
import { platformRole } from "../users/users.schema.js";

export const CredentialSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const DecodedAccessTokenSchema = z.object({
  sub: z.string().regex(/^[1-9]\d*$/),
  platformRole: z.enum(platformRole.enumValues),
  jti: z.string().min(1),
  iat: z.number().int(),
  exp: z.number().int(),
});
