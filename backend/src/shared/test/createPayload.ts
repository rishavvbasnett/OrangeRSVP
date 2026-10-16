import { randomUUID } from "node:crypto";
import type { NewUser } from "../../features/users/users.types.js";

export const createUserPayload = (
  overrides: Partial<NewUser> = {},
): NewUser => {
  const payload: NewUser = {
    name: `User${randomUUID()}`,
    email: `${randomUUID()}@gmail.com`,
    phone: "415-555-2671",
    passwordHash: "not-a-password-hash",
    ...overrides,
  };
  return payload;
};
