import User from "../users/users.model.js";
import type { Credential, AccessTokenPayload } from "./auth.types.js";
import bcrypt from "bcrypt";
import { UnauthorizedError } from "../../shared/utils/errors.js";
import { generateAccessToken, generateRefreshToken } from "./auth.helpers.js";

export const login = async ({ username, password }: Credential) => {
  const foundUser = await User.findOne({ email: username });

  if (!foundUser) throw new UnauthorizedError("Invalid email or password");

  const passwordIsCorrect = await bcrypt.compare(
    password,
    foundUser.passwordHash,
  );

  if (!passwordIsCorrect)
    throw new UnauthorizedError("Invalid email or password");

  const accessTokenPayload: AccessTokenPayload = {
    sub: foundUser._id.toString(),
    role: foundUser.role,
  };

  const accessToken = generateAccessToken(accessTokenPayload);
  const refreshToken = await generateRefreshToken(foundUser._id.toString());
  const user = {
    id: foundUser._id.toString(),
    email: foundUser.email,
    role: foundUser.role,
  };

  return {
    accessToken,
    refreshToken,
    user,
  };
};

const authService = {
  login,
};

export default authService;
