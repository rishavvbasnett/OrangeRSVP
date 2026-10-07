import z from "zod";
import {
  AccessTokenPayloadSchema,
  CredentialSchema,
  RefreshTokenSchema,
} from "./auth.validation.js";

export type AccessTokenPayload = z.infer<typeof AccessTokenPayloadSchema>;
export type Credential = z.infer<typeof CredentialSchema>;
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;
export type DecodedAccessToken = AccessTokenPayload & {
  jti: string;
  exp: number;
};
