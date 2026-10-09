import z from "zod";
import type { PlatformRole } from "../users/users.types.js";
import {
  CredentialSchema,
  DecodedAccessTokenSchema,
  RefreshTokenSchema,
} from "./auth.validation.js";

export type Credential = z.infer<typeof CredentialSchema>;
export type RefreshTokenBody = z.infer<typeof RefreshTokenSchema>;
export type DecodedAccessToken = z.infer<typeof DecodedAccessTokenSchema>;

export type AuthenticatedUser = {
  id: number;
  platformRole: PlatformRole;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type RefreshTokenRecord = {
  userId: number;
};
