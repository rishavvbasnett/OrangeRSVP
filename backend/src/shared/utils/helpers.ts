import bcrypt from "bcrypt";
import User from "../../features/users/users.model.js";
import * as authService from "../../features/auth/auth.service.js";
import type { role } from "../../features/users/users.types.js";
import { randomUUID } from "node:crypto";

const saltRounds = 12;

export const convert = async (value: string): Promise<string> => {
  return await bcrypt.hash(value, saltRounds);
};

export const compare = async (
  plainValue: string,
  hashedValue: string,
): Promise<boolean> => {
  return await bcrypt.compare(plainValue, hashedValue);
};

export const createToken = async (role: role) => {
  const user = await User.create({
    email: `${randomUUID()}@gmail.com`,
    role,
    passwordHash: "123",
  });
  const token = authService.createToken({ id: user.id, role: user.role });
  return token;
};
