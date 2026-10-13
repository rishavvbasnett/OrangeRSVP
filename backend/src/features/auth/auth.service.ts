import db from "../../shared/config/db.js";
import redis from "../../shared/config/redis.js";
import { eq } from "drizzle-orm";
import { UnauthorizedError } from "../../shared/utils/errorClasses.js";
import { users } from "../users/users.schema.js";
import { convertToDto, SALT_ROUNDS } from "../users/users.service.js";
import type { UserRow } from "../users/users.types.js";
import {
  blocklistAccessToken,
  generateRefreshToken,
  generateRefreshTokenKey,
  REFRESH_TOKEN_TTL_SECONDS,
  revokeRefreshToken,
  signAccessToken,
  verifyAndDecodeAccessToken,
} from "./auth.tokens.js";
import type {
  DecodedAccessToken,
  RefreshTokenRecord,
  TokenPair,
} from "./auth.types.js";
import bcrypt from "bcrypt";
import type { Credential } from "./auth.types.js";

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password";
const INVALID_SESSION_MESSAGE = "Invalid or expired session";
const INACTIVE_USER_MESSAGE = "Account deactivated. Contact support";

// Computed once at startup with the same cost as real hashes,
// so "no such user" takes as long as "wrong password".
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  "timing-equalizer-not-a-real-password",
  SALT_ROUNDS,
);

const issueTokenPair = async (user: UserRow): Promise<TokenPair> => {
  const accessToken = signAccessToken(user.id, user.platformRole);
  const refreshToken = generateRefreshToken();

  const refreshTokenRecord: RefreshTokenRecord = { userId: user.id };
  await redis.setex(
    generateRefreshTokenKey(refreshToken),
    REFRESH_TOKEN_TTL_SECONDS,
    JSON.stringify(refreshTokenRecord),
  );
  const tokenPair: TokenPair = {
    accessToken,
    refreshToken,
  };
  return tokenPair;
};

const login = async (credentials: Credential) => {
  const [foundUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, credentials.email));

  if (!foundUser) {
    await bcrypt.compare(credentials.password, DUMMY_PASSWORD_HASH);
    throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
  }

  const passwordMatches = await bcrypt.compare(
    credentials.password,
    foundUser.passwordHash,
  );

  if (!passwordMatches)
    throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);

  if (!foundUser.isActive) throw new UnauthorizedError(INACTIVE_USER_MESSAGE);

  const tokenPair = await issueTokenPair(foundUser);
  const user = convertToDto(foundUser);
  return {
    user,
    tokenPair,
  };
};

const refresh = async (refreshToken: string) => {
  const storedRefreshToken = await redis.getdel(
    generateRefreshTokenKey(refreshToken),
  );
  if (!storedRefreshToken) throw new UnauthorizedError(INVALID_SESSION_MESSAGE);

  const refreshTokenRecord: RefreshTokenRecord = JSON.parse(storedRefreshToken);

  const [foundUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, refreshTokenRecord.userId));

  if (!foundUser || !foundUser.isActive)
    throw new UnauthorizedError(INVALID_SESSION_MESSAGE);

  const tokenPair = await issueTokenPair(foundUser);
  const user = convertToDto(foundUser);
  return {
    user,
    tokenPair,
  };
};

const logout = async (
  refreshToken: string,
  accessToken: string | undefined,
): Promise<void> => {
  await revokeRefreshToken(refreshToken);
  if (!accessToken) return;

  let decodedAccessToken: DecodedAccessToken;
  try {
    decodedAccessToken = verifyAndDecodeAccessToken(accessToken);
  } catch {
    return;
  }
  await blocklistAccessToken(decodedAccessToken.jti, decodedAccessToken.exp);
};

const authService = {
  login,
  logout,
  refresh,
};

export default authService;
