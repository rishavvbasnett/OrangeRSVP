import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import db from "../config/db.js";
import { users } from "../../features/users/users.schema.js";
import { SALT_ROUNDS } from "../../features/users/users.service.js";
import { signAccessToken } from "../../features/auth/auth.tokens.js";
import type {
  PlatformRole,
  UserRow,
} from "../../features/users/users.types.js";

export const TEST_PASSWORD = "password123";

type SeededUserWithAuth = {
  user: UserRow;
  authorization: string;
};

export const seedUser = async (
  platformRole: PlatformRole,
): Promise<UserRow> => {
  const email = `user${randomUUID()}@gmail.com`;
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, SALT_ROUNDS);

  const [savedUser] = await db
    .insert(users)
    .values({
      name: "Test User",
      email,
      passwordHash,
      platformRole,
    })
    .returning();
  return savedUser;
};

const buildAuthorization = (user: UserRow): string => {
  const accessToken = signAccessToken(user.id, user.platformRole);
  const authorization = `Bearer ${accessToken}`;
  return authorization;
};

export const createAdmin = async (): Promise<SeededUserWithAuth> => {
  const admin = await seedUser("admin");
  const authorization = buildAuthorization(admin);
  return {
    user: admin,
    authorization,
  };
};

export const createCustomer = async (): Promise<SeededUserWithAuth> => {
  const customer = await seedUser("customer");
  const authorization = buildAuthorization(customer);
  return {
    user: customer,
    authorization,
  };
};
