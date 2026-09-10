import jwt from "jsonwebtoken";
import User from "../users/users.model.js";
import type { LoginUser, Payload } from "./auth.types.js";
import bcrypt from "bcrypt";
import { UnauthorizedError } from "../../shared/utils/errors.js";
import { JWT_SECRET } from "../../shared/config/env.js";

export const login = async ({ email, password }: LoginUser) => {
  const foundUser = await User.findOne({ email }).lean();
  if (!foundUser) throw new UnauthorizedError("Invalid email or password");
  const isValid = await bcrypt.compare(password, foundUser.passwordHash);
  if (!isValid) throw new UnauthorizedError("Invalid email or password");
  const userPayload: Payload = {
    id: foundUser._id.toString(),
    role: foundUser.role,
  };
  const token = createToken(userPayload);
  return {
    email: foundUser.email,
    role: foundUser.role,
    token,
  };
};

export const createToken = (payload: Payload): string => {
  return jwt.sign(payload, JWT_SECRET);
};
