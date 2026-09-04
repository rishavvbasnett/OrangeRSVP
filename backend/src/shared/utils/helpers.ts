import bcrypt from "bcrypt";
import User from "../../features/users/users.model.js";
import * as authService from "../../features/auth/auth.service.js";
import type { role } from "../../features/users/users.types.js";

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

export const createUserAndSave = async (role: role) => {
  const user = await User.create({
    email: `${role}@test.com`,
    passwordHash: await convert("testpass"),
    role,
  });
  return user;
};

export const createUserToken = async (role: role) => {
  const user = await createUserAndSave(role);
  const token = authService.createToken({ id: user.id, role: user.role });
  return token;
};
